import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core'
import { UploadCompetencyListTableComponent } from './upload-competency-list-table.component'

describe('UploadCompetencyListTableComponent', () => {
  let component: UploadCompetencyListTableComponent
  let fixture: ComponentFixture<UploadCompetencyListTableComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UploadCompetencyListTableComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(UploadCompetencyListTableComponent)
    component = fixture.componentInstance
  })

  it('should create', () => {
    fixture.detectChanges()
    expect(component).toBeTruthy()
  })

  describe('ngOnChanges', () => {
    it('should use default columns when no columns input provided', () => {
      component.columns = []
      component.data = []
      component.ngOnChanges({ data: new SimpleChange(undefined, [], true) })
      expect(component.activeColumns).toEqual(component.defaultColumns)
      expect(component.displayedColumns[0]).toBe('select')
    })

    it('should use provided columns when present', () => {
      component.columns = [{ key: 'name', label: 'Name' }]
      component.data = []
      component.ngOnChanges({ columns: new SimpleChange(undefined, component.columns, true) })
      expect(component.activeColumns).toEqual(component.columns)
    })

    it('should exclude select column when showCheckbox is false', () => {
      component.showCheckbox = false
      component.columns = [{ key: 'name', label: 'Name' }]
      component.data = []
      component.ngOnChanges({ columns: new SimpleChange(undefined, component.columns, true) })
      expect(component.displayedColumns).toEqual(['name'])
    })

    it('should clear selection and emit empty array when data or columns change', () => {
      const emitSpy = jest.spyOn(component.selectionChange, 'emit')
      const clearSpy = jest.spyOn(component.selection, 'clear')
      component.data = [{ code: 'A' }]
      component.ngOnChanges({ data: new SimpleChange(undefined, component.data, true) })
      expect(clearSpy).toHaveBeenCalled()
      expect(emitSpy).toHaveBeenCalledWith([])
    })

    it('should not clear selection when neither data nor columns change', () => {
      const clearSpy = jest.spyOn(component.selection, 'clear')
      component.ngOnChanges({ maxHeight: new SimpleChange(undefined, '500px', true) })
      expect(clearSpy).not.toHaveBeenCalled()
    })

    it('should compute empty rows to fill container when there is no data', () => {
      component.data = []
      component.ngOnChanges({ data: new SimpleChange(undefined, [], true) })
      // containerHeight(600) - headerHeight(40) = 560 / rowHeight(40) = 14
      expect(component.emptyRows.length).toBe(14)
      expect(component.fillerRows.length).toBe(14)
    })

    it('should compute fewer filler rows when data partially fills the container', () => {
      component.data = Array.from({ length: 10 }, (_, i) => ({ code: `C${i}` }))
      component.ngOnChanges({ data: new SimpleChange(undefined, component.data, true) })
      // available = 560 - 10*40 = 160 / 40 = 4
      expect(component.fillerRows.length).toBe(4)
    })

    it('should return no filler rows when data fills or exceeds container', () => {
      component.data = Array.from({ length: 20 }, (_, i) => ({ code: `C${i}` }))
      component.ngOnChanges({ data: new SimpleChange(undefined, component.data, true) })
      expect(component.fillerRows).toEqual([])
    })
  })

  describe('ngAfterViewInit', () => {
    it('should not throw and schedule width sync', () => {
      fixture.detectChanges()
      jest.useFakeTimers()
      expect(() => {
        component.ngAfterViewInit()
        jest.runAllTimers()
      }).not.toThrow()
      jest.useRealTimers()
    })

    it('should subscribe to headerCells changes when present', () => {
      fixture.detectChanges()
      const subscribeSpy = jest.fn()
      ;(component as any).headerCells = { changes: { subscribe: subscribeSpy } }
      component.ngAfterViewInit()
      expect(subscribeSpy).toHaveBeenCalled()
    })
  })

  describe('getLoadingCellWidth', () => {
    it('should return null when width is not set or zero', () => {
      component.loadingColumnWidths = [0]
      expect(component.getLoadingCellWidth(0)).toBeNull()
      expect(component.getLoadingCellWidth(5)).toBeNull()
    })

    it('should return width when positive', () => {
      component.loadingColumnWidths = [120]
      expect(component.getLoadingCellWidth(0)).toBe(120)
    })
  })

  describe('checkbox handlers', () => {
    beforeEach(() => {
      component.data = [{ code: 'A' }, { code: 'B' }]
      component.ngOnChanges({ data: new SimpleChange(undefined, component.data, true) })
    })

    it('isAllSelected should reflect selection state', () => {
      expect(component.isAllSelected()).toBe(false)
      component.dataSource.data.forEach(row => component.selection.select(row))
      expect(component.isAllSelected()).toBe(true)
    })

    it('masterToggle should select all when none selected, then clear when all selected', () => {
      const emitSpy = jest.spyOn(component.selectionChange, 'emit')
      component.masterToggle()
      expect(component.selection.selected.length).toBe(2)
      expect(emitSpy).toHaveBeenCalledWith(component.selection.selected)

      component.masterToggle()
      expect(component.selection.selected.length).toBe(0)
    })

    it('checkboxLabel should describe select all state when no row given', () => {
      expect(component.checkboxLabel()).toBe('select all')
      component.dataSource.data.forEach(row => component.selection.select(row))
      expect(component.checkboxLabel()).toBe('deselect all')
    })

    it('checkboxLabel should describe row selection state', () => {
      const row = component.dataSource.data[0]
      expect(component.checkboxLabel(row)).toBe('select row')
      component.selection.select(row)
      expect(component.checkboxLabel(row)).toBe('deselect row')
    })

    it('onRowSelect should toggle row and emit selection', () => {
      const emitSpy = jest.spyOn(component.selectionChange, 'emit')
      const row = component.dataSource.data[0]
      component.onRowSelect(row)
      expect(component.selection.isSelected(row)).toBe(true)
      expect(emitSpy).toHaveBeenCalledWith(component.selection.selected)

      component.onRowSelect(row)
      expect(component.selection.isSelected(row)).toBe(false)
    })
  })

  describe('field type helpers', () => {
    it('isRowInEditMode should reflect isEditing and editRows membership', () => {
      const row = { code: 'A' }
      component.isEditing = false
      component.editRows = [row]
      expect(component.isRowInEditMode(row)).toBe(false)

      component.isEditing = true
      expect(component.isRowInEditMode(row)).toBe(true)
      expect(component.isRowInEditMode({ code: 'B' })).toBe(false)
    })

    it('isTextAreaField should match name/description/type/area/level label columns', () => {
      expect(component.isTextAreaField('Name')).toBe(true)
      expect(component.isTextAreaField('description')).toBe(true)
      expect(component.isTextAreaField('type')).toBe(true)
      expect(component.isTextAreaField('area')).toBe(true)
      expect(component.isTextAreaField('level_L1_label')).toBe(true)
      expect(component.isTextAreaField('code')).toBe(false)
    })

    it('isCodeField should match only code column', () => {
      expect(component.isCodeField('Code')).toBe(true)
      expect(component.isCodeField('name')).toBe(false)
    })

    it('isTallDescriptionField should match description and level description columns', () => {
      expect(component.isTallDescriptionField('description')).toBe(true)
      expect(component.isTallDescriptionField('level_l1_description')).toBe(true)
      expect(component.isTallDescriptionField('name')).toBe(false)
    })

    it('applyFilter should trim and lowercase the dataSource filter', () => {
      fixture.detectChanges()
      component.applyFilter('  ABC ')
      expect(component.dataSource.filter).toBe('abc')
    })
  })

  describe('sorting configuration via ngOnChanges', () => {
    it('should sort by code by default when sort is available', () => {
      const sortChangeEmit = jest.fn()
      ;(component as any).sort = { direction: '', sortChangeSet: false, sortChange: { emit: sortChangeEmit } }
      component.enableSorting = true
      component.columns = [{ key: 'code', label: 'Code' }, { key: 'name', label: 'Name' }]
      component.data = [{ code: 'B', name: 'y' }, { code: 'A', name: 'x' }]
      component.ngOnChanges({ columns: new SimpleChange(undefined, component.columns, true) })

      expect((component as any).sort.active).toBe('code')
      expect((component as any).sort.direction).toBe('asc')
      expect(sortChangeEmit).toHaveBeenCalledWith({ active: 'code', direction: 'asc' })
    })

    it('should fall back to first column when no code column exists', () => {
      ;(component as any).sort = { direction: '', sortChange: { emit: jest.fn() } }
      component.columns = [{ key: 'name', label: 'Name' }]
      component.data = []
      component.ngOnChanges({ columns: new SimpleChange(undefined, component.columns, true) })
      expect((component as any).sort.active).toBe('name')
    })

    it('should not apply default sort when a sort direction already set', () => {
      const emitFn = jest.fn()
      ;(component as any).sort = { direction: 'desc', active: 'name', sortChange: { emit: emitFn } }
      component.columns = [{ key: 'code', label: 'Code' }]
      component.data = []
      component.ngOnChanges({ columns: new SimpleChange(undefined, component.columns, true) })
      expect(emitFn).not.toHaveBeenCalled()
    })

    it('should not apply default sort when sorting disabled', () => {
      component.enableSorting = false
      ;(component as any).sort = undefined
      component.columns = [{ key: 'code', label: 'Code' }]
      component.data = []
      expect(() =>
        component.ngOnChanges({ columns: new SimpleChange(undefined, component.columns, true) }),
      ).not.toThrow()
    })

    it('dataSource sortingDataAccessor should normalize values', () => {
      component.data = []
      component.ngOnChanges({ data: new SimpleChange(undefined, [], true) })
      const accessor = component.dataSource.sortingDataAccessor
      expect(accessor({ name: '  Hello  ' }, 'name')).toBe('Hello')
      expect(accessor({}, 'missing')).toBe('')
    })

    it('dataSource sortData should return unsorted copy when no active sort', () => {
      component.data = [{ code: 'B' }, { code: 'A' }]
      component.ngOnChanges({ data: new SimpleChange(undefined, component.data, true) })
      const result = component.dataSource.sortData(component.data as any, { active: '', direction: '' } as any)
      expect(result).toEqual(component.data)
    })

    it('dataSource sortData should sort ascending and descending by numeric-aware comparator', () => {
      component.data = [{ code: 'C2' }, { code: 'C10' }, { code: 'C1' }]
      component.ngOnChanges({ data: new SimpleChange(undefined, component.data, true) })
      const asc = component.dataSource.sortData(component.data as any, { active: 'code', direction: 'asc' } as any)
      expect(asc.map((r: any) => r.code)).toEqual(['C1', 'C2', 'C10'])

      const desc = component.dataSource.sortData(component.data as any, { active: 'code', direction: 'desc' } as any)
      expect(desc.map((r: any) => r.code)).toEqual(['C10', 'C2', 'C1'])
    })

    it('should configure paginator on dataSource when pagination enabled and paginator present', () => {
      component.enablePagination = true
      ;(component as any).paginator = {} as any
      component.data = []
      component.ngOnChanges({ data: new SimpleChange(undefined, [], true) })
      expect(component.dataSource.paginator).toBe((component as any).paginator)
    })
  })

  describe('syncHeaderHeight (via ngAfterViewInit)', () => {
    it('should do nothing when header row is not found in the DOM', () => {
      fixture.detectChanges()
      jest.useFakeTimers()
      expect(() => {
        component.ngAfterViewInit()
        jest.runAllTimers()
      }).not.toThrow()
      jest.useRealTimers()
    })
  })
})
