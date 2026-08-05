import { ComponentFixture, TestBed } from '@angular/core/testing'

import { UploadActivityListTableComponent } from './upload-activity-list-table.component'

describe('UploadActivityListTableComponent', () => {
  let component: UploadActivityListTableComponent
  let fixture: ComponentFixture<UploadActivityListTableComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UploadActivityListTableComponent],
    })
      .compileComponents()

    fixture = TestBed.createComponent(UploadActivityListTableComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnChanges', () => {
    it('should use default columns when none provided and set displayedColumns with select', () => {
      component.columns = []
      component.showCheckbox = true
      component.data = [{ code: 'A', name: 'Alpha' }]
      component.ngOnChanges({ data: {} as any })
      expect(component.activeColumns).toEqual(component.defaultColumns)
      expect(component.displayedColumns[0]).toBe('select')
    })

    it('should use provided columns and exclude select when showCheckbox is false', () => {
      component.columns = [{ key: 'foo', label: 'Foo' }]
      component.showCheckbox = false
      component.data = []
      component.ngOnChanges({ columns: {} as any })
      expect(component.activeColumns).toEqual(component.columns)
      expect(component.displayedColumns).toEqual(['foo'])
    })

    it('should clear selection and emit empty array when data or columns change', () => {
      const emitSpy = jest.spyOn(component.selectionChange, 'emit')
      component.selection.select({ code: 'A' })
      component.ngOnChanges({ data: {} as any })
      expect(component.selection.selected.length).toBe(0)
      expect(emitSpy).toHaveBeenCalledWith([])
    })

    it('should not clear selection when neither data nor columns changed', () => {
      component.selection.select({ code: 'A' })
      component.ngOnChanges({ isLoading: {} as any })
      expect(component.selection.selected.length).toBe(1)
    })
  })

  describe('ngAfterViewInit', () => {
    it('should subscribe to headerCells changes without throwing', () => {
      expect(() => component.ngAfterViewInit()).not.toThrow()
    })
  })

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const nextSpy = jest.spyOn((component as any).destroy$, 'next')
      const completeSpy = jest.spyOn((component as any).destroy$, 'complete')
      component.ngOnDestroy()
      expect(nextSpy).toHaveBeenCalled()
      expect(completeSpy).toHaveBeenCalled()
    })
  })

  describe('getLoadingCellWidth', () => {
    it('should return width when positive', () => {
      component.loadingColumnWidths = [100]
      expect(component.getLoadingCellWidth(0)).toBe(100)
    })

    it('should return null when width is 0 or missing', () => {
      component.loadingColumnWidths = [0]
      expect(component.getLoadingCellWidth(0)).toBeNull()
      expect(component.getLoadingCellWidth(5)).toBeNull()
    })
  })

  describe('checkbox handlers', () => {
    it('isAllSelected should return true when selection size equals data length', () => {
      component.dataSource.data = [{ code: 'A' }, { code: 'B' }]
      component.selection.select({ code: 'A' }, { code: 'B' })
      expect(component.isAllSelected()).toBe(true)
    })

    it('isAllSelected should return false when selection is partial', () => {
      component.dataSource.data = [{ code: 'A' }, { code: 'B' }]
      component.selection.select({ code: 'A' })
      expect(component.isAllSelected()).toBe(false)
    })

    it('masterToggle should select all rows when none selected', () => {
      component.dataSource.data = [{ code: 'A' }, { code: 'B' }]
      const emitSpy = jest.spyOn(component.selectionChange, 'emit')
      component.masterToggle()
      expect(component.selection.selected.length).toBe(2)
      expect(emitSpy).toHaveBeenCalled()
    })

    it('masterToggle should clear selection when all selected', () => {
      component.dataSource.data = [{ code: 'A' }, { code: 'B' }]
      component.selection.select({ code: 'A' }, { code: 'B' })
      component.masterToggle()
      expect(component.selection.selected.length).toBe(0)
    })

    it('checkboxLabel should return "select all" / "deselect all" when no row passed', () => {
      component.dataSource.data = [{ code: 'A' }, { code: 'B' }]
      expect(component.checkboxLabel()).toBe('select all')
      component.dataSource.data = [{ code: 'A' }]
      component.selection.select({ code: 'A' })
      expect(component.checkboxLabel()).toContain('deselect all')
    })

    it('checkboxLabel should return select/deselect row for given row', () => {
      const row = { code: 'A' }
      expect(component.checkboxLabel(row)).toBe('select row')
      component.selection.select(row)
      expect(component.checkboxLabel(row)).toBe('deselect row')
    })

    it('onRowSelect should toggle selection and emit', () => {
      const row = { code: 'A' }
      const emitSpy = jest.spyOn(component.selectionChange, 'emit')
      component.onRowSelect(row)
      expect(component.selection.isSelected(row)).toBe(true)
      expect(emitSpy).toHaveBeenCalled()
      component.onRowSelect(row)
      expect(component.selection.isSelected(row)).toBe(false)
    })
  })

  describe('isCodeField', () => {
    it('should return true for "code" case-insensitively', () => {
      expect(component.isCodeField('Code')).toBe(true)
      expect(component.isCodeField('CODE')).toBe(true)
    })

    it('should return false for other keys or empty', () => {
      expect(component.isCodeField('name')).toBe(false)
      expect(component.isCodeField('')).toBe(false)
    })
  })

  describe('sorting via dataSource', () => {
    it('should sort ascending by normalized string values', () => {
      component.columns = [{ key: 'name', label: 'Name' }]
      component.data = [{ name: 'Bravo' }, { name: 'Alpha' }]
      component.ngOnChanges({ data: {} as any })
      const sorted = component.dataSource.sortData(component.dataSource.data, { active: 'name', direction: 'asc' } as any)
      expect(sorted[0].name).toBe('Alpha')
    })

    it('should sort descending', () => {
      component.columns = [{ key: 'name', label: 'Name' }]
      component.data = [{ name: 'Alpha' }, { name: 'Bravo' }]
      component.ngOnChanges({ data: {} as any })
      const sorted = component.dataSource.sortData(component.dataSource.data, { active: 'name', direction: 'desc' } as any)
      expect(sorted[0].name).toBe('Bravo')
    })

    it('should return data unsorted when sort.active is empty', () => {
      component.data = [{ name: 'Bravo' }, { name: 'Alpha' }]
      const result = component.dataSource.sortData(component.data, { active: '', direction: '' } as any)
      expect(result).toEqual(component.data)
    })

    it('sortingDataAccessor should normalize values to trimmed strings', () => {
      const value = component.dataSource.sortingDataAccessor({ code: '  X  ' }, 'code')
      expect(value).toBe('X')
      const emptyValue = component.dataSource.sortingDataAccessor({}, 'missing')
      expect(emptyValue).toBe('')
    })
  })

  describe('private helpers via ngOnChanges side effects', () => {
    it('should compute emptyRows and fillerRows arrays', () => {
      component.data = []
      component.ngOnChanges({ data: {} as any })
      expect(Array.isArray(component.emptyRows)).toBe(true)
      expect(Array.isArray(component.fillerRows)).toBe(true)
    })

    it('should return empty fillerRows array when data fills container', () => {
      component.data = new Array(200).fill({ code: 'A' })
      component.ngOnChanges({ data: {} as any })
      expect(component.fillerRows).toEqual([])
    })
  })
})
