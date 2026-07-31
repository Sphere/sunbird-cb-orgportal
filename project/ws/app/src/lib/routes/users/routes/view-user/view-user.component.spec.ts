import { UntypedFormBuilder } from '@angular/forms'
import { of, Subject } from 'rxjs'
import { NavigationEnd } from '@angular/router'
import { ViewUserComponent } from './view-user.component'
import { RoleConfirmDialogComponent } from '../../../../../../../../../src/app/plugins/skill/components/role-confirm-dialog/role-confirm-dialog.component'

describe('ViewUserComponent', () => {
  let component: ViewUserComponent
  let routerEvents$: Subject<any>
  let queryParamMap$: Subject<any>
  let activeRouteMock: any
  let routerMock: any
  let eventsMock: any
  let usersSvcMock: any
  let dialogMock: any
  let snackBarMock: any

  const buildActiveRoute = (profileData: any = {}) => ({
    snapshot: {
      data: {
        configService: {
          unMappedUser: {
            rootOrgId: 'org1',
            channel: 'chan1',
            rootOrg: { flagA: true },
          },
        },
        profileData: {
          data: profileData,
        },
        rolesList: {
          data: {
            orgTypeList: [
              { flags: ['flagA'], roles: ['ROLE_A', 'ROLE_B'] },
              { flags: ['flagB'], roles: ['ROLE_C'] },
            ],
          },
        },
      },
    },
    data: of({ pageData: { data: { profileData: [{ key: 'k1' }], profileDataKey: [{ key: 'pk1' }] } } }),
    queryParamMap: queryParamMap$.asObservable(),
  })

  const setup = (profileData: any = {}) => {
    routerEvents$ = new Subject()
    queryParamMap$ = new Subject()

    activeRouteMock = buildActiveRoute(profileData)
    routerMock = {
      events: routerEvents$.asObservable(),
      navigate: jest.fn(),
    }
    eventsMock = {
      raiseInteractTelemetry: jest.fn(),
    }
    usersSvcMock = {
      updateProfileDetails: jest.fn(() => of({ success: true })),
      addUserToDepartment: jest.fn(() => of({ success: true })),
    }
    dialogMock = {
      open: jest.fn(() => ({
        afterClosed: jest.fn(() => of(true)),
      })),
    }
    snackBarMock = {
      open: jest.fn(),
    }

    component = new ViewUserComponent(
      activeRouteMock,
      routerMock,
      eventsMock,
      new UntypedFormBuilder(),
      usersSvcMock,
      dialogMock,
      snackBarMock,
    )
  }

  const fullProfileData = {
    id: 'user123',
    isDeleted: false,
    roles: ['ROLE_A'],
    profileDetails: {
      profileReq: {
        personalDetails: {
          firstname: 'John',
          surname: 'Doe',
          officialEmail: 'john@doe.com',
          dob: '1990-01-01',
        },
        academics: [
          { type: 'X_STANDARD', nameOfInstitute: 'School10', yearOfPassing: '2005' },
          { type: 'XII_STANDARD', nameOfInstitute: 'School12', yearOfPassing: '2007' },
          { type: 'GRADUATE', nameOfQualification: 'BSc', nameOfInstitute: 'Uni', yearOfPassing: '2011' },
          { type: 'POSTGRADUATE', nameOfQualification: 'MSc', nameOfInstitute: 'Uni2', yearOfPassing: '2013' },
        ],
        professionalDetails: [
          {
            name: 'Acme', orgType: 'Others', orgOtherSpecify: 'spec', nameOther: 'AcmeOther',
            industry: 'IT', industryOther: '', designation: 'Dev', profession: 'Others',
            professionOtherSpecify: 'profSpec', location: 'Bangalore', responsibilities: 'code',
            doj: '01-02-2020', description: 'desc', completePostalAddress: 'addr',
          },
        ],
        employmentDetails: {
          service: 'svc', cadre: 'cadre1', allotmentYearOfService: '2010',
          dojOfService: '01-01-2015', payType: 'payType1', civilListNo: 'clno',
          employeeCode: 'ec1', officialPostalAddress: 'offaddr', pinCode: '560001',
        },
        skills: { additionalSkills: 'skillDesc', certificateDetails: 'certDesc' },
        interests: { professional: 'profInterest', hobbies: 'hobby1' },
      },
    },
  }

  describe('constructor / router NavigationEnd handling', () => {
    it('should populate profile fields when profileData is present', () => {
      setup(fullProfileData)
      routerEvents$.next(new NavigationEnd(1, '/a', '/a'))

      expect(component.userID).toBe('user123')
      expect(component.fullname).toBe('John Doe')
      expect(component.userStatus).toBe('Active')
      expect(component.department).toBe('org1')
      expect(component.departmentName).toBe('chan1')
      expect(component.rolesList.length).toBeGreaterThan(0)
      expect(component.orguserRoles).toContain('ROLE_A')
      expect(component.userRoles.has('ROLE_A')).toBe(true)
      expect(component.updateUserDetailsForm.get('firstname')!.value).toBe('John')
      expect(component.updateUserDetailsForm.get('surname')!.value).toBe('Doe')
      expect(component.isOfficialEmail).toBe(true)
    })

    it('should mark userStatus Inactive when isDeleted is true', () => {
      const data = { ...fullProfileData, isDeleted: true, roles: [] }
      setup(data)
      routerEvents$.next(new NavigationEnd(1, '/a', '/a'))
      expect(component.userStatus).toBe('Inactive')
    })

    it('should handle absence of profileData gracefully', () => {
      setup({})
      expect(() => routerEvents$.next(new NavigationEnd(1, '/a', '/a'))).not.toThrow()
      expect(component.userData).toBe('')
    })

    it('should set MDOinfo breadcrumbs when qpParam is MDOinfo', () => {
      setup(fullProfileData)
      routerEvents$.next(new NavigationEnd(1, '/a', '/a'))
      queryParamMap$.next({ get: (k: string) => (k === 'param' ? 'MDOinfo' : null) })
      expect(component.qpParam).toBe('MDOinfo')
      expect(component.breadcrumbs.titles.some((t: any) => t.title === 'MDO information')).toBe(true)
    })

    it('should set default breadcrumbs when qpParam is not MDOinfo', () => {
      setup(fullProfileData)
      routerEvents$.next(new NavigationEnd(1, '/a', '/a'))
      queryParamMap$.next({ get: () => null })
      expect(component.breadcrumbs.titles.some((t: any) => t.title === 'MDO information')).toBe(false)
    })
  })

  describe('ngOnInit', () => {
    it('should populate tabsData with 5 tabs', () => {
      setup()
      component.ngOnInit()
      expect(component.tabsData.length).toBe(5)
      expect(component.tabsData[0].key).toBe('personalInfo')
    })
  })

  describe('ngAfterViewInit', () => {
    it('should set elementPosition from menuElement', () => {
      setup()
      component.menuElement = {
        nativeElement: { parentElement: { offsetTop: 150 } },
      } as any
      component.ngAfterViewInit()
      expect(component.elementPosition).toBe(150)
    })
  })

  describe('handleScroll', () => {
    it('should set sticky true when scroll position exceeds elementPosition', () => {
      setup()
      component.elementPosition = 100
      Object.defineProperty(window, 'pageYOffset', { value: 200, configurable: true })
      component.handleScroll()
      expect(component.sticky).toBe(true)
    })

    it('should set sticky false when scroll position is below elementPosition', () => {
      setup()
      component.elementPosition = 500
      Object.defineProperty(window, 'pageYOffset', { value: 10, configurable: true })
      component.handleScroll()
      expect(component.sticky).toBe(false)
    })
  })

  describe('modifyUserRoles', () => {
    it('should add role if not present', () => {
      setup()
      component.modifyUserRoles('ROLE_X')
      expect(component.userRoles.has('ROLE_X')).toBe(true)
    })

    it('should remove role if already present', () => {
      setup()
      component.userRoles.add('ROLE_X')
      component.modifyUserRoles('ROLE_X')
      expect(component.userRoles.has('ROLE_X')).toBe(false)
    })
  })

  describe('onSideNavTabClick', () => {
    it('should set currentTab and raise telemetry, scroll into view if element exists', () => {
      setup()
      component.ngOnInit()
      const scrollIntoViewMock = jest.fn()
      const fakeEl = { scrollIntoView: scrollIntoViewMock }
      jest.spyOn(document, 'getElementById').mockReturnValue(fakeEl as any)

      component.onSideNavTabClick('academics')

      expect(component.currentTab).toBe('academics')
      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start', inline: 'start' })
      expect(eventsMock.raiseInteractTelemetry).toHaveBeenCalled()
    })

    it('should not throw and not scroll when element is not found', () => {
      setup()
      component.ngOnInit()
      jest.spyOn(document, 'getElementById').mockReturnValue(null)
      expect(() => component.onSideNavTabClick('skills')).not.toThrow()
      expect(component.currentTab).toBe('skills')
    })
  })

  describe('changeToDefaultImg', () => {
    it('should set the default image src', () => {
      setup()
      const event = { target: { src: 'old.png' } }
      component.changeToDefaultImg(event)
      expect(event.target.src).toContain('aastrika_menu_logo.svg')
    })
  })

  describe('resetRoles', () => {
    it('should set roles control value to orguserRoles', () => {
      setup()
      component.orguserRoles = ['ROLE_A', 'ROLE_B']
      component.resetRoles()
      expect(component.updateUserRoleForm.controls['roles'].value).toEqual(['ROLE_A', 'ROLE_B'])
    })
  })

  describe('changeformat', () => {
    it('should format date as dd-mm-yyyy with zero padding', () => {
      setup()
      const date = new Date(2021, 0, 5) // Jan 5 2021
      expect(component.changeformat(date)).toBe('05-01-2021')
    })

    it('should format date without extra padding for double digit day/month', () => {
      setup()
      const date = new Date(2021, 10, 25) // Nov 25 2021
      expect(component.changeformat(date)).toBe('25-11-2021')
    })
  })

  describe('checkvalue', () => {
    it('should return undefined when value is the literal string "undefined"', () => {
      setup()
      expect(component.checkvalue('undefined')).toBeUndefined()
    })

    it('should return the value unchanged otherwise', () => {
      setup()
      expect(component.checkvalue('actual')).toBe('actual')
    })
  })

  describe('dobData', () => {
    it('should patch dob value on the form', () => {
      setup()
      component.dobData('2020-05-05')
      expect(component.updateUserDetailsForm.get('dob')!.value).toBe('2020-05-05')
    })
  })

  describe('updateUser', () => {
    it('should call updateProfileDetails and navigate to users list on success', () => {
      setup(fullProfileData)
      routerEvents$.next(new NavigationEnd(1, '/a', '/a'))
      component.userData = fullProfileData.profileDetails.profileReq
      component.userID = 'user123'
      const openSnackbarSpy = jest.spyOn<any, any>(component, 'openSnackbar')

      const form = { value: { firstname: 'Jane' } }
      component.updateUser(form)

      expect(usersSvcMock.updateProfileDetails).toHaveBeenCalled()
      expect(openSnackbarSpy).toHaveBeenCalledWith('User profile details updated successfully!')
      expect(routerMock.navigate).toHaveBeenCalledWith(['/app/home/users'])
    })

    it('should navigate to mdoinfo leadership when qpParam is MDOinfo', () => {
      setup(fullProfileData)
      routerEvents$.next(new NavigationEnd(1, '/a', '/a'))
      component.userData = fullProfileData.profileDetails.profileReq
      component.userID = 'user123'
      component.qpParam = 'MDOinfo'

      component.updateUser({ value: {} })

      expect(routerMock.navigate).toHaveBeenCalledWith(['/app/home/mdoinfo/leadership'])
    })

    it('should not navigate if service returns falsy response', () => {
      setup(fullProfileData)
      routerEvents$.next(new NavigationEnd(1, '/a', '/a'))
      component.userData = fullProfileData.profileDetails.profileReq
      component.userID = 'user123'
      usersSvcMock.updateProfileDetails.mockReturnValue(of(null))

      component.updateUser({ value: {} })

      expect(routerMock.navigate).not.toHaveBeenCalled()
    })
  })

  describe('onSubmit', () => {
    it('should open snackbar with "Select new roles" if roles unchanged', () => {
      setup()
      component.orguserRoles = ['ROLE_A']
      const openSnackbarSpy = jest.spyOn<any, any>(component, 'openSnackbar')

      // form.value.roles must be the SAME reference as orguserRoles since the component
      // compares with strict inequality (!==), which is always true for distinct array literals
      component.onSubmit({ value: { roles: component.orguserRoles } })

      expect(openSnackbarSpy).toHaveBeenCalledWith('Select new roles')
      expect(usersSvcMock.addUserToDepartment).not.toHaveBeenCalled()
    })

    it('should add user to department and open confirm dialog when roles changed', () => {
      setup()
      component.orguserRoles = ['ROLE_A']
      component.department = 'org1'
      component.userID = 'user123'
      component.fullname = 'John Doe'

      component.onSubmit({ value: { roles: ['ROLE_B'] } })

      expect(usersSvcMock.addUserToDepartment).toHaveBeenCalledWith({
        request: { organisationId: 'org1', userId: 'user123', roles: ['ROLE_B'] },
      })
      expect(dialogMock.open).toHaveBeenCalledWith(RoleConfirmDialogComponent, expect.objectContaining({
        data: { user: 'John Doe', role: ['ROLE_B'] },
      }))
      expect(routerMock.navigate).toHaveBeenCalledWith(['/app/home/users'])
    })

    it('should navigate to mdoinfo leadership after dialog confirm when qpParam is MDOinfo', () => {
      setup()
      component.orguserRoles = ['ROLE_A']
      component.qpParam = 'MDOinfo'

      component.onSubmit({ value: { roles: ['ROLE_B'] } })

      expect(routerMock.navigate).toHaveBeenCalledWith(['/app/home/mdoinfo/leadership'])
    })

    it('should not navigate if dialog is closed without confirmation', () => {
      setup()
      dialogMock.open.mockReturnValue({ afterClosed: jest.fn(() => of(false)) })
      component.orguserRoles = ['ROLE_A']

      component.onSubmit({ value: { roles: ['ROLE_B'] } })

      expect(routerMock.navigate).not.toHaveBeenCalled()
    })

    it('should do nothing further if addUserToDepartment returns falsy', () => {
      setup()
      usersSvcMock.addUserToDepartment.mockReturnValue(of(null))
      component.orguserRoles = ['ROLE_A']

      component.onSubmit({ value: { roles: ['ROLE_B'] } })

      expect(dialogMock.open).not.toHaveBeenCalled()
    })
  })
})
