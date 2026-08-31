import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { Subject } from 'rxjs';

import { FracTableComponent } from './frac-table.component'

describe('FracTableComponent', () => {
  let component: FracTableComponent
  let fixture: ComponentFixture<FracTableComponent>

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FracTableComponent],
      schemas: [NO_ERRORS_SCHEMA]
    })
    fixture = TestBed.createComponent(FracTableComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    it('should prepend a select column when showCheckbox is true', () => {
      component.showCheckbox = true
      component.columns = [{ key: 'name' } as any, { key: 'age' } as any]
      component.data = [{ name: 'a' } as any]
      component.ngOnChanges()
      expect(component.displayedColumns).toEqual(['select', 'name', 'age'])
      expect(component.dataSource.data).toEqual([{ name: 'a' }])
    })

    it('should omit the select column when showCheckbox is false', () => {
      component.showCheckbox = false
      component.columns = [{ key: 'name' } as any]
      component.ngOnChanges()
      expect(component.displayedColumns).toEqual(['name'])
    })
  })

  describe('ngAfterViewInit', () => {
    it('should assign the paginator and sort inputs onto the data source when enabled', () => {
      // MatTableDataSource's paginator/sort setters need real MatPaginator/MatSort
      // instances (they read internal page/sortChange streams) — spy on the
      // assignment itself rather than fighting Angular Material's internals.
      jest.useFakeTimers()
      const dataSourceSpy = component.dataSource
      const paginatorSetter = jest.spyOn(dataSourceSpy, 'paginator', 'set').mockImplementation(() => undefined)
      const sortSetter = jest.spyOn(dataSourceSpy, 'sort', 'set').mockImplementation(() => undefined)
      component.enablePagination = true
      component.enableSorting = true
      component.paginator = new Subject() as any
      component.sort = new Subject() as any
      component.ngAfterViewInit()
      jest.runAllTimers()
      expect(paginatorSetter).toHaveBeenCalledWith(component.paginator)
      expect(sortSetter).toHaveBeenCalledWith(component.sort)
      jest.useRealTimers()
    })

    it('should skip wiring when pagination/sorting are disabled', () => {
      jest.useFakeTimers()
      component.enablePagination = false
      component.enableSorting = false
      component.paginator = {} as any
      component.sort = {} as any
      component.ngAfterViewInit()
      jest.runAllTimers()
      expect(component.dataSource.paginator).toBeFalsy()
      expect(component.dataSource.sort).toBeFalsy()
      jest.useRealTimers()
    })
  })

  describe('isAllSelected / masterToggle', () => {
    it('should report false and select all rows on toggle when none selected', () => {
      component.dataSource.data = [{ a: 1 } as any, { a: 2 } as any]
      expect(component.isAllSelected()).toBe(false)
      component.masterToggle()
      expect(component.selection.selected.length).toBe(2)
    })

    it('should report true and clear selection on toggle when all selected', () => {
      const rows = [{ a: 1 } as any, { a: 2 } as any]
      component.dataSource.data = rows
      component.selection.select(...rows)
      expect(component.isAllSelected()).toBe(true)
      component.masterToggle()
      expect(component.selection.selected.length).toBe(0)
    })
  })

  describe('checkboxLabel', () => {
    it('should describe the master checkbox as deselect when the (empty) row set is trivially "all selected"', () => {
      component.dataSource.data = []
      expect(component.checkboxLabel()).toBe('deselect all')
    })

    it('should describe the master checkbox as select when some rows exist unselected', () => {
      component.dataSource.data = [{ a: 1 } as any]
      expect(component.checkboxLabel()).toBe('select all')
    })

    it('should describe an unselected row as select', () => {
      expect(component.checkboxLabel({ a: 1 } as any)).toBe('select row')
    })

    it('should describe a selected row as deselect', () => {
      const row = { a: 1 } as any
      component.selection.select(row)
      expect(component.checkboxLabel(row)).toBe('deselect row')
    })
  })

  it('applyFilter should trim and lowercase the filter value', () => {
    component.applyFilter('  ABC  ')
    expect(component.dataSource.filter).toBe('abc')
  })

  it('onRowSelect should toggle selection and emit the current selection', () => {
    const row = { a: 1 } as any
    const emitSpy = jest.spyOn(component.selectionChange, 'emit')
    component.onRowSelect(row)
    expect(component.selection.isSelected(row)).toBe(true)
    expect(emitSpy).toHaveBeenCalledWith([row])
  })

  it('getEmptyRows should return a fixed-size array of nulls', () => {
    const rows = component.getEmptyRows()
    expect(rows.every(r => r === null)).toBe(true)
    expect(rows.length).toBeGreaterThan(0)
  })

  describe('getEmptyRowsForData', () => {
    it('should return an empty array when data already fills the container', () => {
      component.data = new Array(1000).fill({})
      expect(component.getEmptyRowsForData()).toEqual([])
    })

    it('should return filler rows when data is small', () => {
      component.data = []
      const rows = component.getEmptyRowsForData()
      expect(rows.every(r => r === null)).toBe(true)
      expect(rows.length).toBeGreaterThan(0)
    })
  })
});
