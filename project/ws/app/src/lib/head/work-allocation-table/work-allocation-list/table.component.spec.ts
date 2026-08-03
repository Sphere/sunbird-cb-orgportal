import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { MatMenuModule } from '@angular/material/menu'
import { of, throwError } from 'rxjs'
import { WorkAllocationTableComponent } from './table.component'
import { CreateMDOService } from '../create-mdo.services'
import { WorkallocationService } from '../../../routes/home/services/workallocation.service'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('WorkAllocationTableComponent', () => {
  let component: WorkAllocationTableComponent
  let fixture: ComponentFixture<WorkAllocationTableComponent>
  let mockRouter: jest.Mocked<Router>
  let mockDialog: any
  let mockCreateMDOService: jest.Mocked<CreateMDOService>
  let mockSnackBar: any
  let mockWrkAllocServ: jest.Mocked<WorkallocationService>
  let paramsSubject: any

  beforeEach(async () => {
    paramsSubject = of({})
    mockRouter = createSpyObj('Router', ['navigate'])
    mockDialog = { open: jest.fn() }
    mockCreateMDOService = createSpyObj('CreateMDOService', ['assignAdminToDepartment'])
    mockSnackBar = { open: jest.fn() }
    mockWrkAllocServ = createSpyObj('WorkallocationService', ['getPDF'])

    await TestBed.configureTestingModule({
      imports: [MatMenuModule],
      declarations: [WorkAllocationTableComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { params: paramsSubject } },
        { provide: CreateMDOService, useValue: mockCreateMDOService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: WorkallocationService, useValue: mockWrkAllocServ },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(WorkAllocationTableComponent)
    component = fixture.componentInstance
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should set displayedColumns from tableData and load data', () => {
      component.tableData = {
        columns: [{ displayName: 'Name', key: 'name' as any }],
        actions: [],
        needHash: false,
        needCheckBox: false,
        needUserMenus: false,
      } as any
      component.data = [{ id: 1 }] as any
      component.ngOnInit()

      expect(component.displayedColumns).toEqual(component.tableData.columns)
      expect(component.dataSource.data).toEqual(component.data)
      expect(component.viewPaginator).toBe(true)
    })

    it('should set departmentRole/departmentId and enable create-user flags from route params', async () => {
      TestBed.resetTestingModule()
      await TestBed.configureTestingModule({
        imports: [MatMenuModule],
        declarations: [WorkAllocationTableComponent],
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: { params: of({ currentDept: 'dept1', roleId: 'role1' }) } },
          { provide: CreateMDOService, useValue: mockCreateMDOService },
          { provide: MatDialog, useValue: mockDialog },
          { provide: MatSnackBar, useValue: mockSnackBar },
          { provide: WorkallocationService, useValue: mockWrkAllocServ },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      }).compileComponents()
      fixture = TestBed.createComponent(WorkAllocationTableComponent)
      component = fixture.componentInstance
      component.needCreateUser = undefined
      component.ngOnInit()

      expect(component.departmentRole).toBe('dept1')
      expect(component.departmentId).toBe('role1')
      expect(component.needAddAdmin).toBe(true)
      expect(component.needCreateUser).toBe(true)
    })

    it('should use inputDepartmentId when departmentId is not set from route', () => {
      component.inputDepartmentId = 'input-dept'
      component.ngOnInit()

      expect(component.departmentId).toBe('input-dept')
    })
  })

  describe('ngOnChanges', () => {
    it('should show no data after timeout when data list is empty', () => {
      jest.useFakeTimers()
      component.ngOnChanges({ data: { currentValue: [] } } as any)

      expect(component.length).toBe(0)
      expect(component.showNoData).toBe(false)
      expect(component.showLoading).toBe(true)

      jest.advanceTimersByTime(1000)

      expect(component.showNoData).toBe(true)
      expect(component.showLoading).toBe(false)
      jest.useRealTimers()
    })

    it('should not show no-data if showLoading becomes false before timeout fires', () => {
      jest.useFakeTimers()
      component.ngOnChanges({ data: { currentValue: [] } } as any)
      component.showLoading = false

      jest.advanceTimersByTime(1000)

      expect(component.showNoData).toBe(false)
      jest.useRealTimers()
    })

    it('should clear no-data/loading flags when data is non-empty', () => {
      component.ngOnChanges({ data: { currentValue: [{ id: 1 }, { id: 2 }] } } as any)

      expect(component.length).toBe(2)
      expect(component.showNoData).toBe(false)
      expect(component.showLoading).toBe(false)
    })
  })

  describe('applyFilter', () => {
    it('should set filter based on current (bugged) implementation using non-trimmed lowercase value', () => {
      component.applyFilter('  Hello  ')
      expect(component.dataSource.filter).toBe('  hello  ')
    })

    it('should clear the filter when no value is passed', () => {
      component.applyFilter(null)
      expect(component.dataSource.filter).toBe('')
    })
  })

  describe('buttonClick', () => {
    it('should fetch PDF and open a blob url for a row', () => {
      const originalCreateObjectURL = URL.createObjectURL
      const originalOpen = window.open
      URL.createObjectURL = jest.fn().mockReturnValue('blob:url')
      window.open = jest.fn()
      mockWrkAllocServ.getPDF.mockReturnValue(of('pdf-data') as any)

      component.buttonClick({ id: 'row1' })

      expect(mockWrkAllocServ.getPDF).toHaveBeenCalledWith('row1')
      expect(window.open).toHaveBeenCalledWith('blob:url')

      URL.createObjectURL = originalCreateObjectURL
      window.open = originalOpen
    })

    it('should do nothing when row is falsy', () => {
      component.buttonClick(null)
      expect(mockWrkAllocServ.getPDF).not.toHaveBeenCalled()
    })
  })

  describe('blobToSaveAs', () => {
    it('should create a link and trigger a click to download the blob', () => {
      const appendSpy = jest.spyOn(document.body, 'appendChild')
      const removeSpy = jest.spyOn(document.body, 'removeChild')
      const originalCreateObjectURL = window.URL.createObjectURL
      window.URL.createObjectURL = jest.fn().mockReturnValue('blob:url')

      component.blobToSaveAs('file.pdf', new Blob(['data']))

      expect(appendSpy).toHaveBeenCalled()
      expect(removeSpy).toHaveBeenCalled()

      window.URL.createObjectURL = originalCreateObjectURL
      appendSpy.mockRestore()
      removeSpy.mockRestore()
    })
  })

  describe('selectWorkOrder', () => {
    it('should emit the selected work order', () => {
      const emitSpy = jest.spyOn(component.eOnRowClick, 'emit')
      component.selectWorkOrder({ id: 1 })
      expect(emitSpy).toHaveBeenCalledWith({ id: 1 })
    })
  })

  describe('getFinalColumns', () => {
    it('should return empty string when tableData is undefined', () => {
      component.tableData = undefined
      expect(component.getFinalColumns()).toBe('')
    })

    it('should return column keys plus select/SR/Actions/Menu when flags are set', () => {
      component.tableData = {
        columns: [{ displayName: 'Name', key: 'name' as any }, { displayName: 'Age', key: 'age' as any }],
        actions: [{ name: 'a', icon: 'i', type: 't', label: 'l' } as any],
        needHash: true,
        needCheckBox: true,
        needUserMenus: true,
      } as any

      const result = component.getFinalColumns() as string[]
      expect(result).toEqual(['SR', 'select', 'name', 'age', 'Actions', 'Menu'])
    })

    it('should not add Actions when actions array is empty', () => {
      component.tableData = {
        columns: [{ displayName: 'Name', key: 'name' as any }],
        actions: [],
        needHash: false,
        needCheckBox: false,
        needUserMenus: false,
      } as any

      const result = component.getFinalColumns() as string[]
      expect(result).toEqual(['name'])
    })
  })

  describe('openPopup', () => {
    it('should assign admin to department and navigate on success', () => {
      component.departmentId = 'dept1'
      component.departmentRole = 'role1'
      mockDialog.open.mockReturnValue({
        afterClosed: () => of({ data: [{ userId: 'u1' }] }),
      })
      mockCreateMDOService.assignAdminToDepartment.mockReturnValue(of(true))

      component.openPopup()

      expect(mockCreateMDOService.assignAdminToDepartment).toHaveBeenCalledWith('u1', 'dept1', 'MDO_ADMIN')
      expect(mockSnackBar.open).toHaveBeenCalledWith('Admin assigned Successfully')
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/directory', { department: 'role1' }])
    })

    it('should not call assignAdminToDepartment when departmentId is not set', () => {
      component.departmentId = undefined
      mockDialog.open.mockReturnValue({
        afterClosed: () => of({ data: [{ userId: 'u1' }] }),
      })

      component.openPopup()

      expect(mockCreateMDOService.assignAdminToDepartment).not.toHaveBeenCalled()
    })

    it('should show snackbar with error message when assignment fails', () => {
      component.departmentId = 'dept1'
      component.departmentRole = 'role1'
      mockDialog.open.mockReturnValue({
        afterClosed: () => of({ data: [{ userId: 'u1' }] }),
      })
      mockCreateMDOService.assignAdminToDepartment.mockReturnValue(throwError({ error: { message: 'failed' } }))

      component.openPopup()

      expect(mockSnackBar.open).toHaveBeenCalledWith('failed', 'X', { duration: 5000 })
    })
  })

  describe('isAllSelected', () => {
    it('should return true when all rows are selected', () => {
      component.dataSource.data = [{ id: 1 }, { id: 2 }]
      component.selection.select({ id: 1 }, { id: 2 })
      expect(component.isAllSelected()).toBe(true)
    })

    it('should return false when not all rows are selected', () => {
      component.dataSource.data = [{ id: 1 }, { id: 2 }]
      component.selection.select({ id: 1 })
      expect(component.isAllSelected()).toBe(false)
    })
  })

  describe('filterList', () => {
    it('should map a list to a given key', () => {
      const result = component.filterList([{ name: 'a' }, { name: 'b' }], 'name')
      expect(result).toEqual(['a', 'b'])
    })
  })

  describe('masterToggle', () => {
    it('should select all rows when not all selected', () => {
      component.dataSource.data = [{ id: 1 }, { id: 2 }]
      component.masterToggle()
      expect(component.selection.selected.length).toBe(2)
    })

    it('should clear selection when all rows are selected', () => {
      component.dataSource.data = [{ id: 1 }, { id: 2 }]
      component.selection.select({ id: 1 }, { id: 2 })
      component.masterToggle()
      expect(component.selection.selected.length).toBe(0)
    })
  })

  describe('checkboxLabel', () => {
    it('should return "deselect all" when no row passed and not all selected (current label logic)', () => {
      component.dataSource.data = [{ id: 1 }]
      expect(component.checkboxLabel()).toBe('deselect all')
    })

    it('should return "select all" when no row passed and all selected (current label logic)', () => {
      component.dataSource.data = [{ id: 1 }]
      component.selection.select({ id: 1 })
      expect(component.checkboxLabel()).toBe('select all')
    })

    it('should return select-row label for an unselected row', () => {
      const row = { position: 0 }
      expect(component.checkboxLabel(row)).toBe('select row 1')
    })

    it('should return deselect-row label for a selected row', () => {
      const row = { position: 0 }
      component.selection.select(row)
      expect(component.checkboxLabel(row)).toBe('deselect row 1')
    })
  })

  describe('onRowClick', () => {
    it('should emit event and navigate to drafts when fromdata is DRAFT', () => {
      const emitSpy = jest.spyOn(component.eOnRowClick, 'emit')
      component.onRowClick({ fromdata: 'draft', id: 'x1' })

      expect(emitSpy).toHaveBeenCalled()
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/workallocation/drafts', 'x1'])
    })

    it('should navigate to published when fromdata is PUBLISHED', () => {
      component.onRowClick({ fromdata: 'published', id: 'x2' })
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/workallocation/published', 'x2'])
    })

    it('should not navigate for unrecognized fromdata', () => {
      component.onRowClick({ fromdata: 'other', id: 'x3' })
      expect(mockRouter.navigate).not.toHaveBeenCalledWith(['/app/workallocation/drafts', 'x3'])
      expect(mockRouter.navigate).not.toHaveBeenCalledWith(['/app/workallocation/published', 'x3'])
    })
  })

  describe('gotoCreateUser', () => {
    it('should navigate to create-user route with department query params', () => {
      component.departmentId = 'dept1'
      component.departmentRole = 'role1'
      component.gotoCreateUser()

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/app/home/create-user'],
        { queryParams: { id: 'dept1', currentDept: 'role1' } },
      )
    })
  })
})
