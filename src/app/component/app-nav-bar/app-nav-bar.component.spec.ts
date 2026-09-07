import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatMenuModule } from '@angular/material/menu'
import { Router, NavigationStart, NavigationEnd } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { CustomTourService } from '@sunbird-cb/collection'
import { Subject, of } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { AppNavBarComponent } from './app-nav-bar.component'
import { SanitizerService } from 'src/app/services/sanitizer.service'

describe('AppNavBarComponent', () => {
  let component: AppNavBarComponent
  let fixture: ComponentFixture<AppNavBarComponent>
  let configSvc: any
  let tourService: any
  let sanitizerService: any
  let routerEvents$: Subject<any>
  let router: any

  const build = (configOverrides: any = {}) => {
    routerEvents$ = new Subject<any>()
    configSvc = {
      restrictedFeatures: new Set<string>(),
      unMappedUser: { roles: [] },
      tourGuideNotifier: new Subject<boolean>(),
      prefChangeNotifier: { next: jest.fn() },
      ...configOverrides,
    }
    tourService = createSpyObj('CustomTourService', [
      'createPopupTour', 'startTour', 'startPopupTour', 'cancelPopupTour',
    ])
    tourService.isTourComplete = of(false)
    sanitizerService = createSpyObj('SanitizerService', ['trustResourceUrl'])
    sanitizerService.trustResourceUrl.mockImplementation((u: string) => u)
    router = { events: routerEvents$.asObservable(), navigate: jest.fn() }

    TestBed.configureTestingModule({
      imports: [MatMenuModule],
      declarations: [AppNavBarComponent],
      providers: [
        { provide: ConfigurationsService, useValue: configSvc },
        { provide: CustomTourService, useValue: tourService },
        { provide: SanitizerService, useValue: sanitizerService },
        { provide: Router, useValue: router },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(AppNavBarComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  afterEach(() => TestBed.resetTestingModule())

  it('should create', () => {
    build()
    expect(component).toBeTruthy()
  })

  it('should mark the help menu restricted when configured', () => {
    build({ restrictedFeatures: new Set(['helpNavBarMenu']) })
    expect(component.isHelpMenuRestricted).toBe(true)
  })

  it('should cancel the tour on NavigationStart and NavigationEnd', () => {
    build()
    const cancelSpy = jest.spyOn(component, 'cancelTour')
    routerEvents$.next(new NavigationStart(1, '/x'))
    expect(cancelSpy).toHaveBeenCalledTimes(1)
    routerEvents$.next(new NavigationEnd(1, '/x', '/x'))
    expect(cancelSpy).toHaveBeenCalledTimes(2)
  })

  describe('ngOnInit', () => {
    it('should set isDashboardReport from the MDO_DASHBOARD_VIEWER role', () => {
      build({ unMappedUser: { roles: ['MDO_DASHBOARD_VIEWER'] } })
      expect(component.isDashboardReport).toBe(true)
    })

    it('should hide the nav bar on /app/setup when instanceConfig disables it there', () => {
      build({ instanceConfig: { showNavBarInSetup: false, logos: {} } })
      routerEvents$.next(new NavigationEnd(1, '/app/setup', '/app/setup'))
      expect(component.showAppNavBar).toBe(false)
    })

    it('should show the nav bar on other routes', () => {
      build({ instanceConfig: { showNavBarInSetup: false, logos: {} } })
      routerEvents$.next(new NavigationEnd(1, '/app/home', '/app/home'))
      expect(component.showAppNavBar).toBe(true)
    })

    it('should populate nav-bar visuals and config when instanceConfig is present', () => {
      build({
        instanceConfig: { logos: { appBottomNav: 'icon.svg' } },
        rootOrg: 'igot',
        primaryNavBar: { color: 'blue' },
        pageNavBar: { color: 'red' },
        primaryNavBarConfig: { mediumScreen: { right: [] } },
      })
      expect(component.instanceVal).toBe('igot')
      expect(component.appBottomIcon).toBe('icon.svg')
      expect(component.primaryNavbarBackground).toEqual({ color: 'blue' })
    })

    it('should filter mediumScreen.right feature buttons by role and always hide notifications', () => {
      build({
        instanceConfig: { logos: {} },
        unMappedUser: { roles: ['MDO_ADMIN', 'MDO_DASHBOARD_VIEWER'] },
        primaryNavBarConfig: {
          mediumScreen: {
            right: [
              { type: 'featureButton', config: { actionBtnId: 'feature_home' } },
              { type: 'featureButton', config: { actionBtnId: 'feature_mydashboard' } },
              { type: 'featureButton', config: { actionBtnId: 'feature_notification' } },
              { type: 'featureButton', config: { actionBtnId: 'feature_other' } },
              { type: 'widgetButton', config: {} },
            ],
          },
        },
      })
      const ids = component.primaryNavbarConfig.mediumScreen.right.map((i: any) => i.config?.actionBtnId)
      expect(ids).toEqual(['feature_home', 'feature_mydashboard', 'feature_other', undefined])
    })

    it('should drop feature_home/feature_mydashboard when the role is missing', () => {
      build({
        instanceConfig: { logos: {} },
        unMappedUser: { roles: [] },
        primaryNavBarConfig: {
          mediumScreen: {
            right: [
              { type: 'featureButton', config: { actionBtnId: 'feature_home' } },
              { type: 'featureButton', config: { actionBtnId: 'feature_mydashboard' } },
            ],
          },
        },
      })
      expect(component.primaryNavbarConfig.mediumScreen.right).toEqual([])
    })

    it('should populate featureApps from appsConfig', () => {
      build({ appsConfig: { features: { f1: {}, f2: {} } } })
      expect(component.featureApps).toEqual(['f1', 'f2'])
    })

    it('should show the tour guide and create the popup tour when not restricted', () => {
      build()
      tourService.createPopupTour.mockReturnValue({ id: 'tour' })
      configSvc.tourGuideNotifier.next(true)
      expect(component.isTourGuideAvailable).toBe(true)
      expect(component.popupTour).toEqual({ id: 'tour' })
    })

    it('should not show the tour guide when restricted', () => {
      build({ restrictedFeatures: new Set(['tourGuide']) })
      configSvc.tourGuideNotifier.next(true)
      expect(component.isTourGuideAvailable).toBe(false)
    })
  })

  describe('getFeatureUrl / getFeatureIcon', () => {
    it('should return configured url/icon when present', () => {
      build({ appsConfig: { features: { f1: { url: '/f1', icon: 'star' } } } })
      expect(component.getFeatureUrl('f1')).toBe('/f1')
      expect(component.getFeatureIcon('f1')).toBe('star')
    })

    it('should default url to / and icon to home when missing', () => {
      build({ appsConfig: { features: {} } })
      expect(component.getFeatureUrl('missing')).toBe('/')
      expect(component.getFeatureIcon('missing')).toBe('home')
    })
  })

  describe('getUserInitials', () => {
    it('should build initials from first/last name', () => {
      build({ userProfile: { firstName: 'john', lastName: 'doe' } })
      expect(component.getUserInitials()).toBe('JD')
    })

    it('should default to GU when the profile is missing', () => {
      build({ userProfile: undefined })
      expect(component.getUserInitials()).toBe('GU')
    })
  })

  it('logout should navigate the browser to the public logout page', () => {
    build()
    const originalLocation = window.location
    delete (window as any).location
    ;(window as any).location = { href: '' }
    component.logout()
    expect(window.location.href).toBe('/public/logout')
    ;(window as any).location = originalLocation
  })

  describe('ngOnChanges', () => {
    it('should add showTitle when mode changes to bottom', () => {
      build()
      component.mode = 'bottom'
      component.ngOnChanges({ mode: {} as any })
      expect((component.btnAppsConfig.widgetData as any).showTitle).toBe(true)
    })

    it('should reset to the basic config when mode changes to top', () => {
      build()
      component.mode = 'top'
      component.ngOnChanges({ mode: {} as any })
      expect((component.btnAppsConfig.widgetData as any).showTitle).toBeUndefined()
    })

    it('should ignore unrelated changed properties', () => {
      build()
      const before = component.btnAppsConfig
      component.ngOnChanges({ other: {} as any })
      expect(component.btnAppsConfig).toBe(before)
    })
  })

  describe('startTour', () => {
    it('should complete the tour, mark it done, and cancel the popup after a delay', () => {
      jest.useFakeTimers()
      build()
      tourService.isTourComplete = of(true)
      component.startTour()
      expect(tourService.startTour).toHaveBeenCalled()
      expect(tourService.startPopupTour).toHaveBeenCalled()
      expect(configSvc.completedTour).toBe(true)
      expect(configSvc.prefChangeNotifier.next).toHaveBeenCalledWith({ completedTour: true })
      jest.advanceTimersByTime(3000)
      expect(tourService.cancelPopupTour).toHaveBeenCalled()
      jest.useRealTimers()
    })

    it('should do nothing further when the tour is not yet complete', () => {
      build()
      tourService.isTourComplete = of(false)
      component.startTour()
      expect(tourService.startPopupTour).not.toHaveBeenCalled()
    })
  })

  describe('cancelTour', () => {
    it('should cancel the popup tour when one is active', () => {
      build()
      component.popupTour = { id: 't1' }
      component.cancelTour()
      expect(tourService.cancelPopupTour).toHaveBeenCalled()
    })

    it('should do nothing when there is no active popup tour', () => {
      build()
      component.popupTour = null
      component.cancelTour()
      expect(tourService.cancelPopupTour).not.toHaveBeenCalled()
    })
  })

  it('ngOnDestroy should complete the destroy subject', () => {
    build()
    const completeSpy = jest.spyOn((component as any).destroy$, 'complete')
    component.ngOnDestroy()
    expect(completeSpy).toHaveBeenCalled()
  })
})
