// ngx-export-as pulls in html2pdf.js, whose CJS bundle statically imports ESM jspdf
// internals that Jest can't parse. Mock it out before the component (which imports
// ExportAsService directly) gets loaded.
jest.mock('ngx-export-as', () => ({ ExportAsService: jest.fn() }))

import { UntypedFormBuilder } from '@angular/forms'
import { of } from 'rxjs'
import { CreateWorkallocationComponent } from './create-workallocation.component'

describe('CreateWorkallocationComponent', () => {
  let component: CreateWorkallocationComponent
  let exportAsService: any
  let snackBar: any
  let allocateSrvc: any
  let router: any
  let dialog: any
  let configSvc: any
  let fb: UntypedFormBuilder

  beforeEach(() => {
    fb = new UntypedFormBuilder()

    exportAsService = {
      save: jest.fn().mockReturnValue(of({})),
    }
    snackBar = {
      open: jest.fn(),
    }
    allocateSrvc = {
      onSearchUser: jest.fn().mockReturnValue(of({ result: { data: [] } })),
      onSearchRole: jest.fn().mockReturnValue(of([])),
      onSearchPosition: jest.fn().mockReturnValue(of({ responseData: [] })),
      createAllocation: jest.fn().mockReturnValue(of({})),
      getAllocationDetails: jest.fn().mockReturnValue(of({})),
      updateAllocation: jest.fn().mockReturnValue(of({})),
    }
    router = {
      navigate: jest.fn(),
    }
    dialog = {
      open: jest.fn(),
    }
    configSvc = {
      unMappedUser: {
        channel: 'testChannel',
        rootOrgId: 'testRootOrgId',
      },
    }

    component = new CreateWorkallocationComponent(
      exportAsService, snackBar, fb, allocateSrvc, router, dialog, configSvc,
    )
    // provide inputvar since @ViewChild is not resolved outside TestBed
    component.inputvar = { nativeElement: { value: '' } } as any
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize form in constructor', () => {
    expect(component.newAllocationForm).toBeDefined()
    expect(component.selectedIndex).toBe(0)
    expect(component.newAllocationForm.get('rolelist')).toBeDefined()
  })

  describe('ngOnInit', () => {
    it('should set tabsData and call getdeptUsers', () => {
      const spy = jest.spyOn(component, 'getdeptUsers')
      component.ngOnInit()
      expect(component.tabsData.length).toBe(2)
      expect(component.tabsData[0].key).toBe('officer')
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('getdeptUsers', () => {
    it('should set departmentName and departmentID from configSvc', () => {
      component.getdeptUsers()
      expect(component.departmentName).toBe('testChannel')
      expect(component.departmentID).toBe('testRootOrgId')
    })
  })

  describe('export', () => {
    it('should call exportAsService.save', () => {
      component.export()
      expect(exportAsService.save).toHaveBeenCalledWith(component.config, 'WorkAllocation')
    })
  })

  describe('pdfCallbackFn', () => {
    it('should iterate over pages and set text/footer', () => {
      const pdf = {
        internal: {
          getNumberOfPages: jest.fn().mockReturnValue(2),
          pageSize: {
            getWidth: jest.fn().mockReturnValue(800),
            getHeight: jest.fn().mockReturnValue(600),
          },
        },
        setPage: jest.fn(),
        text: jest.fn(),
      }
      component.pdfCallbackFn(pdf)
      expect(pdf.setPage).toHaveBeenCalledTimes(2)
      expect(pdf.text).toHaveBeenCalledTimes(2)
    })
  })

  describe('onSideNavTabClick', () => {
    it('should set currentTab and scroll into view if element exists', () => {
      const el = document.createElement('div')
      el.id = 'officer'
      el.scrollIntoView = jest.fn()
      document.body.appendChild(el)

      component.onSideNavTabClick('officer')
      expect(component.currentTab).toBe('officer')
      expect(el.scrollIntoView).toHaveBeenCalled()
      document.body.removeChild(el)
    })

    it('should not throw when element does not exist', () => {
      expect(() => component.onSideNavTabClick('nonexistent')).not.toThrow()
      expect(component.currentTab).toBe('nonexistent')
    })
  })

  describe('setRole', () => {
    it('should push new roles into rolelist form array', () => {
      component.formdata.rolelist = [{ name: 'Role1', childNodes: 'child1' }]
      const before = (component.newAllocationForm.get('rolelist') as any).length
      component.setRole()
      const after = (component.newAllocationForm.get('rolelist') as any).length
      expect(after).toBe(before + 1)
    })
  })

  describe('newRole', () => {
    it('should return a form group with name and childNodes controls', () => {
      const group = component.newRole()
      expect(group.get('name')).toBeDefined()
      expect(group.get('childNodes')).toBeDefined()
    })
  })

  describe('newroleControls', () => {
    it('should return controls of rolelist form array', () => {
      expect(component.newroleControls).toBeDefined()
      expect(Array.isArray(component.newroleControls)).toBe(true)
    })
  })

  describe('onSearchUser', () => {
    beforeEach(() => {
      // avoid displayLoader touching DOM by adding a loader element
      const loader = document.createElement('div')
      loader.id = 'loader'
      document.body.appendChild(loader)
    })
    afterEach(() => {
      const loader = document.getElementById('loader')
      if (loader) { document.body.removeChild(loader) }
    })

    it('should do nothing when input length <= 2', () => {
      component.onSearchUser({ target: { value: 'ab' } })
      expect(allocateSrvc.onSearchUser).not.toHaveBeenCalled()
    })

    it('should set nosimilarUsers true when no users found', () => {
      allocateSrvc.onSearchUser.mockReturnValue(of({ result: { data: [] } }))
      component.onSearchUser({ target: { value: 'abc' } })
      expect(component.nosimilarUsers).toBe(true)
      expect(component.similarUsers).toEqual([])
    })

    it('should set similarUsers and clear no-result flags when users found', () => {
      allocateSrvc.onSearchUser.mockReturnValue(of({ result: { data: [{ id: 1 }] } }))
      component.onSearchUser({ target: { value: 'abc' } })
      expect(component.similarUsers).toEqual([{ id: 1 }])
      expect(component.nosimilarUsers).toBe(false)
    })
  })

  describe('onSearchRole', () => {
    beforeEach(() => {
      const loader = document.createElement('div')
      loader.id = 'loader'
      document.body.appendChild(loader)
    })
    afterEach(() => {
      const loader = document.getElementById('loader')
      if (loader) { document.body.removeChild(loader) }
    })

    it('should do nothing when input length <= 2', () => {
      component.onSearchRole({ target: { value: 'ab' } })
      expect(allocateSrvc.onSearchRole).not.toHaveBeenCalled()
    })

    it('should set nosimilarRoles true when no roles found', () => {
      allocateSrvc.onSearchRole.mockReturnValue(of([]))
      component.onSearchRole({ target: { value: 'abc' } })
      expect(component.nosimilarRoles).toBe(true)
    })

    it('should set similarRoles when roles found', () => {
      allocateSrvc.onSearchRole.mockReturnValue(of([{ name: 'role1' }]))
      component.onSearchRole({ target: { value: 'abc' } })
      expect(component.similarRoles).toEqual([{ name: 'role1' }])
      expect(component.nosimilarRoles).toBe(false)
    })
  })

  describe('onSearchPosition', () => {
    beforeEach(() => {
      const loader = document.createElement('div')
      loader.id = 'loader'
      document.body.appendChild(loader)
    })
    afterEach(() => {
      const loader = document.getElementById('loader')
      if (loader) { document.body.removeChild(loader) }
    })

    it('should do nothing when input length <= 2', () => {
      component.onSearchPosition({ target: { value: 'ab' } })
      expect(allocateSrvc.onSearchPosition).not.toHaveBeenCalled()
    })

    it('should set nosimilarPositions true when no positions found', () => {
      allocateSrvc.onSearchPosition.mockReturnValue(of({ responseData: [] }))
      component.onSearchPosition({ target: { value: 'abc' } })
      expect(component.nosimilarPositions).toBe(true)
    })

    it('should set similarPositions when positions found', () => {
      allocateSrvc.onSearchPosition.mockReturnValue(of({ responseData: [{ name: 'pos1' }] }))
      component.onSearchPosition({ target: { value: 'abc' } })
      expect(component.similarPositions).toEqual([{ name: 'pos1' }])
      expect(component.nosimilarPositions).toBe(false)
    })
  })

  describe('setAllMsgFalse', () => {
    it('should set all no-similar flags to false', () => {
      component.nosimilarUsers = true
      component.nosimilarRoles = true
      component.nosimilarPositions = true
      component.nosimilarActivities = true
      component.setAllMsgFalse()
      expect(component.nosimilarUsers).toBe(false)
      expect(component.nosimilarRoles).toBe(false)
      expect(component.nosimilarPositions).toBe(false)
      expect(component.nosimilarActivities).toBe(false)
    })
  })

  describe('displayLoader', () => {
    it('should set display block when value is true', () => {
      const loader = document.createElement('div')
      loader.id = 'loader'
      document.body.appendChild(loader)
      component.displayLoader('true')
      expect(loader.style.display).toBe('block')
      document.body.removeChild(loader)
    })

    it('should set display none when value is not true', () => {
      const loader = document.createElement('div')
      loader.id = 'loader'
      document.body.appendChild(loader)
      component.displayLoader('false')
      expect(loader.style.display).toBe('none')
      document.body.removeChild(loader)
    })
  })

  describe('selectUser', () => {
    it('should patch form with full name when last_name exists', () => {
      const user = {
        userDetails: { first_name: 'John', last_name: 'Doe', email: 'john@doe.com' },
        allocationDetails: { userPosition: 'Manager' },
      }
      component.selectUser(user)
      expect(component.selectedUser).toBe(user)
      expect(component.newAllocationForm.value.fname).toBe('John Doe')
      expect(component.newAllocationForm.value.email).toBe('john@doe.com')
      expect(component.newAllocationForm.value.position).toBe('Manager')
      expect(component.showAddNewRole).toBe(true)
    })

    it('should use first_name only when last_name missing', () => {
      const user = {
        userDetails: { first_name: 'John', last_name: '', email: 'john@doe.com' },
      }
      component.selectUser(user)
      expect(component.newAllocationForm.value.fname).toBe('John')
    })

    it('should keep existing position when already set', () => {
      component.newAllocationForm.patchValue({ position: 'Existing' })
      const user = {
        userDetails: { first_name: 'John', last_name: 'Doe', email: 'john@doe.com' },
        allocationDetails: { userPosition: 'Manager' },
      }
      component.selectUser(user)
      expect(component.newAllocationForm.value.position).toBe('Existing')
    })
  })

  describe('removeSelectedUSer', () => {
    it('should reset form and clear state when dialog result is truthy', () => {
      const afterClosed = of(true)
      dialog.open.mockReturnValue({ afterClosed: () => afterClosed })
      component.selectedUser = { some: 'data' }
      component.ralist = [{ a: 1 }]
      component.activitieslist = [{ b: 1 }]

      component.removeSelectedUSer()

      expect(component.selectedUser).toBe('')
      expect(component.ralist).toEqual([])
      expect(component.activitieslist).toEqual([])
    })

    it('should not reset when dialog result is falsy', () => {
      const afterClosed = of(false)
      dialog.open.mockReturnValue({ afterClosed: () => afterClosed })
      component.selectedUser = { some: 'data' }

      component.removeSelectedUSer()

      expect(component.selectedUser).toEqual({ some: 'data' })
    })
  })

  describe('selectRole', () => {
    it('should push named childNodes to activitieslist and patch rolelist', () => {
      const role = {
        childNodes: [{ name: 'Act1' }, { name: '' }],
      }
      component.selectRole(role)
      expect(component.activitieslist.length).toBe(1)
      expect(component.activitieslist[0].name).toBe('Act1')
      expect(component.similarRoles).toEqual([])
      expect(component.selectedActivity).toBe('')
      expect(component.inputvar.nativeElement.value).toBe('')
    })
  })

  describe('selectActivity', () => {
    it('should push activity to activitieslist and reset selectedActivity', () => {
      component.activitieslist = []
      component.selectActivity({ name: 'Act1' })
      expect(component.activitieslist).toEqual([{ name: 'Act1' }])
      expect(component.similarActivities).toEqual([])
      expect(component.selectedActivity).toBe('')
      expect(component.inputvar.nativeElement.value).toBe('')
    })
  })

  describe('selectPosition', () => {
    it('should patch position and enable showAddNewRole when fname/email set', () => {
      component.selectedUser = { userDetails: {} }
      component.newAllocationForm.patchValue({ fname: 'John', email: 'j@d.com' })
      component.selectPosition({ name: 'Manager' })
      expect(component.newAllocationForm.value.position).toBe('Manager')
      expect(component.selectedUser.userDetails.position).toBe('Manager')
      expect(component.showAddNewRole).toBe(true)
    })

    it('should not enable showAddNewRole when fname/email empty', () => {
      component.selectedUser = { userDetails: {} }
      component.showAddNewRole = false
      component.selectPosition({ name: 'Manager' })
      expect(component.showAddNewRole).toBe(false)
    })
  })

  describe('addRolesActivity', () => {
    it('should set showRAerror true when index 0 selectedRole exists but no activities', () => {
      component.selectedRole = { name: 'Role1' }
      component.activitieslist = []
      component.addRolesActivity(0)
      expect(component.showRAerror).toBe(true)
    })

    it('should push to ralist when index 0 with activities', () => {
      component.selectedRole = { name: 'Role1', childNodes: [] }
      component.activitieslist = [{ name: 'Act1' }]
      component.addRolesActivity(0)
      expect(component.showRAerror).toBe(false)
      expect(component.ralist.length).toBe(1)
      expect(component.selectedRole).toBe('')
      expect(component.activitieslist).toEqual([])
    })

    it('should push a new role format when index != 0 and name and activities exist', () => {
      component.newAllocationForm.patchValue({ rolelist: [{ name: 'NewRole', childNodes: '' }] })
      component.activitieslist = [{ name: 'Act1' }]
      component.addRolesActivity(1)
      expect(component.showRAerror).toBe(false)
      expect(component.ralist.length).toBe(1)
      expect(component.ralist[0].name).toBe('NewRole')
    })

    it('should set showRAerror true when index != 0 and no name/activities', () => {
      component.newAllocationForm.patchValue({ rolelist: [{ name: '', childNodes: '' }] })
      component.activitieslist = []
      component.addRolesActivity(1)
      expect(component.showRAerror).toBe(true)
    })
  })

  describe('addActivity', () => {
    it('should add activity from rolelist childNodes when no selectedActivity', () => {
      component.selectedActivity = undefined
      component.newAllocationForm.patchValue({ rolelist: [{ name: '', childNodes: 'SomeActivity' }] })
      component.activitieslist = []
      component.addActivity()
      expect(component.activitieslist.length).toBe(1)
      expect(component.activitieslist[0].name).toBe('SomeActivity')
      expect(component.inputvar.nativeElement.value).toBe('')
    })

    it('should not add activity when selectedActivity is set', () => {
      component.selectedActivity = { name: 'x' }
      component.activitieslist = []
      component.addActivity()
      expect(component.activitieslist.length).toBe(0)
    })

    it('should not add activity when rolelist childNodes empty', () => {
      component.selectedActivity = undefined
      component.newAllocationForm.patchValue({ rolelist: [{ name: '', childNodes: '' }] })
      component.activitieslist = []
      component.addActivity()
      expect(component.activitieslist.length).toBe(0)
    })
  })

  describe('showRemoveActivity', () => {
    it('should set display block on matching element', () => {
      const el = document.createElement('div')
      el.id = 'showremove0'
      document.body.appendChild(el)
      component.showRemoveActivity(0)
      expect(el.style.display).toBe('block')
      document.body.removeChild(el)
    })
  })

  describe('removeActivity', () => {
    it('should splice activitieslist at valid index', () => {
      component.activitieslist = [{ name: 'a' }, { name: 'b' }]
      component.removeActivity(0)
      expect(component.activitieslist).toEqual([{ name: 'b' }])
    })

    it('should not splice at negative index', () => {
      component.activitieslist = [{ name: 'a' }]
      component.removeActivity(-1)
      expect(component.activitieslist).toEqual([{ name: 'a' }])
    })
  })

  describe('buttonClick', () => {
    it('should remove row from ralist on Delete action', () => {
      const row = { id: 1 }
      component.ralist = [row, { id: 2 }]
      component.buttonClick('Delete', row)
      expect(component.ralist).toEqual([{ id: 2 }])
    })

    it('should do nothing for other actions', () => {
      const row = { id: 1 }
      component.ralist = [row]
      component.buttonClick('Other', row)
      expect(component.ralist).toEqual([row])
    })

    it('should do nothing when ralist is falsy', () => {
      component.ralist = undefined as any
      expect(() => component.buttonClick('Delete', { id: 1 })).not.toThrow()
    })
  })

  describe('onSubmit', () => {
    it('should submit form and navigate on success', () => {
      component.ralist = [{ name: 'r1' }]
      component.selectedUser = { userDetails: { wid: 'w1' } }
      component.selectedPosition = { id: 'p1' }
      component.departmentID = 'dept1'
      component.departmentName = 'DeptName'
      allocateSrvc.createAllocation.mockReturnValue(of({ success: true }))

      component.onSubmit()

      expect(allocateSrvc.createAllocation).toHaveBeenCalled()
      const reqdata = allocateSrvc.createAllocation.mock.calls[0][0]
      expect(reqdata.userId).toBe('w1')
      expect(reqdata.deptId).toBe('dept1')
      expect(snackBar.open).toHaveBeenCalledWith('Work Allocated Successfully', 'X', { duration: 5000 })
      expect(router.navigate).toHaveBeenCalledWith(['/app/home/workallocation'])
      expect(component.selectedUser).toBe('')
      expect(component.ralist).toEqual([])
    })

    it('should use archivedList when selectedUser has allocationDetails', () => {
      component.ralist = [{ name: 'r1' }]
      component.selectedUser = {
        userDetails: { wid: 'w1' },
        allocationDetails: { archivedList: [{ name: 'archived' }] },
      }
      allocateSrvc.createAllocation.mockReturnValue(of({ success: true }))

      component.onSubmit()

      const reqdata = allocateSrvc.createAllocation.mock.calls[0][0]
      expect(reqdata.activeList).toEqual([{ name: 'archived' }])
    })

    it('should not navigate when response is falsy', () => {
      component.ralist = []
      component.selectedUser = null
      allocateSrvc.createAllocation.mockReturnValue(of(null))

      component.onSubmit()

      expect(router.navigate).not.toHaveBeenCalled()
    })
  })

  describe('openDialog', () => {
    it('should open dialog and process result with data', () => {
      component.selectedUser = { userDetails: { wid: 'u1' } }
      component.departmentName = 'Dept'
      component.departmentID = 'DeptId'
      const afterClosed = of({ data: { userId: 'u1', roleCompetencyList: ['c1'] } })
      dialog.open.mockReturnValue({ afterClosed: () => afterClosed })
      const spy = jest.spyOn(component, 'getWorkAllocationDetails').mockImplementation()

      component.openDialog()

      expect(dialog.open).toHaveBeenCalled()
      expect(component.showPublishButton).toBe(true)
      expect(component.publishWorkAllocationData).toEqual({ userId: 'u1', roleCompetencyList: ['c1'] })
      expect(component.roleCompetencyList).toEqual(['c1'])
      expect(spy).toHaveBeenCalledWith('u1')
    })

    it('should not process when result.data is undefined', () => {
      const afterClosed = of({ data: undefined })
      dialog.open.mockReturnValue({ afterClosed: () => afterClosed })
      const spy = jest.spyOn(component, 'getWorkAllocationDetails').mockImplementation()

      component.openDialog()

      expect(component.showPublishButton).toBe(false)
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('getWorkAllocationDetails', () => {
    it('should set waId from response', () => {
      allocateSrvc.getAllocationDetails.mockReturnValue(of({
        result: { data: [{ allocationDetails: { draftWAObject: { id: 'wa123' } } }] },
      }))
      component.getWorkAllocationDetails('u1')
      expect(component.waId).toBe('wa123')
      expect(allocateSrvc.getAllocationDetails).toHaveBeenCalledWith({
        pageNo: 0,
        pageSize: 100,
        departmentName: component.departmentName,
        status: 'Draft',
        userId: 'u1',
      })
    })

    it('should not throw and not set waId when response falsy', () => {
      allocateSrvc.getAllocationDetails.mockReturnValue(of(null))
      component.waId = 'unchanged'
      component.getWorkAllocationDetails('u1')
      expect(component.waId).toBe('unchanged')
    })
  })

  describe('publishWorkOrder', () => {
    it('should update allocation and navigate on success', () => {
      component.publishWorkAllocationData = { name: 'wa' }
      component.waId = 'wa123'
      allocateSrvc.updateAllocation.mockReturnValue(of({ success: true }))

      component.publishWorkOrder()

      expect(component.publishWorkAllocationData.waId).toBe('wa123')
      expect(component.publishWorkAllocationData.status).toBe('Published')
      expect(allocateSrvc.updateAllocation).toHaveBeenCalledWith(component.publishWorkAllocationData)
      expect(snackBar.open).toHaveBeenCalled()
      expect(router.navigate).toHaveBeenCalledWith(['/app/home/workallocation'])
    })

    it('should not navigate when response falsy', () => {
      component.publishWorkAllocationData = { name: 'wa' }
      component.waId = 'wa123'
      allocateSrvc.updateAllocation.mockReturnValue(of(null))

      component.publishWorkOrder()

      expect(router.navigate).not.toHaveBeenCalled()
    })
  })
})
