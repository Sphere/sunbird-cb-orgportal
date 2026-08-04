import { of, Subject } from 'rxjs'
import { NavigationEnd } from '@angular/router'
import { HomeComponent } from './home.component'

describe('HomeComponent', () => {
  let component: HomeComponent
  let routerEvents$: Subject<any>
  let valueSvcMock: any
  let routerMock: any
  let activeRouteMock: any
  let configServiceMock: any

  const buildActiveRoute = (data: any = {}) => ({
    snapshot: {
      data,
    },
  })

  const setup = (routeData: any = {}, userRoles: Set<string> = new Set()) => {
    routerEvents$ = new Subject()
    valueSvcMock = {
      isLtMedium$: of(false),
    }
    routerMock = {
      events: routerEvents$.asObservable(),
    }
    activeRouteMock = buildActiveRoute({
      configService: { userRoles },
      ...routeData,
    })
    configServiceMock = {
      userProfile: { departmentName: 'OldDept' },
    }

    component = new HomeComponent(valueSvcMock, routerMock, activeRouteMock, configServiceMock)
  }

  describe('constructor', () => {
    it('should set myRoles from activeRoute snapshot data', () => {
      setup({}, new Set(['admin']))
      expect(component.myRoles.has('admin')).toBe(true)
    })

    it('should bind url and set department info on NavigationEnd with configService', () => {
      setup({
        configService: {
          userRoles: new Set(['admin']),
          unMappedUser: { rootOrgId: 'org1', channel: 'chan1' },
        },
        pageData: { data: { menus: { widgetData: { menus: [] } } } },
      })
      routerEvents$.next(new NavigationEnd(1, '/app/home/foo', '/app/home/foo'))

      expect(component.currentRoute).toBe('foo')
      expect(component.department).toBe('org1')
      expect(component.departmentName).toBe('chan1')
      expect(component.widgetData).toBeDefined()
      expect(configServiceMock.userProfile.departmentName).toBe('chan1')
    })

    it('should filter menus for certificate_manager role', () => {
      setup({
        configService: {
          userRoles: new Set(['certificate_manager']),
          unMappedUser: { rootOrgId: 'org1', channel: 'chan1' },
        },
        pageData: {
          data: {
            menus: {
              widgetData: {
                menus: [
                  { name: 'm1', key: 'k1', requiredRoles: ['certificate_manager'] },
                  { name: 'm2', key: 'k2', requiredRoles: ['other_role'] },
                ],
              },
            },
          },
        },
      })
      routerEvents$.next(new NavigationEnd(1, '/app/home/bar', '/app/home/bar'))

      expect(component.widgetData.widgetData.menus.length).toBe(1)
      expect(component.widgetData.widgetData.menus[0].key).toBe('k1')
    })

    it('should handle absence of fullProfile gracefully', () => {
      setup({
        configService: undefined,
        pageData: { data: { menus: [] } },
      })
      expect(() => routerEvents$.next(new NavigationEnd(1, '/app/home/baz', '/app/home/baz'))).not.toThrow()
      expect(component.widgetData).toEqual([])
    })
  })

  describe('ngOnInit', () => {
    it('should subscribe to isLtMedium$ and set sideNavBarOpened/screenSizeIsLtMedium', () => {
      setup()
      component.ngOnInit()
      expect(component.sideNavBarOpened).toBe(true)
      expect(component.screenSizeIsLtMedium).toBe(false)
    })
  })

  describe('ngAfterViewInit', () => {
    it('should not throw', () => {
      setup()
      expect(() => component.ngAfterViewInit()).not.toThrow()
    })
  })

  describe('bindUrl', () => {
    it('should set currentRoute when path is truthy', () => {
      setup()
      component.bindUrl('some/path')
      expect(component.currentRoute).toBe('some/path')
    })

    it('should not change currentRoute when path is falsy', () => {
      setup()
      const prev = component.currentRoute
      component.bindUrl('')
      expect(component.currentRoute).toBe(prev)
    })
  })

  describe('handleScroll', () => {
    it('should set sticky true when scroll exceeds elementPosition', () => {
      setup()
      component.elementPosition = 100
      Object.defineProperty(window, 'pageYOffset', { value: 200, configurable: true })
      component.handleScroll()
      expect(component.sticky).toBe(true)
    })

    it('should set sticky false when scroll below elementPosition', () => {
      setup()
      component.elementPosition = 500
      Object.defineProperty(window, 'pageYOffset', { value: 10, configurable: true })
      component.handleScroll()
      expect(component.sticky).toBe(false)
    })
  })

  describe('ngOnDestroy', () => {
    it('should unsubscribe defaultSideNavBarOpenedSubscription and bannerSubscription if set', () => {
      setup()
      const unsub1 = jest.fn()
      const unsub2 = jest.fn()
      component['defaultSideNavBarOpenedSubscription'] = { unsubscribe: unsub1 }
      component['bannerSubscription'] = { unsubscribe: unsub2 }
      component.ngOnDestroy()
      expect(unsub1).toHaveBeenCalled()
      expect(unsub2).toHaveBeenCalled()
    })

    it('should not throw when subscriptions are undefined', () => {
      setup()
      component['defaultSideNavBarOpenedSubscription'] = undefined
      component['bannerSubscription'] = undefined
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })
})
