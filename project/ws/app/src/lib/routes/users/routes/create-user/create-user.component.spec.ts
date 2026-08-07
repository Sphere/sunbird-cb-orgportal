import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { ValueService } from '@sunbird-cb/utils'
import { Subject, of, throwError } from 'rxjs'
import { CreateUserComponent } from './create-user.component'
import { UsersService } from '../../services/users.service'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('CreateUserComponent', () => {
  let component: CreateUserComponent
  let fixture: ComponentFixture<CreateUserComponent>
  let mockUsersSvc: jest.Mocked<UsersService>
  let mockRouter: jest.Mocked<Router>
  let mockSnackBar: jest.Mocked<MatSnackBar>
  let routerEvents$: Subject<any>
  let isLtMedium$: Subject<boolean>
  let activeRouteMock: any

  const buildActiveRoute = (overrides: any = {}) => ({
    snapshot: {
      data: {
        configService: {
          userRoles: new Set(['ADMIN']),
          userProfile: {},
          unMappedUser: { rootOrgId: 'org-1', channel: 'Channel1', rootOrg: { flagA: true } },
          ...overrides.configService,
        },
        pageData: { data: { menus: { widgetData: {} } } },
        profileData: {},
        rolesList: {
          data: {
            orgTypeList: [
              { flags: ['flagA'], roles: ['ROLE_A', 'ROLE_B'] },
              { flags: ['flagB'], roles: ['ROLE_C'] },
            ],
          },
        },
        ...overrides.data,
      },
    },
  })

  beforeEach(async () => {
    routerEvents$ = new Subject()
    isLtMedium$ = new Subject<boolean>()
    mockUsersSvc = createSpyObj('UsersService', ['createUser', 'addUserToDepartment'])
    mockRouter = createSpyObj('Router', ['navigate']) as any
    ;(mockRouter as any).events = routerEvents$.asObservable()
    mockSnackBar = createSpyObj('MatSnackBar', ['open'])
    activeRouteMock = buildActiveRoute()

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [CreateUserComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: activeRouteMock },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: UsersService, useValue: mockUsersSvc },
        { provide: ValueService, useValue: { isLtMedium$: isLtMedium$.asObservable() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(CreateUserComponent)
    component = fixture.componentInstance
  })

  it('should create and set myRoles from configService.userRoles', () => {
    expect(component).toBeTruthy()
    expect(component.myRoles).toEqual(new Set(['ADMIN']))
  })

  it('should build createUserForm with expected controls', () => {
    expect(component.createUserForm.contains('fname')).toBe(true)
    expect(component.createUserForm.contains('lname')).toBe(true)
    expect(component.createUserForm.contains('email')).toBe(true)
    expect(component.createUserForm.contains('department')).toBe(true)
    expect(component.createUserForm.contains('roles')).toBe(true)
  })

  it('router NavigationEnd should bind url and set widgetData when no profileData present', () => {
    routerEvents$.next(new NavigationEnd(1, '/app/home/users/list', '/app/home/users/list'))
    expect(component.currentRoute).toBe('users/list')
    expect(component.widgetData).toEqual(activeRouteMock.snapshot.data.pageData.data.menus)
  })

  it('router NavigationEnd should build widgetData from profileData when present', () => {
    activeRouteMock.snapshot.data.profileData = { data: 'x' }
    activeRouteMock.snapshot.data.profileData.data = { channel: 'ChannelX' }
    routerEvents$.next(new NavigationEnd(1, '/app/home/dashboard', '/app/home/dashboard'))
    expect(component.widgetData.widgetData.logo).toBe(true)
    expect(component.widgetData.widgetData.name).toBe('ChannelX')
    expect(component.widgetData.widgetData.userRoles).toEqual(component.myRoles)
  })

  it('router NavigationEnd should populate department, departmentName and rolesList from route data', () => {
    routerEvents$.next(new NavigationEnd(1, '/app/home/users', '/app/home/users'))
    expect(component.department).toBe('org-1')
    expect(component.departmentName).toBe('Channel1')
    expect(component.rolesList).toEqual(
      expect.arrayContaining([
        { roleName: 'ROLE_A', description: 'ROLE_A' },
        { roleName: 'ROLE_B', description: 'ROLE_B' },
      ]),
    )
    expect(component.rolesList).toHaveLength(2)
  })

  it('router NavigationEnd should not duplicate roles already present in rolesList', () => {
    routerEvents$.next(new NavigationEnd(1, '/app/home/users', '/app/home/users'))
    routerEvents$.next(new NavigationEnd(2, '/app/home/users', '/app/home/users'))
    expect(component.rolesList).toHaveLength(2)
  })

  it('router NavigationEnd should update configService.userProfile.departmentName when applicable', () => {
    activeRouteMock.snapshot.data.configService.userProfile = { departmentName: 'old' }
    routerEvents$.next(new NavigationEnd(1, '/app/home/users', '/app/home/users'))
    expect(component.configService.userProfile.departmentName).toBe('Channel1')
  })

  it('ngOnInit should subscribe to isLtMedium$ and set sideNavBarOpened / screenSizeIsLtMedium', () => {
    component.ngOnInit()
    isLtMedium$.next(true)
    expect(component.sideNavBarOpened).toBe(false)
    expect(component.screenSizeIsLtMedium).toBe(true)
    isLtMedium$.next(false)
    expect(component.sideNavBarOpened).toBe(true)
    expect(component.screenSizeIsLtMedium).toBe(false)
  })

  it('handleScroll should set sticky true when scrolled past elementPosition', () => {
    component.elementPosition = 100
    Object.defineProperty(window, 'pageYOffset', { value: 200, configurable: true })
    component.handleScroll()
    expect(component.sticky).toBe(true)
  })

  it('handleScroll should set sticky false when not scrolled past elementPosition', () => {
    component.elementPosition = 500
    Object.defineProperty(window, 'pageYOffset', { value: 100, configurable: true })
    component.handleScroll()
    expect(component.sticky).toBe(false)
  })

  it('modifyUserRoles should add a role when not present', () => {
    component.modifyUserRoles('EDITOR')
    expect(component.userRoles.has('EDITOR')).toBe(true)
  })

  it('modifyUserRoles should remove a role when already present', () => {
    component.userRoles.add('EDITOR')
    component.modifyUserRoles('EDITOR')
    expect(component.userRoles.has('EDITOR')).toBe(false)
  })

  it('bindUrl should set currentRoute when path is truthy', () => {
    component.bindUrl('some/path')
    expect(component.currentRoute).toBe('some/path')
  })

  it('bindUrl should not change currentRoute when path is falsy', () => {
    component.currentRoute = 'unchanged'
    component.bindUrl('')
    expect(component.currentRoute).toBe('unchanged')
  })

  it('ngOnDestroy should unsubscribe the sidenav subscription when present', () => {
    component.ngOnInit()
    const sub = (component as any).defaultSideNavBarOpenedSubscription
    const unsubSpy = jest.spyOn(sub, 'unsubscribe')
    component.ngOnDestroy()
    expect(unsubSpy).toHaveBeenCalled()
  })

  it('ngOnDestroy should not throw when no subscription exists', () => {
    ;(component as any).defaultSideNavBarOpenedSubscription = undefined
    expect(() => component.ngOnDestroy()).not.toThrow()
  })

  describe('onSubmit', () => {
    beforeEach(() => {
      component.departmentName = 'Channel1'
      component.department = 'org-1'
    })

    it('should create user, add to department, reset form, show success message and navigate on full success', () => {
      mockUsersSvc.createUser.mockReturnValue(of({ userId: 'user-1' }) as any)
      mockUsersSvc.addUserToDepartment.mockReturnValue(of({ ok: true }) as any)
      const resetSpy = jest.spyOn(component.createUserForm, 'reset')

      component.onSubmit({ value: { email: 'a@b.com', fname: 'A', lname: 'B', roles: ['ROLE_A'] } })

      expect(mockUsersSvc.createUser).toHaveBeenCalledWith({
        personalDetails: {
          email: 'a@b.com',
          userName: 'A',
          firstName: 'A',
          lastName: 'B',
          channel: 'Channel1',
        },
      })
      // NOTE: current (buggy) behavior — the component computes
      // `_.toLength(form.value.roles) === 0 ? ['PUBLIC'] : form.value.roles`.
      // `_.toLength` coerces its argument through `toNumber`, and a single-element
      // array like ['ROLE_A'] coerces to NaN -> 0, so toLength(['ROLE_A']) === 0
      // is true and the component falls back to ['PUBLIC'] even though a role
      // was actually selected.
      expect(mockUsersSvc.addUserToDepartment).toHaveBeenCalledWith({
        request: { organisationId: 'org-1', userId: 'user-1', roles: ['PUBLIC'] },
      })
      expect(resetSpy).toHaveBeenCalledWith({ fname: '', lname: '', email: '', department: 'Channel1', roles: '' })
      expect(mockSnackBar.open).toHaveBeenCalledWith('User Created Successfully', 'X', { duration: 5000 })
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/users'])
    })

    it('should default roles to PUBLIC when form roles is empty', () => {
      mockUsersSvc.createUser.mockReturnValue(of({ userId: 'user-1' }) as any)
      mockUsersSvc.addUserToDepartment.mockReturnValue(of({ ok: true }) as any)

      component.onSubmit({ value: { email: 'a@b.com', fname: 'A', lname: 'B', roles: '' } })

      expect(mockUsersSvc.addUserToDepartment).toHaveBeenCalledWith({
        request: { organisationId: 'org-1', userId: 'user-1', roles: ['PUBLIC'] },
      })
    })

    it('should send channel as null when departmentName is empty', () => {
      component.departmentName = ''
      mockUsersSvc.createUser.mockReturnValue(of({ userId: 'user-1' }) as any)
      mockUsersSvc.addUserToDepartment.mockReturnValue(of({ ok: true }) as any)

      component.onSubmit({ value: { email: 'a@b.com', fname: 'A', lname: 'B', roles: '' } })

      expect(mockUsersSvc.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ personalDetails: expect.objectContaining({ channel: null }) }),
      )
    })

    it('should not add user to department when createUser resolves falsy', () => {
      mockUsersSvc.createUser.mockReturnValue(of(null) as any)

      component.onSubmit({ value: { email: 'a@b.com', fname: 'A', lname: 'B', roles: '' } })

      expect(mockUsersSvc.addUserToDepartment).not.toHaveBeenCalled()
    })

    it('should show error snackbar with err.error when addUserToDepartment fails', () => {
      mockUsersSvc.createUser.mockReturnValue(of({ userId: 'user-1' }) as any)
      mockUsersSvc.addUserToDepartment.mockReturnValue(throwError({ error: 'add-failed' }))

      component.onSubmit({ value: { email: 'a@b.com', fname: 'A', lname: 'B', roles: '' } })

      expect(mockSnackBar.open).toHaveBeenCalledWith('add-failed', 'X', { duration: 5000 })
    })

    it('should show fallback error message when addUserToDepartment fails without err.error', () => {
      mockUsersSvc.createUser.mockReturnValue(of({ userId: 'user-1' }) as any)
      mockUsersSvc.addUserToDepartment.mockReturnValue(throwError(''))

      component.onSubmit({ value: { email: 'a@b.com', fname: 'A', lname: 'B', roles: '' } })

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        `Some error occurred while updateing new user's role, Please try again later!`,
        'X',
        { duration: 5000 },
      )
    })

    it('should show error snackbar with err.error when createUser fails', () => {
      mockUsersSvc.createUser.mockReturnValue(throwError({ error: 'create-failed' }))

      component.onSubmit({ value: { email: 'a@b.com', fname: 'A', lname: 'B', roles: '' } })

      expect(mockSnackBar.open).toHaveBeenCalledWith('create-failed', 'X', { duration: 5000 })
      expect(mockUsersSvc.addUserToDepartment).not.toHaveBeenCalled()
    })

    it('should show fallback error message when createUser fails without err.error', () => {
      mockUsersSvc.createUser.mockReturnValue(throwError(''))

      component.onSubmit({ value: { email: 'a@b.com', fname: 'A', lname: 'B', roles: '' } })

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Some error occurred while creating user, Please try again later!',
        'X',
        { duration: 5000 },
      )
    })
  })
})
