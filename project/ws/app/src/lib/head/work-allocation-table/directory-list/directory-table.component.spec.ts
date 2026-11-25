import { UIDirectoryTableComponent } from './directory-table.component'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('UIDirectoryTableComponent', () => {
  let component: UIDirectoryTableComponent
  let router: any

  beforeEach(() => {
    router = createSpyObj('Router', ['navigate'])
    component = new UIDirectoryTableComponent(router)
    component.paginator = { firstPage: jest.fn() } as any
  })

  it('should be created', () => {
    expect(component).toBeTruthy()
    expect(component.dataSource).toBeTruthy()
  })

  it('ngOnInit assigns data/paginator/sort to the dataSource', () => {
    component.tableData = { columns: [] }
    component.data = [{ a: 1 }] as any
    component.sort = {} as any
    component.ngOnInit()
    expect(component.dataSource.data).toEqual([{ a: 1 }])
    expect(component.dataSource.paginator).toBe(component.paginator)
    expect(component.dataSource.sort).toBe(component.sort)
  })

  it('ngOnChanges updates tableData/data, length, and resets to first page', () => {
    component.ngOnChanges({
      tableData: { currentValue: { columns: [] } } as any,
      data: { currentValue: [{ a: 1 }, { a: 2 }] } as any,
    })
    expect(component.tableData).toEqual({ columns: [] })
    expect(component.dataSource.data).toEqual([{ a: 1 }, { a: 2 }])
    expect(component.length).toBe(2)
    expect(component.paginator.firstPage).toHaveBeenCalled()
  })

  it('ngAfterViewInit does not throw', () => {
    expect(() => component.ngAfterViewInit()).not.toThrow()
  })

  describe('applyFilter', () => {
    it('lowercases and applies filterValue when truthy', () => {
      component.applyFilter('  Hello  ')
      expect(component.dataSource.filter).toBe('  hello  ')
    })

    it('clears filter when filterValue is falsy', () => {
      component.applyFilter('')
      expect(component.dataSource.filter).toBe('')
    })
  })

  describe('buttonClick', () => {
    it('emits actionsClick when action is not disabled', () => {
      component.tableData = { actions: [{ name: 'edit', disabled: false }] }
      const emitSpy = jest.spyOn(component.actionsClick!, 'emit')
      component.buttonClick('edit', { id: 1 })
      expect(emitSpy).toHaveBeenCalledWith({ action: 'edit', row: { id: 1 } })
    })

    it('does not emit when action is disabled', () => {
      component.tableData = { actions: [{ name: 'edit', disabled: true }] }
      const emitSpy = jest.spyOn(component.actionsClick!, 'emit')
      component.buttonClick('edit', { id: 1 })
      expect(emitSpy).not.toHaveBeenCalled()
    })

    it('does nothing when tableData is not set', () => {
      component.tableData = undefined as any
      const emitSpy = jest.spyOn(component.actionsClick!, 'emit')
      component.buttonClick('edit', { id: 1 })
      expect(emitSpy).not.toHaveBeenCalled()
    })
  })

  describe('getFinalColumns', () => {
    it('returns empty string when tableData is undefined', () => {
      component.tableData = undefined as any
      expect(component.getFinalColumns()).toBe('')
    })

    it('builds columns with select/SR/Actions prefixes and suffix', () => {
      component.tableData = {
        columns: [{ key: 'name' }, { key: 'email' }],
        needCheckBox: true,
        needHash: true,
        actions: [{ name: 'edit' }],
      }
      expect(component.getFinalColumns()).toEqual(['SR', 'select', 'name', 'email', 'Actions'])
    })

    it('omits optional columns when flags are unset', () => {
      component.tableData = { columns: [{ key: 'name' }] }
      expect(component.getFinalColumns()).toEqual(['name'])
    })
  })

  describe('selection helpers', () => {
    beforeEach(() => {
      component.dataSource.data = [{ position: 0 }, { position: 1 }]
    })

    it('isAllSelected reflects whether all rows are selected', () => {
      expect(component.isAllSelected()).toBe(false)
      component.dataSource.data.forEach((r: any) => component.selection.select(r))
      expect(component.isAllSelected()).toBe(true)
    })

    it('masterToggle selects all when not all selected, clears when all selected', () => {
      component.masterToggle()
      expect(component.selection.selected).toHaveLength(2)
      component.masterToggle()
      expect(component.selection.selected).toHaveLength(0)
    })

    it('checkboxLabel with no row is inverted: reports "deselect all" when nothing is selected', () => {
      // NOTE: source has `isAllSelected() ? 'select' : 'deselect'`, so the label
      // reads backwards from its apparent intent. Asserting current behavior as-is.
      component.selection.clear()
      expect(component.checkboxLabel()).toBe('deselect all')
      component.dataSource.data.forEach((r: any) => component.selection.select(r))
      expect(component.checkboxLabel()).toBe('select all')
    })

    it('checkboxLabel returns row-specific label based on selection state', () => {
      const row = { position: 0 }
      expect(component.checkboxLabel(row)).toBe('select row 1')
      component.selection.select(row)
      expect(component.checkboxLabel(row)).toBe('deselect row 1')
    })
  })

  it('filterList maps a list to the given key', () => {
    expect(component.filterList([{ a: 1 }, { a: 2 }], 'a')).toEqual([1, 2])
  })

  it('onRowClick emits eOnRowClick', () => {
    const emitSpy = jest.spyOn(component.eOnRowClick, 'emit')
    component.onRowClick({ id: 1 })
    expect(emitSpy).toHaveBeenCalledWith({ id: 1 })
  })

  it('gotoCreateNew navigates to the create-department route', () => {
    component.selectedDepartment = 'dept1'
    component.gotoCreateNew()
    expect(router.navigate).toHaveBeenCalledWith(['/app/home/dept1/create-department', { needAddAdmin: true }])
  })
})
