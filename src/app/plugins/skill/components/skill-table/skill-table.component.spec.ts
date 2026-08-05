import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { SkillTableComponent } from './skill-table.component'

describe('MappingUserTableComponent', () => {
  let component: SkillTableComponent
  let fixture: ComponentFixture<SkillTableComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SkillTableComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: MatDialog, useValue: createSpyObj('MatDialog', ['open']) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillTableComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnChanges', () => {
    it('should set dataSource.data and length from currentValue, and reset paginator', () => {
      component.paginator = { firstPage: jest.fn() } as any
      component.ngOnChanges({ data: { currentValue: [{ id: 1 }, { id: 2 }] } } as any)
      expect(component.dataSource.data).toEqual([{ id: 1 }, { id: 2 }])
      expect(component.length).toBe(2)
      expect(component.paginator.firstPage).toHaveBeenCalled()
    })
  })

  describe('ngOnInit', () => {
    it('should set displayedColumns from tableData.columns', () => {
      component.tableData = { columns: ['a', 'b'] }
      component.ngOnInit()
      expect(component.displayedColumns).toEqual(['a', 'b'])
    })

    it('should set dataSource.data from data input when present', () => {
      component.tableData = undefined
      component.data = [{ id: 1 }] as any
      component.ngOnInit()
      expect(component.dataSource.data).toEqual([{ id: 1 }])
    })
  })

  describe('keyup', () => {
    it('should set query and push into modelChanged', () => {
      const nextSpy = jest.spyOn(component.modelChanged, 'next')
      component.keyup('abc')
      expect(component.query).toBe('abc')
      expect(nextSpy).toHaveBeenCalledWith('abc')
    })

    it('should call fetchUserList and update dataSource when a search string is entered', done => {
      (component.userAutoCompleteService.fetchUserList as jest.Mock).mockReturnValue(of([{ id: 9 }]))
      component.ngOnInit()
      component.keyup('john')
      setTimeout(() => {
        expect(component.userAutoCompleteService.fetchUserList).toHaveBeenCalledWith('john')
        done()
      }, 1100)
    })
  })

  describe('applyFilter', () => {
    it('should lowercase and trim filter value', () => {
      component.applyFilter('  Test  ')
      expect(component.dataSource.filter).toBe('test')
    })

    it('should clear filter when falsy value passed', () => {
      component.applyFilter(null)
      expect(component.dataSource.filter).toBe('')
    })
  })

  describe('buttonClick', () => {
    it('should emit actionsClick when action is not disabled', () => {
      component.tableData = { actions: [{ name: 'edit', disabled: false }] }
      const emitSpy = jest.spyOn(component.actionsClick as any, 'emit')
      component.buttonClick('edit', { id: 1 })
      expect(emitSpy).toHaveBeenCalledWith({ action: 'edit', row: { id: 1 } })
    })

    it('should not emit when action is disabled', () => {
      component.tableData = { actions: [{ name: 'edit', disabled: true }] }
      const emitSpy = jest.spyOn(component.actionsClick as any, 'emit')
      component.buttonClick('edit', { id: 1 })
      expect(emitSpy).not.toHaveBeenCalled()
    })

    it('should do nothing when tableData is not set', () => {
      component.tableData = undefined
      expect(() => component.buttonClick('edit', {})).not.toThrow()
    })
  })

  describe('getFinalColumns', () => {
    it('should return columns array with select, SR, Actions and Menu when applicable', () => {
      component.tableData = {
        columns: [{ key: 'name' }, { key: 'code' }],
        needCheckBox: true,
        needHash: true,
        actions: [{ name: 'edit' }],
        needUserMenus: true,
      }
      const result = component.getFinalColumns()
      expect(result).toEqual(['SR', 'select', 'name', 'code', 'Actions', 'Menu'])
    })

    it('should return empty string when tableData is undefined', () => {
      component.tableData = undefined
      expect(component.getFinalColumns()).toBe('')
    })

    it('should return plain columns when no flags set', () => {
      component.tableData = { columns: [{ key: 'name' }] }
      expect(component.getFinalColumns()).toEqual(['name'])
    })
  })

  describe('isAllSelected / toggleAllRows', () => {
    it('should return true when selection matches data length', () => {
      component.dataSource.data = [{ id: 1 }, { id: 2 }]
      component.selection.select({ id: 1 }, { id: 2 })
      expect(component.isAllSelected()).toBe(true)
    })

    it('toggleAllRows should select all when not all selected', () => {
      component.dataSource.data = [{ id: 1 }, { id: 2 }]
      component.toggleAllRows()
      expect(component.selection.selected.length).toBe(2)
      expect(component.selectedAll).toBe(true)
    })

    it('toggleAllRows should clear selection when all selected', () => {
      component.dataSource.data = [{ id: 1 }, { id: 2 }]
      component.selection.select({ id: 1 }, { id: 2 })
      component.toggleAllRows()
      expect(component.selection.selected.length).toBe(0)
      expect(component.selectedAll).toBe(false)
    })
  })

  describe('filterList', () => {
    it('should map list by key', () => {
      const result = component.filterList([{ id: 1 }, { id: 2 }], 'id')
      expect(result).toEqual([1, 2])
    })
  })

  describe('onRowClick / onButtonClick / onSearchEnter', () => {
    it('onRowClick should emit eOnRowClick', () => {
      const emitSpy = jest.spyOn(component.eOnRowClick, 'emit')
      component.onRowClick({ id: 1 })
      expect(emitSpy).toHaveBeenCalledWith({ id: 1 })
    })

    it('onButtonClick should emit eOnButtonClick with type and event', () => {
      const emitSpy = jest.spyOn(component.eOnButtonClick, 'emit')
      component.onButtonClick('click', { id: 1 })
      expect(emitSpy).toHaveBeenCalledWith({ type: 'click', event: { id: 1 } })
    })

    it('onSearchEnter should emit searchByEnterKey with target value', () => {
      const emitSpy = jest.spyOn(component.searchByEnterKey, 'emit')
      component.onSearchEnter({ target: { value: 'abc' } })
      expect(emitSpy).toHaveBeenCalledWith('abc')
    })
  })

  describe('selectRow', () => {
    it('should push row when checked', () => {
      component.selectedRows = []
      component.selectRow({ checked: true }, { userId: 1 })
      expect(component.selectedRows).toEqual([{ userId: 1 }])
      expect(component.selectedRowLength).toBe(true)
    })

    it('should remove row when unchecked', () => {
      component.selectedRows = [{ userId: 1 }]
      component.selectRow({ checked: false }, { userId: 1 })
      expect(component.selectedRows).toEqual([])
      expect(component.selectedRowLength).toBe(false)
    })
  })

  describe('filterTable', () => {
    it('should open FilterDialogComponent and construct selected filter on response', () => {
      (component.dialog.open as jest.Mock).mockReturnValue({ afterClosed: () => of({ foo: 'bar' }) })
      component.filterTable()
      expect(component.selectedFilters).toEqual([{ label: 'foo', item: 'bar' }])
    })

    it('should not update selectedFilters when dialog closed with no response', () => {
      (component.dialog.open as jest.Mock).mockReturnValue({ afterClosed: () => of(undefined) })
      component.selectedFilters = ['existing']
      component.filterTable()
      expect(component.selectedFilters).toEqual(['existing'])
    })
  })

  describe('constuctSelectedFilter', () => {
    it('should build selectedFilters skipping empty values', () => {
      const result = component.constuctSelectedFilter({ a: 'x', b: '', c: null })
      expect(result).toEqual([{ label: 'a', item: 'x' }])
    })
  })

  describe('performBtnAction', () => {
    it('should call addCompetency when action matches and selectedAll is true', () => {
      component.selectedAll = true
      const spy = jest.spyOn(component, 'addCompetency').mockImplementation(() => undefined)
      component.performBtnAction({ actioName: 'addCompetency' })
      expect(spy).toHaveBeenCalled()
    })

    it('should call resetAssessment when action matches and selectedRowLength is true', () => {
      component.selectedAll = false
      component.selectedRowLength = true
      const spy = jest.spyOn(component, 'resetAssessment').mockImplementation(() => undefined)
      component.performBtnAction({ actioName: 'resetAssessment' })
      expect(spy).toHaveBeenCalled()
    })

    it('should do nothing when neither selectedAll nor selectedRowLength', () => {
      component.selectedAll = false
      component.selectedRowLength = false
      const spy = jest.spyOn(component, 'addCompetency').mockImplementation(() => undefined)
      component.performBtnAction({ actioName: 'addCompetency' })
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('addCompetency / resetAssessment', () => {
    it('addCompetency should open dialog', () => {
      (component.dialog.open as jest.Mock).mockReturnValue({ afterClosed: () => of(true) })
      expect(() => component.addCompetency()).not.toThrow()
      expect(component.dialog.open).toHaveBeenCalled()
    })

    it('resetAssessment should open dialog', () => {
      (component.dialog.open as jest.Mock).mockReturnValue({ afterClosed: () => of(true) })
      expect(() => component.resetAssessment()).not.toThrow()
      expect(component.dialog.open).toHaveBeenCalled()
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
})
