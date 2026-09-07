import { of, throwError, Subject } from 'rxjs'
import { UsersViewComponent } from './users-view.component'

describe('UsersViewComponent', () => {
  let component: UsersViewComponent
  let dialogMock: any
  let routeMock: any
  let routerMock: any
  let snackBarMock: any
  let eventsMock: any
  let loaderServiceMock: any
  let usersServiceMock: any

  const configService = {
    userProfile: { userId: 'user-1' },
    unMappedUser: { rootOrg: { id: 'org-1', rootOrgId: 'root-1' } },
  }

  beforeEach(() => {
    dialogMock = {
      open: jest.fn(),
    }
    routeMock = {
      parent: {
        snapshot: {
          data: { configService },
        },
      },
      snapshot: {
        parent: {
          data: { configService },
        },
      },
    }
    routerMock = {
      navigate: jest.fn(),
    }
    snackBarMock = {
      open: jest.fn(),
    }
    eventsMock = {
      raiseInteractTelemetry: jest.fn(),
      handleTabTelemetry: jest.fn(),
    }
    loaderServiceMock = {
      changeLoad: new Subject<boolean>(),
    }
    jest.spyOn(loaderServiceMock.changeLoad, 'next')
    usersServiceMock = {
      getAllKongUsers: jest.fn().mockReturnValue(of({ result: { response: { content: [] } } })),
      searchUserByFilter: jest.fn().mockReturnValue(of({ result: { response: { content: [] } } })),
      searchUserByenter: jest.fn().mockReturnValue(of({ result: { response: { content: [] } } })),
      blockUser: jest.fn().mockReturnValue(of({ result: { response: 'ok' } })),
      newBlockUser: jest.fn().mockReturnValue(of({ params: { status: 'SUCCESS' } })),
      newUnBlockUser: jest.fn().mockReturnValue(of({ params: { status: 'SUCCESS' } })),
    }

    component = new UsersViewComponent(
      dialogMock,
      routeMock,
      routerMock,
      snackBarMock,
      eventsMock,
      loaderServiceMock,
      usersServiceMock
    )
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it('should create and set currentUser from configService in constructor', () => {
    expect(component).toBeTruthy()
    expect(component.currentUser).toBe('user-1')
    expect(component.configSvc).toBe(configService)
  })

  describe('ngOnInit', () => {
    it('should call getAllUsers', () => {
      const spy = jest.spyOn(component, 'getAllUsers')
      component.ngOnInit()
      expect(spy).toHaveBeenCalledTimes(1)
    })
  })

  describe('ngOnDestroy', () => {
    it('should unsubscribe tabs if present', () => {
      const unsubscribe = jest.fn()
      component.tabs = { unsubscribe }
      component.ngOnDestroy()
      expect(unsubscribe).toHaveBeenCalledTimes(1)
    })

    it('should not throw when tabs is undefined', () => {
      component.tabs = undefined
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })

  describe('filter', () => {
    it('should set currentFilter', () => {
      component.filter('inactive')
      expect(component.currentFilter).toBe('inactive')
    })
  })

  describe('tabTelemetry', () => {
    it('should call events.handleTabTelemetry with label and index', () => {
      component.tabTelemetry('Active', 0)
      expect(eventsMock.handleTabTelemetry).toHaveBeenCalledWith(
        expect.anything(),
        { label: 'Active', index: 0 }
      )
    })
  })

  describe('dataForTable', () => {
    it('should return activeUsersData when currentFilter is active', () => {
      component.currentFilter = 'active'
      component.activeUsersData = [{ userName: 'a' }]
      expect(component.dataForTable).toEqual([{ userName: 'a' }])
    })

    it('should return inactiveUsersData when currentFilter is inactive', () => {
      component.currentFilter = 'inactive'
      component.inactiveUsersData = [{ userName: 'b' }]
      expect(component.dataForTable).toEqual([{ userName: 'b' }])
    })

    it('should return empty array for unknown filter', () => {
      component.currentFilter = 'blocked'
      expect(component.dataForTable).toEqual([])
    })
  })

  describe('filterData', () => {
    it('should populate activeUsersData and inactiveUsersData', () => {
      component.usersData = {
        content: [
          { id: '1', firstName: 'A', lastName: 'B', isDeleted: false, organisations: [] },
          { id: '2', firstName: 'C', lastName: 'D', isDeleted: true, organisations: [] },
        ],
      }
      component.filterData()
      expect(component.activeUsersData.length).toBe(1)
      expect(component.inactiveUsersData.length).toBe(1)
      expect(component.activeUsersData[0].userId).toBe('1')
      expect(component.inactiveUsersData[0].userId).toBe('2')
    })
  })

  describe('activeUsers getter', () => {
    it('should return empty array when usersData is empty', () => {
      component.usersData = undefined
      expect(component.activeUsers).toEqual([])
    })

    it('should build active users with professional and address details', () => {
      component.usersData = {
        content: [
          {
            id: 'u1',
            firstName: 'John',
            lastName: 'Doe',
            isDeleted: false,
            userName: 'jdoe',
            organisations: [{ organisationId: 'org-1', roles: ['admin', 'member'] }],
            profileDetails: {
              profileReq: {
                professionalDetails: [{ designation: 'Engineer' }],
                personalDetails: { postalAddress: 'India,Karnataka,Bengaluru' },
              },
            },
          },
        ],
      }
      const result = component.activeUsers
      expect(loaderServiceMock.changeLoad.next).toHaveBeenCalledWith(true)
      expect(result.length).toBe(1)
      expect(result[0].fullname).toBe('John Doe')
      expect(result[0].userId).toBe('u1')
      expect(result[0].active).toBe(true)
      expect(result[0].designation).toBe('Engineer')
      expect(result[0].state).toBe('Karnataka')
      expect(result[0].city).toBe('Bengaluru')
      expect(result[0].roles).toContain('admin')
    })

    it('should use personalDetails.primaryEmail when present', () => {
      component.usersData = {
        content: [
          {
            id: 'u2',
            firstName: 'Jane',
            lastName: 'Roe',
            isDeleted: false,
            organisations: [],
            personalDetails: { primaryEmail: 'jane@example.com' },
          },
        ],
      }
      const result = component.activeUsers
      expect(result[0].email).toBe('jane@example.com')
    })

    it('should fall back to user.email when personalDetails absent', () => {
      component.usersData = {
        content: [
          {
            id: 'u3',
            firstName: 'Jim',
            lastName: 'Beam',
            isDeleted: false,
            organisations: [],
            email: 'jim@example.com',
          },
        ],
      }
      const result = component.activeUsers
      expect(result[0].email).toBe('jim@example.com')
    })
  })

  describe('inActiveUsers getter', () => {
    it('should return empty array when usersData is empty', () => {
      component.usersData = undefined
      expect(component.inActiveUsers).toEqual([])
    })

    it('should build inactive users list', () => {
      component.usersData = {
        content: [
          {
            id: 'u4',
            firstName: 'Ann',
            lastName: 'Lee',
            isDeleted: true,
            organisations: [{ organisationId: 'org-1', roles: ['viewer'] }],
          },
        ],
      }
      const result = component.inActiveUsers
      expect(loaderServiceMock.changeLoad.next).toHaveBeenCalledWith(true)
      expect(result.length).toBe(1)
      expect(result[0].fullname).toBe('Ann Lee')
      expect(result[0].active).toBe(false)
    })
  })

  describe('blockedUsers', () => {
    it('should return empty array when usersData is empty', () => {
      component.usersData = undefined
      expect(component.blockedUsers()).toEqual([])
    })

    it('should build blocked users list from non-deleted users', () => {
      component.usersData = {
        content: [
          {
            id: 'u5',
            firstName: 'Bob',
            lastName: 'Marley',
            isDeleted: false,
            roles: ['admin'],
            roleInfo: ['admin'],
          },
        ],
      }
      const result = component.blockedUsers()
      expect(result.length).toBe(1)
      expect(result[0].fullname).toBe('Bob Marley')
    })
  })

  describe('getprofessionalDetails', () => {
    it('should return empty object when data is empty', () => {
      expect(component.getprofessionalDetails(undefined)).toEqual({})
      expect(component.getprofessionalDetails([])).toEqual({})
    })

    it('should extract designation from data', () => {
      const result = component.getprofessionalDetails([{ designation: 'Manager' }])
      expect(result.designation).toBe('Manager')
    })

    it('should set empty designation when missing', () => {
      const result = component.getprofessionalDetails([{}])
      expect(result.designation).toBe('')
    })
  })

  describe('getPostalAdress', () => {
    it('should return empty object when data has no postalAddress', () => {
      expect(component.getPostalAdress(undefined)).toEqual({})
      expect(component.getPostalAdress({})).toEqual({})
    })

    it('should split postal address into country/state/city', () => {
      const result = component.getPostalAdress({ postalAddress: 'India,Karnataka,Bengaluru' })
      expect(result).toEqual({ country: 'India', state: 'Karnataka', city: 'Bengaluru' })
    })
  })

  describe('filterTable', () => {
    it('should open the FilterDialogComponent and apply filter on close with response', () => {
      const afterClosed$ = of({ role: 'admin' })
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosed$ })
      const constructSpy = jest.spyOn(component, 'constuctSelectedFilter')
      const getFilteredSpy = jest.spyOn(component, 'getUserFilteredData').mockImplementation(() => {})
      component.filterTable()
      expect(dialogMock.open).toHaveBeenCalled()
      expect(constructSpy).toHaveBeenCalledWith({ role: 'admin' })
      expect(getFilteredSpy).toHaveBeenCalled()
    })

    it('should do nothing extra when dialog closes with no response', () => {
      const afterClosed$ = of(null)
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosed$ })
      const constructSpy = jest.spyOn(component, 'constuctSelectedFilter')
      component.filterTable()
      expect(constructSpy).not.toHaveBeenCalled()
    })
  })

  describe('getUserFilteredData', () => {
    it('should call usersService.searchUserByFilter and update usersData', () => {
      usersServiceMock.searchUserByFilter.mockReturnValue(
        of({ result: { response: { content: [] } } })
      )
      const filterDataSpy = jest.spyOn(component, 'filterData')
      component.getUserFilteredData({ role: 'admin', phoneNumber: '123', emails: 'a@b.com' })
      expect(usersServiceMock.searchUserByFilter).toHaveBeenCalledWith(
        {
          'organisations.roles': 'admin',
          phone: '123',
          email: 'a@b.com',
        },
        'root-1'
      )
      expect(filterDataSpy).toHaveBeenCalled()
    })
  })

  describe('filterChange', () => {
    it('should call constructRemovedFilter and getUserFilteredData when value provided', () => {
      const constructSpy = jest.spyOn(component, 'constructRemovedFilter').mockReturnValue({ role: 'x' })
      const getFilteredSpy = jest.spyOn(component, 'getUserFilteredData').mockImplementation(() => {})
      component.filterChange([{ label: 'role', item: 'x' }])
      expect(constructSpy).toHaveBeenCalled()
      expect(getFilteredSpy).toHaveBeenCalledWith({ role: 'x' })
    })

    it('should do nothing when value is falsy', () => {
      const constructSpy = jest.spyOn(component, 'constructRemovedFilter')
      component.filterChange(null)
      expect(constructSpy).not.toHaveBeenCalled()
    })
  })

  describe('constructRemovedFilter', () => {
    it('should return empty object for empty response', () => {
      expect(component.constructRemovedFilter([])).toEqual({})
      expect(component.constructRemovedFilter(null)).toEqual({})
    })

    it('should transform response array into object', () => {
      const result = component.constructRemovedFilter([
        { label: 'role', item: 'admin' },
        { label: 'email', item: 'a@b.com' },
      ])
      expect(result).toEqual({ role: 'admin', email: 'a@b.com' })
    })
  })

  describe('constuctSelectedFilter', () => {
    it('should build selectedFilters and filterValues excluding empty values', () => {
      const result = component.constuctSelectedFilter({
        role: 'admin',
        phoneNumber: '',
        emails: [],
        city: 'Bengaluru',
      })
      expect(result).toEqual([
        { label: 'role', item: 'admin' },
        { label: 'city', item: 'Bengaluru' },
      ])
      expect(component.filterValues).toEqual({ role: 'admin', city: 'Bengaluru' })
    })
  })

  describe('getAllUsers', () => {
    it('should call usersService.getAllKongUsers and set usersData', () => {
      const filterDataSpy = jest.spyOn(component, 'filterData')
      component.getAllUsers()
      expect(usersServiceMock.getAllKongUsers).toHaveBeenCalledWith('root-1')
      expect(loaderServiceMock.changeLoad.next).toHaveBeenCalledWith(true)
      expect(filterDataSpy).toHaveBeenCalled()
    })
  })

  describe('onCreateClick', () => {
    it('should call onCreateUser for createUser type', () => {
      const spy = jest.spyOn(component, 'onCreateUser').mockImplementation(() => {})
      component.onCreateClick({ type: 'createUser' })
      expect(spy).toHaveBeenCalled()
    })

    it('should call onUploadClick for upload type', () => {
      const spy = jest.spyOn(component, 'onUploadClick').mockImplementation(() => {})
      component.onCreateClick({ type: 'upload' })
      expect(spy).toHaveBeenCalled()
    })

    it('should do nothing for unknown type', () => {
      const createSpy = jest.spyOn(component, 'onCreateUser').mockImplementation(() => {})
      const uploadSpy = jest.spyOn(component, 'onUploadClick').mockImplementation(() => {})
      component.onCreateClick({ type: 'unknown' })
      expect(createSpy).not.toHaveBeenCalled()
      expect(uploadSpy).not.toHaveBeenCalled()
    })
  })

  describe('onCreateUser', () => {
    it('should navigate to create-user and raise telemetry', () => {
      component.onCreateUser()
      expect(routerMock.navigate).toHaveBeenCalledWith(['/app/users/create-user'])
      expect(eventsMock.raiseInteractTelemetry).toHaveBeenCalled()
    })
  })

  describe('onUploadClick', () => {
    it('should call filter with upload', () => {
      const spy = jest.spyOn(component, 'filter')
      component.onUploadClick()
      expect(spy).toHaveBeenCalledWith('upload')
    })
  })

  describe('onRoleClick', () => {
    it('should navigate to user details and raise telemetry', () => {
      component.onRoleClick({ userId: 'u9' })
      expect(routerMock.navigate).toHaveBeenCalledWith(['/app/users/u9/details'])
      expect(eventsMock.raiseInteractTelemetry).toHaveBeenCalled()
    })
  })

  describe('onEnterkySearch', () => {
    it('should call usersService.searchUserByenter and update usersData', () => {
      const filterDataSpy = jest.spyOn(component, 'filterData')
      component.onEnterkySearch('john')
      expect(usersServiceMock.searchUserByenter).toHaveBeenCalledWith('john', 'root-1')
      expect(filterDataSpy).toHaveBeenCalled()
    })
  })

  describe('menuActions', () => {
    it('should open karma window for showOnKarma action', () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
      component.menuActions({ action: 'showOnKarma', row: { userId: 'u10' } })
      expect(openSpy).toHaveBeenCalled()
      openSpy.mockRestore()
    })

    it('should block user and show snackbar on success for block action', () => {
      const getAllUsersSpy = jest.spyOn(component, 'getAllUsers').mockImplementation(() => {})
      usersServiceMock.blockUser.mockReturnValue(of({ result: { response: 'Blocked!' } }))
      component.menuActions({ action: 'block', row: { userId: 'u11', role: ['admin'] } })
      expect(usersServiceMock.blockUser).toHaveBeenCalled()
      expect(getAllUsersSpy).toHaveBeenCalled()
      expect(snackBarMock.open).toHaveBeenCalledWith('Blocked!')
    })

    it('should not call getAllUsers/snackbar when block response falsy', () => {
      const getAllUsersSpy = jest.spyOn(component, 'getAllUsers').mockImplementation(() => {})
      usersServiceMock.blockUser.mockReturnValue(of(null))
      component.menuActions({ action: 'block', row: { userId: 'u11', role: ['admin'] } })
      expect(getAllUsersSpy).not.toHaveBeenCalled()
    })

    it('should unblock user and show snackbar on success for unblock action', () => {
      const getAllUsersSpy = jest.spyOn(component, 'getAllUsers').mockImplementation(() => {})
      usersServiceMock.blockUser.mockReturnValue(of({ result: { response: 'ok' } }))
      component.menuActions({ action: 'unblock', row: { userId: 'u12', role: [] } })
      expect(getAllUsersSpy).toHaveBeenCalled()
      expect(snackBarMock.open).toHaveBeenCalledWith('Updated successfully !')
    })

    it('should deactivate user successfully with setTimeout flow', () => {
      jest.useFakeTimers()
      const getAllUsersSpy = jest.spyOn(component, 'getAllUsers').mockImplementation(() => {})
      usersServiceMock.newBlockUser.mockReturnValue(of({ params: { status: 'SUCCESS' } }))
      component.menuActions({ action: 'deactive', row: { userId: 'u13' } })
      jest.advanceTimersByTime(1500)
      expect(getAllUsersSpy).toHaveBeenCalled()
      expect(snackBarMock.open).toHaveBeenCalledWith('Deactivated successfully!')
    })

    it('should handle deactivate failure status', () => {
      usersServiceMock.newBlockUser.mockReturnValue(of({ params: { status: 'FAILED' } }))
      component.menuActions({ action: 'deactive', row: { userId: 'u14' } })
      expect(snackBarMock.open).toHaveBeenCalledWith('Update unsuccess!')
    })

    it('should handle deactivate error from service', () => {
      usersServiceMock.newBlockUser.mockReturnValue(throwError(() => new Error('fail')))
      component.menuActions({ action: 'deactive', row: { userId: 'u15' } })
      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Given User Data doesnt exist in our records. Please provide a valid one.'
      )
    })

    it('should activate user successfully with setTimeout flow', () => {
      jest.useFakeTimers()
      const getAllUsersSpy = jest.spyOn(component, 'getAllUsers').mockImplementation(() => {})
      usersServiceMock.newUnBlockUser.mockReturnValue(of({ params: { status: 'SUCCESS' } }))
      component.menuActions({ action: 'active', row: { userId: 'u16', role: ['admin'] } })
      jest.advanceTimersByTime(1500)
      expect(getAllUsersSpy).toHaveBeenCalled()
      expect(snackBarMock.open).toHaveBeenCalledWith('Activated successfully!')
    })

    it('should handle activate failure status', () => {
      usersServiceMock.newUnBlockUser.mockReturnValue(of({ params: { status: 'FAILED' } }))
      component.menuActions({ action: 'active', row: { userId: 'u17', role: [] } })
      expect(snackBarMock.open).toHaveBeenCalledWith('Update unsuccess!')
    })

    it('should do nothing for unrecognized action', () => {
      expect(() => component.menuActions({ action: 'delete', row: {} })).not.toThrow()
    })
  })
})
