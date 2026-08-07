import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA, Renderer2 } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog'
import { of, throwError } from 'rxjs'
import { WorkAllocationPopUpComponent } from './pop-up.component'
import { WorkallocationService } from './../../../routes/home/services/workallocation.service'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('WorkAllocationPopUpComponent', () => {
  let component: WorkAllocationPopUpComponent
  let fixture: ComponentFixture<WorkAllocationPopUpComponent>
  let mockWorkallocationSrvc: jest.Mocked<WorkallocationService>
  let mockRouter: jest.Mocked<Router>
  let mockDialogRef: jest.Mocked<MatDialogRef<WorkAllocationPopUpComponent>>

  beforeEach(async () => {
    mockWorkallocationSrvc = createSpyObj('WorkallocationService', ['getAllUsers', 'addWAT', 'copyWAT', 'fetchWAT', 'getTime'])
    mockWorkallocationSrvc.getAllUsers.mockReturnValue(of({ result: { response: { channel: 'Dept', rootOrgId: 1 } } }) as any)
    mockWorkallocationSrvc.fetchWAT.mockReturnValue(of({ result: { data: [] } }) as any)
    mockWorkallocationSrvc.getTime.mockReturnValue('time')
    mockRouter = createSpyObj('Router', ['navigate'])
    mockDialogRef = createSpyObj('MatDialogRef', ['close'])

    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [WorkAllocationPopUpComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: Renderer2, useValue: createSpyObj('Renderer2', ['removeClass', 'addClass']) },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: WorkallocationService, useValue: mockWorkallocationSrvc },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(WorkAllocationPopUpComponent)
    component = fixture.componentInstance
    // Angular Ivy resolves Renderer2 via the view engine rather than normal DI overrides,
    // so the TestBed provider override above does not take effect; assign directly instead.
    ;(component as any).ren = createSpyObj('Renderer2', ['removeClass', 'addClass'])
  })

  it('should create', () => {
    fixture.detectChanges()
    expect(component).toBeTruthy()
  })

  it('ngOnInit should set displayedColumns from existing tableData, then reset tableData and fetch data', () => {
    component.tableData = { columns: [{ displayName: 'X', key: 'x' }] } as any
    component.ngOnInit()
    expect(component.viewPaginator).toBe(true)
    expect(component.tableData.columns.length).toBe(4)
    expect(mockWorkallocationSrvc.getAllUsers).toHaveBeenCalled()
    expect(mockWorkallocationSrvc.fetchWAT).toHaveBeenCalledWith('Published')
    expect(component.departmentName).toBe('Dept')
    expect(component.departmentID).toBe(1)
  })

  it('ngOnChanges should set dataSource.data and length', () => {
    component.ngOnChanges({ data: { currentValue: [{ a: 1 }, { a: 2 }] } } as any)
    expect(component.dataSource.data).toEqual([{ a: 1 }, { a: 2 }])
    expect(component.length).toBe(2)
  })

  it('goToNewWat should close dialog and navigate on success', () => {
    mockWorkallocationSrvc.addWAT.mockReturnValue(of({ result: { data: { id: 'abc' } } }) as any)
    component.goToNewWat()
    expect(mockDialogRef.close).toHaveBeenCalled()
    expect(mockRouter.navigate).toHaveBeenCalledWith(['app/workallocation/drafts/abc'])
  })

  it('goToNewWat should do nothing when no id returned', () => {
    mockWorkallocationSrvc.addWAT.mockReturnValue(of({ result: { data: {} } }) as any)
    component.goToNewWat()
    expect(mockDialogRef.close).not.toHaveBeenCalled()
    expect(mockRouter.navigate).not.toHaveBeenCalled()
  })

  it('goToCopyWat should close dialog and navigate on success', () => {
    mockWorkallocationSrvc.copyWAT.mockReturnValue(of({ result: { data: { id: 'xyz' } } }) as any)
    component.goToCopyWat()
    expect(mockDialogRef.close).toHaveBeenCalled()
    expect(mockRouter.navigate).toHaveBeenCalledWith(['app/workallocation/drafts/xyz'])
  })

  it('goToCopyWat should do nothing when no id returned', () => {
    mockWorkallocationSrvc.copyWAT.mockReturnValue(of({ result: { data: {} } }) as any)
    component.goToCopyWat()
    expect(mockRouter.navigate).not.toHaveBeenCalled()
  })

  it('applyFilter should lowercase and set filter when value provided', () => {
    component.applyFilter('  HeLLo  ')
    expect(component.isSearched).toBe(true)
    expect(component.dataSource.filter).toBe('  hello  ')
  })

  it('applyFilter should clear filter when no value provided', () => {
    component.applyFilter('')
    expect(component.dataSource.filter).toBe('')
  })

  it('buttonClick should emit actionsClick when action not disabled', () => {
    component.tableData = { columns: [], actions: [{ name: 'edit', disabled: false }] } as any
    const spy = jest.fn()
    component.actionsClick!.subscribe(spy)
    component.buttonClick('edit', { id: 1 })
    expect(spy).toHaveBeenCalledWith({ action: 'edit', row: { id: 1 } })
  })

  it('buttonClick should not emit when action is disabled', () => {
    component.tableData = { columns: [], actions: [{ name: 'edit', disabled: true }] } as any
    const spy = jest.fn()
    component.actionsClick!.subscribe(spy)
    component.buttonClick('edit', { id: 1 })
    expect(spy).not.toHaveBeenCalled()
  })

  it('buttonClick should no-op when tableData is undefined', () => {
    component.tableData = undefined
    const spy = jest.fn()
    component.actionsClick!.subscribe(spy)
    component.buttonClick('edit', {})
    expect(spy).not.toHaveBeenCalled()
  })

  it('checkState should toggle off when clicking same checked value', () => {
    jest.useFakeTimers()
    const el = { value: { id: 5 }, checked: true, _elementRef: { nativeElement: document.createElement('div') } }
    component.currentCheckedValue2 = 5 as any
    component.checkState(el)
    jest.runAllTimers()
    expect(el.checked).toBe(false)
    expect(component.currentCheckedValue2).toBeNull()
    expect(component.isBlank).toBe(true)
    jest.useRealTimers()
  })

  it('checkState should set new checked value when different', () => {
    jest.useFakeTimers()
    const el = { value: { id: 7 }, checked: false, _elementRef: { nativeElement: {} } }
    component.currentCheckedValue2 = null
    component.checkState(el)
    jest.runAllTimers()
    expect(component.currentCheckedValue2).toBe(7)
    expect(component.isBlank).toBe(false)
    jest.useRealTimers()
  })

  it('getAllUserByKey should populate dataSource.data from response', () => {
    mockWorkallocationSrvc.fetchWAT.mockReturnValue(of({
      result: {
        data: [
          { id: '1', name: 'WO1', userIds: ['a', 'b'], updatedAt: 1, updatedByName: 'u', errorCount: 0, createdAt: 2, createdByName: 'c' },
        ],
      },
    }) as any)
    component.getAllUserByKey()
    expect(component.dataSource.data.length).toBe(1)
    expect(component.dataSource.data[0].workorders).toBe('WO1')
    expect(component.dataSource.data[0].officers).toBe(2)
  })

  it('getAllUserByKey should handle missing officers length gracefully', () => {
    mockWorkallocationSrvc.fetchWAT.mockReturnValue(of({
      result: {
        data: [
          { id: '1', name: 'WO1', userIds: [], updatedAt: 1, updatedByName: 'u', errorCount: 0, createdAt: 2, createdByName: 'c' },
        ],
      },
    }) as any)
    component.getAllUserByKey()
    expect(component.dataSource.data[0].officers).toBe(0)
  })

  it('getAllUserByKey should set empty data when result.data is falsy', () => {
    mockWorkallocationSrvc.fetchWAT.mockReturnValue(of({ result: {} }) as any)
    component.getAllUserByKey()
    expect(component.dataSource.data).toEqual([])
  })

  it('getFinalColumns should return keys plus Actions/select/SR when applicable', () => {
    component.tableData = {
      columns: [{ displayName: 'A', key: 'a' }, { displayName: 'B', key: 'b' }],
      actions: [{ name: 'x' }],
      needCheckBox: true,
      needHash: true,
    } as any
    expect(component.getFinalColumns()).toEqual(['SR', 'select', 'a', 'b', 'Actions'])
  })

  it('getFinalColumns should return "" when tableData undefined', () => {
    component.tableData = undefined
    expect(component.getFinalColumns()).toBe('')
  })

  it('isAllSelected should compare selection length to data length', () => {
    component.dataSource.data = [{ id: 1 }, { id: 2 }]
    expect(component.isAllSelected()).toBe(false)
    component.selection.select({ id: 1 }, { id: 2 })
    expect(component.isAllSelected()).toBe(true)
  })

  it('filterList should map list by key', () => {
    expect(component.filterList([{ a: 1 }, { a: 2 }], 'a')).toEqual([1, 2])
  })

  it('clearSelection should reset element state', () => {
    component.tableElement = { checked: true, _elementRef: { nativeElement: document.createElement('div') } }
    component.clearSelection()
    expect(component.tableElement.checked).toBe(false)
    expect(component.currentCheckedValue2).toBeNull()
    expect(component.isBlank).toBe(true)
  })

  it('masterToggle should clear selection when all selected', () => {
    component.dataSource.data = [{ id: 1 }]
    component.selection.select({ id: 1 })
    component.masterToggle()
    expect(component.selection.selected.length).toBe(0)
  })

  it('masterToggle should select all rows when not all selected', () => {
    component.dataSource.data = [{ id: 1 }, { id: 2 }]
    component.masterToggle()
    expect(component.selection.selected.length).toBe(2)
  })

  it('checkboxLabel should return select/deselect all when no row given', () => {
    component.dataSource.data = []
    expect(component.checkboxLabel()).toBe('select all')
  })

  it('checkboxLabel should return row label based on selection', () => {
    const row = { position: 0 }
    expect(component.checkboxLabel(row)).toBe('select row 1')
    component.selection.select(row)
    expect(component.checkboxLabel(row)).toBe('deselect row 1')
  })

  it('onRowClick should emit eOnRowClick', () => {
    const spy = jest.fn()
    component.eOnRowClick.subscribe(spy)
    component.onRowClick('evt')
    expect(spy).toHaveBeenCalledWith('evt')
  })

  it('getdeptUsers error should be handled by observable error path without throwing', () => {
    mockWorkallocationSrvc.getAllUsers.mockReturnValue(throwError({ message: 'boom' }))
    expect(() => component.getdeptUsers()).not.toThrow()
  })
})
