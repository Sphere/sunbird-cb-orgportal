import { of } from 'rxjs'
import { UsersComponent } from './users.component'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { environment } from '../../../../../../../../../src/environments/environment'

describe('UsersComponent', () => {
  let component: UsersComponent
  let usersSvc: any
  let router: any
  let route: any

  beforeEach(() => {
    usersSvc = createSpyObj('UsersService', ['getUsers', 'blockUser', 'deActiveUser', 'activeUser'])
    router = { url: '/app/access/Admin%20Role/users' }
    route = { snapshot: { parent: { data: {} }, data: {} } }
    component = new UsersComponent(usersSvc, router as any, route as any)
  })

  it('should be created', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('derives role/roleName from the router url and builds the table config', () => {
      component.ngOnInit()
      expect(component.role).toBe('Admin%20Role')
      expect(component.roleName).toBe('Admin Role')
      expect(component.tabledata.columns).toHaveLength(3)
      expect(component.configSvc).toEqual({})
    })

    it('uses configService from route snapshot when present', () => {
      route.snapshot.parent.data.configService = { foo: 'bar' }
      component.ngOnInit()
      expect(component.configSvc).toEqual({ foo: 'bar' })
    })

    it('uses usersList data from route snapshot when present', () => {
      route.snapshot.data.usersList = { data: { content: [] } }
      component.ngOnInit()
      expect(component.usersData).toEqual({ content: [] })
    })
  })

  it('ngAfterViewInit does not throw', () => {
    expect(() => component.ngAfterViewInit()).not.toThrow()
  })

  describe('fetchUsersWithRole', () => {
    it('maps users response into flattened row data', () => {
      component.role = 'Admin'
      usersSvc.getUsers.mockReturnValue(of({
        users: [{ first_name: 'A', last_name: 'B', email: 'a@b.com', department_name: 'IT', wid: 'w1' }],
      }))
      component.fetchUsersWithRole()
      expect(usersSvc.getUsers).toHaveBeenCalledWith('Admin')
      expect(component.data).toEqual([
        { fullName: 'A B', email: 'a@b.com', position: 'IT', role: 'Admin', wid: 'w1' },
      ])
    })
  })

  describe('getRoleList', () => {
    it('returns empty array when user has no organisations', () => {
      expect(component.getRoleList({})).toEqual([])
    })

    it('joins matching organisation roles into <li> markup', () => {
      component.configSvc = { unMappedUser: { rootOrg: { id: 'org1' } } }
      const user = {
        organisations: [
          { organisationId: 'org1', roles: ['Admin', 'Viewer'] },
          { organisationId: 'org2', roles: ['Other'] },
        ],
      }
      expect(component.getRoleList(user)).toBe('<li>Admin</li><li>Viewer</li>')
    })
  })

  describe('getMyDepartment', () => {
    it('sets data to empty array when usersData has no content', () => {
      component.usersData = null
      component.getMyDepartment()
      expect(component.data).toEqual([])
    })

    it('filters users whose organisations include roleName and maps them', () => {
      component.roleName = 'Admin'
      component.configSvc = {}
      component.usersData = {
        content: [
          {
            firstName: 'A', lastName: 'B', userId: 'u1',
            isDeleted: false,
            organisations: [{ isDeleted: false, roles: ['Admin'] }],
          },
          {
            firstName: 'C', lastName: 'D', userId: 'u2',
            isDeleted: false,
            organisations: [{ isDeleted: false, roles: ['Other'] }],
          },
          { firstName: 'E', lastName: 'F', userId: 'u3', isDeleted: true, organisations: [] },
        ],
      }
      component.getMyDepartment()
      expect(component.data).toHaveLength(1)
      expect(component.data[0]).toMatchObject({ fullName: 'A B', wid: 'u1' })
    })
  })

  it('ngOnDestroy unsubscribes when subscription exists', () => {
    const unsubscribe = jest.fn()
    ;(component as any).defaultSideNavBarOpenedSubscription = { unsubscribe }
    component.ngOnDestroy()
    expect(unsubscribe).toHaveBeenCalled()
  })

  it('ngOnDestroy is a no-op when no subscription exists', () => {
    expect(() => component.ngOnDestroy()).not.toThrow()
  })

  describe('menuActions', () => {
    beforeEach(() => {
      component.data2 = { id: 'dept1' }
      jest.spyOn(window, 'open').mockImplementation(() => null)
    })

    afterEach(() => jest.restoreAllMocks())

    it('showOnKarma opens the karma person-profile page', () => {
      component.menuActions({ action: 'showOnKarma', row: { wid: 'w1' } })
      expect(window.open).toHaveBeenCalledWith(`${environment.karmYogiPath}/app/person-profile/w1`)
    })

    it('block calls usersSvc.blockUser with isBlocked true', () => {
      component.menuActions({ action: 'block', row: { wid: 'w1', roleInfo: [{ roleName: 'R1' }] } })
      expect(usersSvc.blockUser).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'w1', deptId: 'dept1', isBlocked: true, roles: ['R1'] }),
      )
    })

    it('unblock calls usersSvc.blockUser with isBlocked false', () => {
      component.menuActions({ action: 'unblock', row: { wid: 'w1', roleInfo: [] } })
      expect(usersSvc.blockUser).toHaveBeenCalledWith(expect.objectContaining({ isBlocked: false }))
    })

    it('deactive calls usersSvc.deActiveUser with isActive false', () => {
      component.menuActions({ action: 'deactive', row: { wid: 'w1', roleInfo: [] } })
      expect(usersSvc.deActiveUser).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }))
    })

    it('active calls usersSvc.activeUser with isActive true', () => {
      component.menuActions({ action: 'active', row: { wid: 'w1', roleInfo: [] } })
      expect(usersSvc.activeUser).toHaveBeenCalledWith(expect.objectContaining({ isActive: true }))
    })

    it('unknown action is a no-op', () => {
      expect(() => component.menuActions({ action: 'unknown', row: { wid: 'w1' } })).not.toThrow()
    })
  })
})
