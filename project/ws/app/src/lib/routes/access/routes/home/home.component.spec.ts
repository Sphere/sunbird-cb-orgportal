import { Subject, of } from 'rxjs'
import { NavigationEnd } from '@angular/router'
import { HomeComponent } from './home.component'

describe('HomeComponent', () => {
  let valueSvc: any
  let router: any
  let route: any
  let routerEvents: Subject<any>

  const buildComponent = () => new HomeComponent(valueSvc, router, route)

  beforeEach(() => {
    routerEvents = new Subject<any>()
    valueSvc = { isLtMedium$: of(false) }
    router = { events: routerEvents, url: '/app/roles-access/Admin%20Role/home' }
    route = {
      snapshot: {
        data: {
          configService: { userRoles: new Set(['Admin']) },
          pageData: { data: { menus: { widgetData: {} } } },
        },
      },
    }
  })

  it('should be created', () => {
    const component = buildComponent()
    expect(component).toBeTruthy()
  })

  it('sets myRoles from route snapshot when configService.userRoles present', () => {
    const component = buildComponent()
    expect(component.myRoles).toEqual(new Set(['Admin']))
  })

  it('does not set myRoles when configService.userRoles missing', () => {
    route.snapshot.data.configService = {}
    const component = buildComponent()
    expect(component.myRoles).toBeUndefined()
  })

  describe('router events subscription', () => {
    it('binds url and builds widgetData when fullProfile present with unMappedUser', () => {
      route.snapshot.data.configService = {
        userRoles: new Set(['Admin']),
        unMappedUser: { channel: 'DeptX' },
      }
      const component = buildComponent()
      routerEvents.next(new NavigationEnd(1, '/app/roles-access/some-path', '/app/roles-access/some-path'))
      expect(component.currentRoute).toBe('some-path')
      expect((component.widgetData as any).widgetData.logo).toBe(true)
      expect((component.widgetData as any).widgetData.name).toBe('DeptX')
      expect((component.widgetData as any).widgetData.userRoles).toEqual(component.myRoles)
    })

    it('sets widgetData directly from pageData when fullProfile absent', () => {
      route.snapshot.data.configService = undefined
      const component = buildComponent()
      routerEvents.next(new NavigationEnd(1, '/app/roles-access/other-path', '/app/roles-access/other-path'))
      expect(component.widgetData).toEqual(route.snapshot.data.pageData.data.menus)
    })

    it('ignores non-NavigationEnd events', () => {
      const component = buildComponent()
      const before = component.currentRoute
      routerEvents.next({ someOtherEvent: true })
      expect(component.currentRoute).toBe(before)
    })
  })

  describe('ngOnInit', () => {
    it('subscribes to isLtMedium$ and derives role from url', () => {
      const component = buildComponent()
      component.ngOnInit()
      expect(component.sideNavBarOpened).toBe(true)
      expect(component.screenSizeIsLtMedium).toBe(false)
      expect(component.role).toBe('Admin Role')
    })

    it('sets sideNavBarOpened false when isLtMedium true', () => {
      valueSvc.isLtMedium$ = of(true)
      const component = buildComponent()
      component.ngOnInit()
      expect(component.sideNavBarOpened).toBe(false)
      expect(component.screenSizeIsLtMedium).toBe(true)
    })
  })

  describe('ngOnDestroy', () => {
    it('unsubscribes when subscription exists', () => {
      const component = buildComponent()
      component.ngOnInit()
      const unsubscribeSpy = jest.spyOn(
        (component as any).defaultSideNavBarOpenedSubscription,
        'unsubscribe',
      )
      component.ngOnDestroy()
      expect(unsubscribeSpy).toHaveBeenCalled()
    })

    it('is a no-op when no subscription exists', () => {
      const component = buildComponent()
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })

  describe('bindUrl', () => {
    it('sets currentRoute when path is truthy', () => {
      const component = buildComponent()
      component.bindUrl('some-route')
      expect(component.currentRoute).toBe('some-route')
    })

    it('does not change currentRoute when path is falsy', () => {
      const component = buildComponent()
      const before = component.currentRoute
      component.bindUrl('')
      expect(component.currentRoute).toBe(before)
    })
  })
})
