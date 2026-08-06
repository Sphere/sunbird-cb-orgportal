import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { RouterTestingModule } from '@angular/router/testing'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { EventListViewComponent } from './event-list-view.component'

describe('EventListViewComponent', () => {
  let component: EventListViewComponent
  let fixture: ComponentFixture<EventListViewComponent>
  let router: any
  let matDialog: any

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EventListViewComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: MatDialog, useValue: createSpyObj('MatDialog', ['open']) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(EventListViewComponent)
    component = fixture.componentInstance
    router = TestBed.inject(Router)
    matDialog = TestBed.inject(MatDialog)
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('sets displayedColumns from tableData when present', () => {
      component.tableData = { columns: ['a', 'b'] } as any
      component.data = [] as any
      component.ngOnInit()
      expect(component.displayedColumns).toEqual(['a', 'b'])
    })

    it('leaves displayedColumns unset when tableData is absent', () => {
      component.tableData = undefined
      component.displayedColumns = []
      component.data = [] as any
      component.ngOnInit()
      expect(component.displayedColumns).toEqual([])
    })
  })

  describe('ngOnChanges', () => {
    it('updates dataSource.data and length from the currentValue', () => {
      component.ngOnChanges({ data: { currentValue: [1, 2, 3] } } as any)
      expect(component.dataSource.data).toEqual([1, 2, 3])
      expect(component.length).toBe(3)
    })
  })

  describe('applyFilter', () => {
    it('sets a lowercased filter value (trim result is overwritten by design)', () => {
      component.applyFilter('  Hello  ')
      expect(component.dataSource.filter).toBe('  hello  ')
    })

    it('clears the filter when value is falsy', () => {
      component.dataSource.filter = 'something'
      component.applyFilter('')
      expect(component.dataSource.filter).toBe('')
    })
  })

  describe('buttonClick', () => {
    it('does nothing when tableData is not set', () => {
      component.tableData = undefined
      const emitSpy = jest.spyOn(component.actionsClick!, 'emit')
      component.buttonClick('edit', { id: 1 })
      expect(emitSpy).not.toHaveBeenCalled()
    })

    it('emits actionsClick when the action is not disabled', () => {
      component.tableData = { actions: [{ name: 'edit', disabled: false }] } as any
      const emitSpy = jest.spyOn(component.actionsClick!, 'emit')
      component.buttonClick('edit', { id: 1 })
      expect(emitSpy).toHaveBeenCalledWith({ action: 'edit', row: { id: 1 } })
    })

    it('does not emit when the matched action is disabled', () => {
      component.tableData = { actions: [{ name: 'edit', disabled: true }] } as any
      const emitSpy = jest.spyOn(component.actionsClick!, 'emit')
      component.buttonClick('edit', { id: 1 })
      expect(emitSpy).not.toHaveBeenCalled()
    })

    it('treats an unmatched action as not disabled and still emits since default is false', () => {
      component.tableData = { actions: [{ name: 'other', disabled: true }] } as any
      const emitSpy = jest.spyOn(component.actionsClick!, 'emit')
      component.buttonClick('edit', { id: 1 })
      expect(emitSpy).toHaveBeenCalledWith({ action: 'edit', row: { id: 1 } })
    })
  })

  describe('getFinalColumns', () => {
    it('returns an empty string when tableData is undefined', () => {
      component.tableData = undefined
      expect(component.getFinalColumns()).toBe('')
    })

    it('builds columns with select, hash, actions, and menu when configured', () => {
      component.tableData = {
        columns: [{ key: 'name' }, { key: 'date' }],
        needCheckBox: true,
        needHash: true,
        actions: [{ name: 'edit' }],
        needUserMenus: true,
      } as any
      const result = component.getFinalColumns()
      expect(result).toEqual(['SR', 'select', 'name', 'date', 'Actions', 'Menu'])
    })

    it('returns just the base columns when no extras are configured', () => {
      component.tableData = { columns: [{ key: 'name' }] } as any
      const result = component.getFinalColumns()
      expect(result).toEqual(['name'])
    })

    it('does not add an Actions column when actions is an empty array', () => {
      component.tableData = { columns: [{ key: 'name' }], actions: [] } as any
      const result = component.getFinalColumns()
      expect(result).toEqual(['name'])
    })
  })

  describe('isAllSelected / masterToggle', () => {
    it('isAllSelected is true when selected count matches row count', () => {
      component.dataSource.data = [{ id: 1 }, { id: 2 }]
      component.selection.select({ id: 1 }, { id: 2 })
      expect(component.isAllSelected()).toBe(true)
    })

    it('isAllSelected is false when not all rows are selected', () => {
      component.dataSource.data = [{ id: 1 }, { id: 2 }]
      component.selection.select({ id: 1 })
      expect(component.isAllSelected()).toBe(false)
    })

    it('masterToggle clears the selection when all are already selected', () => {
      component.dataSource.data = [{ id: 1 }]
      component.selection.select({ id: 1 })
      component.masterToggle()
      expect(component.selection.selected.length).toBe(0)
    })

    it('masterToggle selects all rows when not all are selected', () => {
      component.dataSource.data = [{ id: 1 }, { id: 2 }]
      component.masterToggle()
      expect(component.selection.selected.length).toBe(2)
    })
  })

  describe('filterList', () => {
    it('maps a list to the given key', () => {
      const result = component.filterList([{ name: 'a' }, { name: 'b' }], 'name')
      expect(result).toEqual(['a', 'b'])
    })
  })

  describe('checkboxLabel', () => {
    it('describes the select-all state when row is absent and all are selected', () => {
      component.dataSource.data = [{ id: 1 }]
      component.selection.select({ id: 1 })
      expect(component.checkboxLabel()).toBe('select all')
    })

    it('describes the deselect-all state when row is absent and not all are selected', () => {
      component.dataSource.data = [{ id: 1 }, { id: 2 }]
      component.selection.select({ id: 1 })
      expect(component.checkboxLabel()).toBe('deselect all')
    })

    it('describes a deselect action for an already selected row', () => {
      const row = { position: 0 }
      component.selection.select(row)
      expect(component.checkboxLabel(row)).toBe('deselect row 1')
    })

    it('describes a select action for a row that is not selected', () => {
      const row = { position: 2 }
      expect(component.checkboxLabel(row)).toBe('select row 3')
    })
  })

  describe('onRowClick', () => {
    it('emits eOnRowClick with the given event', () => {
      const emitSpy = jest.spyOn(component.eOnRowClick, 'emit')
      component.onRowClick({ id: 1 })
      expect(emitSpy).toHaveBeenCalledWith({ id: 1 })
    })
  })

  describe('onCreateClick', () => {
    it('navigates to the create-event route', () => {
      component.onCreateClick()
      expect(router.navigate).toHaveBeenCalledWith(['/app/events/create-event'])
    })
  })

  describe('showImageDialog', () => {
    it('opens the thumbnail dialog with the image config', () => {
      const img = { width: '400px', height: '300px', url: 'x.png' }
      matDialog.open.mockReturnValue({ afterClosed: () => ({ subscribe: jest.fn() }) })
      component.showImageDialog(img)
      expect(matDialog.open).toHaveBeenCalledWith(expect.anything(), {
        width: img.width,
        height: img.height,
        data: img,
      })
      expect(component.dialogRef).toBeDefined()
    })
  })
})
