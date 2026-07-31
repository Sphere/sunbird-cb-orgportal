import { UntypedFormBuilder } from '@angular/forms'
import { of } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { UpdateWorkallocationComponent } from './update-workallocation.component'

describe('UpdateWorkallocationComponent', () => {
  let component: UpdateWorkallocationComponent
  let exportAsServiceMock: any
  let snackBarMock: any
  let routerMock: any
  let allocateSrvcMock: any
  let activeRouteMock: any
  let configSvcMock: any

  const buildComponent = (userIdOnRoute: any = 'user1') => {
    exportAsServiceMock = createSpyObj('ExportAsService', ['save', 'get'])
    exportAsServiceMock.save.mockReturnValue(of({}))

    snackBarMock = createSpyObj('MatSnackBar', ['open'])
    routerMock = createSpyObj('Router', ['navigate'])

    allocateSrvcMock = createSpyObj('AllocationService', [
      'getUsers', 'onSearchPosition', 'onSearchRole', 'onSearchActivity', 'updateAllocation',
    ])
    allocateSrvcMock.getUsers.mockReturnValue(of({ result: { data: [] } }))

    activeRouteMock = {
      snapshot: { params: { userId: userIdOnRoute } },
    }

    configSvcMock = {
      unMappedUser: { channel: 'dept-channel', rootOrgId: 'dept-root-id' },
    }

    return new UpdateWorkallocationComponent(
      exportAsServiceMock,
      snackBarMock,
      routerMock,
      new UntypedFormBuilder(),
      allocateSrvcMock,
      activeRouteMock,
      configSvcMock,
    )
  }

  beforeEach(() => {
    component = buildComponent()
  })

  it('should create and initialize department info from configSvc in constructor', () => {
    expect(component).toBeTruthy()
    expect(component.departmentName).toBe('dept-channel')
    expect(component.departmentID).toBe('dept-root-id')
    expect(component.allocateduserID).toBe('user1')
  })

  it('should call getUsers with expected request on getAllUsers', () => {
    component.getAllUsers()
    expect(allocateSrvcMock.getUsers).toHaveBeenCalledWith({
      pageNo: 0,
      pageSize: 1000,
      departmentName: 'dept-channel',
    })
  })

  it('ngOnInit should set up tabsData', () => {
    component.ngOnInit()
    expect(component.tabsData.length).toBe(3)
    expect(component.tabsData[0].key).toBe('officer')
    expect(component.tabsData[2].key).toBe('archived')
  })

  describe('getAllUsers - matching allocated user', () => {
    it('should populate selectedUser, patch form, and set ralist/archivedlist when a matching user is found', () => {
      const matchingUser = {
        userDetails: { wid: 'wid-1' },
        allocationDetails: {
          id: 'user1',
          userId: 'user1',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          userPosition: 'Officer',
          activeList: [{ name: 'Role1' }],
          archivedList: [{ name: 'ArchivedRole' }],
        },
      }
      allocateSrvcMock.getUsers.mockReturnValue(of({ result: { data: [matchingUser] } }))

      component.getAllUsers()

      expect(component.selectedUser).toBe(matchingUser)
      expect(component.orgselectedUser).toBe(matchingUser)
      expect(component.newAllocationForm.value.fname).toBe('John Doe')
      expect(component.newAllocationForm.value.email).toBe('john@example.com')
      expect(component.newAllocationForm.value.position).toBe('Officer')
      expect(component.ralist).toEqual([{ name: 'Role1' }])
      expect(component.archivedlist).toEqual([{ name: 'ArchivedRole' }])
      expect(component.data.length).toBe(1)
      expect(component.data[0].fullname).toBe('John Doe')
    })

    it('should not populate selectedUser when no user matches allocateduserID', () => {
      const nonMatchingUser = {
        userDetails: { wid: 'wid-2' },
        allocationDetails: {
          id: 'other-user',
          userId: 'other-user',
          userName: 'Jane',
          userEmail: 'jane@example.com',
          userPosition: 'Manager',
          activeList: [],
          archivedList: [],
        },
      }
      allocateSrvcMock.getUsers.mockReturnValue(of({ result: { data: [nonMatchingUser] } }))

      component.getAllUsers()

      expect(component.selectedUser).toBeUndefined()
      expect(component.data.length).toBe(0)
    })
  })

  describe('export', () => {
    it('should call exportAsService.save, and toggle displaytemplate', () => {
      component.export()
      expect(exportAsServiceMock.save).toHaveBeenCalledWith(component.config, 'WorkAllocation')
      // save() is synchronous (of({})), so the subscribe callback sets displaytemplate=true
      // then the line right after export() flips it back to false.
      expect(component.displaytemplate).toBe(false)
    })
  })

  describe('pdfCallbackFn', () => {
    it('should set page footer text for every page', () => {
      const pdfMock = {
        internal: {
          getNumberOfPages: () => 2,
          pageSize: { getWidth: () => 800, getHeight: () => 600 },
        },
        setPage: jest.fn(),
        text: jest.fn(),
      }
      component.pdfCallbackFn(pdfMock)
      expect(pdfMock.setPage).toHaveBeenCalledTimes(2)
      expect(pdfMock.text).toHaveBeenCalledTimes(2)
      expect(pdfMock.text).toHaveBeenCalledWith('Page 1 of 2', 700, 570)
    })
  })

  describe('onSideNavTabClick', () => {
    it('should set currentTab and scroll into view when element exists', () => {
      const el = document.createElement('div')
      el.id = 'officer'
      el.scrollIntoView = jest.fn()
      document.body.appendChild(el)

      component.onSideNavTabClick('officer')

      expect(component.currentTab).toBe('officer')
      expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start', inline: 'start' })
      document.body.removeChild(el)
    })

    it('should just set currentTab when element does not exist', () => {
      component.onSideNavTabClick('nonexistent')
      expect(component.currentTab).toBe('nonexistent')
    })
  })

  describe('setRole / newRole / newroleControls', () => {
    it('setRole should push a form group for each formdata.rolelist entry', () => {
      const initialLength = component.newroleControls.length
      component.setRole()
      expect(component.newroleControls.length).toBe(initialLength + component.formdata.rolelist.length)
    })

    it('newRole should return a form group with empty name/childNodes controls', () => {
      const group = component.newRole()
      expect(group.value).toEqual({ name: '', childNodes: '' })
    })
  })

  describe('search methods', () => {
    const shortEvent = { target: { value: 'ab' } }
    const longEvent = { target: { value: 'abc' } }

    beforeEach(() => {
      document.body.innerHTML = '<div id="loader"></div>'
    })

    it('onSearchPosition should do nothing when input length <= 2', () => {
      component.onSearchPosition(shortEvent)
      expect(allocateSrvcMock.onSearchPosition).not.toHaveBeenCalled()
    })

    it('onSearchPosition should call service and set similarPositions with results', () => {
      allocateSrvcMock.onSearchPosition.mockReturnValue(of({ responseData: [{ name: 'Pos1' }] }))
      component.onSearchPosition(longEvent)
      expect(allocateSrvcMock.onSearchPosition).toHaveBeenCalled()
      expect(component.similarPositions).toEqual([{ name: 'Pos1' }])
      expect(component.nosimilarPositions).toBe(false)
    })

    it('onSearchPosition should set nosimilarPositions true when results are empty', () => {
      allocateSrvcMock.onSearchPosition.mockReturnValue(of({ responseData: [] }))
      component.onSearchPosition(longEvent)
      expect(component.nosimilarPositions).toBe(true)
    })

    it('onSearchRole should call service and set similarRoles', () => {
      allocateSrvcMock.onSearchRole.mockReturnValue(of([{ name: 'Role1' }]))
      component.onSearchRole(longEvent)
      expect(allocateSrvcMock.onSearchRole).toHaveBeenCalledWith('abc')
      expect(component.similarRoles).toEqual([{ name: 'Role1' }])
    })

    it('onSearchRole should set nosimilarRoles true when results are empty', () => {
      allocateSrvcMock.onSearchRole.mockReturnValue(of([]))
      component.onSearchRole(longEvent)
      expect(component.nosimilarRoles).toBe(true)
    })

    it('onSearchRole should do nothing for short input', () => {
      component.onSearchRole(shortEvent)
      expect(allocateSrvcMock.onSearchRole).not.toHaveBeenCalled()
    })

    it('onSearchActivity should call service and set similarActivities', () => {
      allocateSrvcMock.onSearchActivity.mockReturnValue(of({ responseData: [{ name: 'Act1' }] }))
      component.onSearchActivity(longEvent)
      expect(allocateSrvcMock.onSearchActivity).toHaveBeenCalled()
      expect(component.similarActivities).toEqual([{ name: 'Act1' }])
    })

    it('onSearchActivity should set nosimilarActivities true when results are empty', () => {
      allocateSrvcMock.onSearchActivity.mockReturnValue(of({ responseData: [] }))
      component.onSearchActivity(longEvent)
      expect(component.nosimilarActivities).toBe(true)
    })

    it('onSearchActivity should do nothing for short input', () => {
      component.onSearchActivity(shortEvent)
      expect(allocateSrvcMock.onSearchActivity).not.toHaveBeenCalled()
    })
  })

  describe('setAllMsgFalse', () => {
    it('should reset all "no similar" flags to false', () => {
      component.nosimilarRoles = true
      component.nosimilarPositions = true
      component.nosimilarActivities = true
      component.setAllMsgFalse()
      expect(component.nosimilarRoles).toBe(false)
      expect(component.nosimilarPositions).toBe(false)
      expect(component.nosimilarActivities).toBe(false)
    })
  })

  describe('displayLoader', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div id="loader" style="display:none"></div>'
    })

    it('should show loader when value is "true"', () => {
      component.displayLoader('true')
      expect(document.getElementById('loader')!.style.display).toBe('block')
    })

    it('should hide loader when value is not "true"', () => {
      component.displayLoader('false')
      expect(document.getElementById('loader')!.style.display).toBe('none')
    })
  })

  describe('selectRole / selectActivity / selectPosition', () => {
    beforeEach(() => {
      component.setRole()
      component.inputvar = { nativeElement: { value: 'something' } } as any
    })

    it('selectRole should format childNodes into names and patch the first rolelist control', () => {
      const role = {
        name: 'RoleA',
        childNodes: [{ name: 'Act1' }, { name: 'Act2' }],
      }
      component.selectRole(role)
      expect(component.selectedRole).toBe(role)
      expect(component.activitieslist).toEqual([{ name: 'Act1' }, { name: 'Act2' }])
      expect(component.similarRoles).toEqual([])
      expect(component.inputvar.nativeElement.value).toBe('')
      expect(component.newAllocationForm.get('rolelist')!.value[0].name).toBe('RoleA')
    })

    it('selectActivity should push activity to activitieslist and reset selectedActivity', () => {
      component.activitieslist = []
      component.selectActivity({ name: 'ActivityA' })
      expect(component.activitieslist).toEqual([{ name: 'ActivityA' }])
      expect(component.selectedActivity).toBe('')
      expect(component.similarActivities).toEqual([])
    })

    it('selectPosition should set selectedPosition and patch form position', () => {
      component.selectPosition({ name: 'PositionA', id: 'p1' })
      expect(component.selectedPosition).toEqual({ name: 'PositionA', id: 'p1' })
      expect(component.newAllocationForm.value.position).toBe('PositionA')
      expect(component.similarPositions).toEqual([])
    })
  })

  describe('addRolesActivity', () => {
    beforeEach(() => {
      component.setRole()
    })

    it('should set showRAerror true when index is 0 with no selectedRole', () => {
      component.selectedRole = undefined
      component.addRolesActivity(0)
      expect(component.showRAerror).toBe(true)
    })

    it('should push selectedRole to ralist when index is 0, selectedRole set, and activities exist', () => {
      component.selectedRole = { name: 'RoleA', childNodes: [] }
      component.activitieslist = [{ name: 'Act1' }]
      component.ralist = []
      component.addRolesActivity(0)
      expect(component.showRAerror).toBe(false)
      expect(component.ralist.length).toBe(1)
      expect(component.ralist[0].name).toBe('RoleA')
      expect(component.selectedRole).toBe('')
      expect(component.activitieslist).toEqual([])
    })

    it('should set showRAerror true for non-zero index when name or activities missing', () => {
      component.newAllocationForm.get('rolelist')!.at(0).patchValue({ name: '', childNodes: '' })
      component.activitieslist = []
      component.addRolesActivity(1)
      expect(component.showRAerror).toBe(true)
    })

    it('should create a new role entry for non-zero index when name and activities present', () => {
      component.newAllocationForm.get('rolelist')!.at(0).patchValue({ name: 'NewRole', childNodes: '' })
      component.activitieslist = [{ name: 'Act1' }]
      component.ralist = []
      component.addRolesActivity(1)
      expect(component.showRAerror).toBe(false)
      expect(component.ralist.length).toBe(1)
      expect(component.ralist[0].name).toBe('NewRole')
      expect(component.ralist[0].type).toBe('ROLE')
      expect(component.activitieslist).toEqual([])
    })
  })

  describe('addActivity', () => {
    beforeEach(() => {
      component.setRole()
      component.inputvar = { nativeElement: { value: 'something' } } as any
    })

    it('should push a formatted activity when selectedActivity is falsy and childNodes has value', () => {
      component.selectedActivity = undefined
      component.newAllocationForm.get('rolelist')!.at(0).patchValue({ childNodes: 'MyActivity' })
      component.activitieslist = []
      component.addActivity()
      expect(component.activitieslist.length).toBe(1)
      expect(component.activitieslist[0].name).toBe('MyActivity')
      expect(component.inputvar.nativeElement.value).toBe('')
    })

    it('should not push when selectedActivity is truthy', () => {
      component.selectedActivity = 'existing'
      component.activitieslist = []
      component.addActivity()
      expect(component.activitieslist.length).toBe(0)
    })

    it('should not push when childNodes empty', () => {
      component.selectedActivity = undefined
      component.newAllocationForm.get('rolelist')!.at(0).patchValue({ childNodes: '' })
      component.activitieslist = []
      component.addActivity()
      expect(component.activitieslist.length).toBe(0)
    })
  })

  describe('showRemoveActivity', () => {
    it('should set display block on the matching element', () => {
      document.body.innerHTML = '<div id="showremove0"></div>'
      component.showRemoveActivity(0)
      expect(document.getElementById('showremove0')!.style.display).toBe('block')
    })
  })

  describe('removeActivity', () => {
    it('should remove the item at given index when index >= 0', () => {
      component.activitieslist = [{ name: 'A' }, { name: 'B' }]
      component.removeActivity(0)
      expect(component.activitieslist).toEqual([{ name: 'B' }])
    })

    it('should not modify list when index is negative', () => {
      component.activitieslist = [{ name: 'A' }]
      component.removeActivity(-1)
      expect(component.activitieslist).toEqual([{ name: 'A' }])
    })
  })

  describe('buttonClick', () => {
    it('should delete a row from ralist', () => {
      const row = { name: 'RoleA' }
      component.ralist = [row]
      component.buttonClick('Delete', row)
      expect(component.ralist).toEqual([])
    })

    it('should archive a row: remove from ralist, mark archived, and add to archivedlist', () => {
      const row = { name: 'RoleA' }
      component.ralist = [row]
      component.archivedlist = []
      component.buttonClick('Archive', row)
      expect(component.ralist).toEqual([])
      expect(row.isArchived).toBe(true)
      expect(typeof (row as any).archivedAt).toBe('number')
      expect(component.archivedlist).toEqual([row])
    })

    it('should do nothing when ralist is falsy', () => {
      component.ralist = undefined as any
      expect(() => component.buttonClick('Delete', {})).not.toThrow()
    })
  })

  describe('onSubmit', () => {
    beforeEach(() => {
      component.selectedUser = {
        allocationDetails: {
          id: 'user1',
          userId: 'user1',
          userPosition: 'OldPos',
          positionId: 'pos-1',
        },
      }
      component.newAllocationForm.patchValue({
        fname: 'John Doe',
        email: 'john@example.com',
        position: 'OldPos',
      })
      component.ralist = [{ name: 'Role1' }]
      component.archivedlist = []
    })

    it('should call updateAllocation with correct payload and navigate on success', () => {
      allocateSrvcMock.updateAllocation.mockReturnValue(of({ success: true }))
      component.onSubmit()

      expect(allocateSrvcMock.updateAllocation).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user1',
          userId: 'user1',
          deptId: 'dept-root-id',
          deptName: 'dept-channel',
          activeList: [{ name: 'Role1' }],
          archivedList: [],
          userName: 'John Doe',
          userEmail: 'john@example.com',
          userPosition: 'OldPos',
          positionId: 'pos-1',
        }),
      )
      expect(snackBarMock.open).toHaveBeenCalledWith('Work Allocation updated Successfully', 'X', { duration: 5000 })
      expect(routerMock.navigate).toHaveBeenCalledWith(['/app/home/workallocation'])
      expect(component.selectedUser).toBe('')
      expect(component.ralist).toEqual([])
      expect(component.archivedlist).toEqual([])
    })

    it('should clear positionId when position changed and no selectedPosition', () => {
      component.newAllocationForm.patchValue({ position: 'NewPos' })
      allocateSrvcMock.updateAllocation.mockReturnValue(of({ success: true }))
      component.onSubmit()

      expect(allocateSrvcMock.updateAllocation).toHaveBeenCalledWith(
        expect.objectContaining({ positionId: '' }),
      )
    })

    it('should not navigate or reset when updateAllocation returns falsy', () => {
      allocateSrvcMock.updateAllocation.mockReturnValue(of(null))
      component.onSubmit()
      expect(routerMock.navigate).not.toHaveBeenCalled()
    })
  })
})
