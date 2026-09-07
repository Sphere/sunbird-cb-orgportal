import { of, Subject } from 'rxjs'
import { NavigationEnd } from '@angular/router'
import { EventsHomeComponent } from './events-home.component'

describe('EventsHomeComponent', () => {
  let component: EventsHomeComponent
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

  const setup = (routeData: any = {}, ...userRolesArg: [Set<string> | undefined] | []) => {
    const userRoles = userRolesArg.length ? userRolesArg[0] : new Set<string>()
    routerEvents$ = new Subject()
    valueSvcMock = {
      isLtMedium$: of(false),
    }
    routerMock = {
      events: routerEvents$.asObservable(),
    }
    activeRouteMock = buildActiveRoute({
      pageData: { data: {} },
      ...routeData,
    })
    configServiceMock = {
      userRoles,
    }

    component = new EventsHomeComponent(valueSvcMock, routerMock, activeRouteMock, configServiceMock)
  }

  describe('constructor', () => {
    it('should set myRoles from configService.userRoles', () => {
      setup({}, new Set(['admin']))
      expect(component.myRoles.has('admin')).toBe(true)
    })

    it('should not set myRoles when configService.userRoles is falsy', () => {
      setup({}, undefined)
      expect(component.myRoles).toBeUndefined()
    })

    it('should bind url and set widgetData on NavigationEnd when pageData.data present', () => {
      setup({
        pageData: {
          data: {
            menus: { widgetData: {} },
            deptName: 'DeptX',
          },
        },
      }, new Set(['admin']))
      routerEvents$.next(new NavigationEnd(1, '/app/events/foo', '/app/events/foo'))

      expect(component.currentRoute).toBe('foo')
      expect(component.widgetData).toBeDefined()
      expect((component.widgetData as any).widgetData.name).toBe('DeptX')
      expect((component.widgetData as any).widgetData.logo).toBe(true)
    })

    it('should set widgetData to undefined when pageData.data is falsy', () => {
      setup({
        pageData: {
          data: undefined,
        },
      })
      expect(() => routerEvents$.next(new NavigationEnd(1, '/app/events/bar', '/app/events/bar'))).not.toThrow()
      expect(component.widgetData).toBeUndefined()
    })
  })

  describe('ngOnInit', () => {
    it('should subscribe to isLtMedium$ and set flags', () => {
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
      component.bindUrl('events/path')
      expect(component.currentRoute).toBe('events/path')
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
      component.elementPosition = 50
      Object.defineProperty(window, 'pageYOffset', { value: 150, configurable: true })
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
    it('should unsubscribe both subscriptions when present', () => {
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
