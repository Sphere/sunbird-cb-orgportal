import { RolesAccessComponent } from './roles-access.component'

describe('RolesAccessComponent', () => {
  let component: RolesAccessComponent
  let routerMock: any
  let activeRouterMock: any

  beforeEach(() => {
    routerMock = {
      navigate: jest.fn(),
    }
    activeRouterMock = {
      snapshot: {
        data: {
          usersList: {
            data: {
              content: [],
            },
          },
        },
      },
    }
    component = new RolesAccessComponent(routerMock, activeRouterMock)
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should set tabledata and call fetchRolesNew', () => {
      const spy = jest.spyOn(component, 'fetchRolesNew')
      component.ngOnInit()
      expect(component.tabledata.columns).toEqual([
        { displayName: 'Role', key: 'role' },
        { displayName: 'Number of users', key: 'count' },
      ])
      expect(component.tabledata.needCheckBox).toBe(false)
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('ngAfterViewInit', () => {
    it('should not throw', () => {
      expect(() => component.ngAfterViewInit()).not.toThrow()
    })
  })

  describe('ngOnDestroy', () => {
    it('should not throw', () => {
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })

  describe('onRoleClick', () => {
    it('should navigate to the role users route', () => {
      component.onRoleClick({ role: 'admin' })
      expect(routerMock.navigate).toHaveBeenCalledWith(['/app/roles/admin/users'])
    })
  })

  describe('fetchRolesNew', () => {
    it('should set data to empty array when usersList content is empty', () => {
      activeRouterMock.snapshot.data.usersList.data.content = []
      component.fetchRolesNew()
      expect(component.data).toEqual([])
    })

    it('should set data to empty array when usersList data is missing entirely', () => {
      activeRouterMock.snapshot.data = {}
      component.fetchRolesNew()
      expect(component.data).toEqual([])
    })

    it('should build role counts from organisations roles', () => {
      activeRouterMock.snapshot.data.usersList.data.content = [
        {
          organisations: [
            { roles: ['admin', 'member'] },
            { roles: ['admin'] },
          ],
        },
        {
          organisations: [
            { roles: ['viewer'] },
          ],
        },
      ]
      component.fetchRolesNew()
      expect(component.data.length).toBe(3)
      const roleMap: any = {}
      component.data.forEach((d: any) => { roleMap[d.role] = d.count })
      expect(roleMap['admin']).toBe(2)
      expect(roleMap['member']).toBe(1)
      expect(roleMap['viewer']).toBe(1)
    })

    it('should handle content items with missing organisations gracefully', () => {
      activeRouterMock.snapshot.data.usersList.data.content = [
        { organisations: undefined },
      ]
      expect(() => component.fetchRolesNew()).not.toThrow()
      expect(component.data.length).toBe(1)
    })

    it('should handle an empty-string role key', () => {
      activeRouterMock.snapshot.data.usersList.data.content = [
        {
          organisations: [
            { roles: [''] },
          ],
        },
      ]
      component.fetchRolesNew()
      expect(component.data.length).toBe(1)
      expect(component.data[0].count).toBe(1)
    })
  })
})
