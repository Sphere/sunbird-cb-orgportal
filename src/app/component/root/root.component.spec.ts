import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA, ApplicationRef } from '@angular/core'
import {
  Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError,
} from '@angular/router'
import { SwUpdate } from '@angular/service-worker'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { ConfigurationsService, ValueService, LoggerService } from '@sunbird-cb/utils'
import { BreadcrumbsOrgService } from '@sunbird-cb/collection'
import { BehaviorSubject, Subject, of } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { RootComponent } from './root.component'
import { RootService } from './root.service'
import { MobileAppsService } from '../../services/mobile-apps.service'
import { environment } from '../../../environments/environment'

describe('RootComponent', () => {
  let component: RootComponent
  let fixture: ComponentFixture<RootComponent>
  let routerEvents$: Subject<any>
  let dialog: ReturnType<typeof createSpyObj>
  let swUpdate: ReturnType<typeof createSpyObj>
  let mobileAppsSvc: ReturnType<typeof createSpyObj>
  let rootSvc: RootService
  let btnBackSvc: ReturnType<typeof createSpyObj>

  const build = (swUpdateIsEnabled = false) => {
    routerEvents$ = new Subject<any>()
    dialog = createSpyObj('MatDialog', ['open'])
    swUpdate = createSpyObj('SwUpdate', ['checkForUpdate', 'activateUpdate'])
    swUpdate.isEnabled = swUpdateIsEnabled
    swUpdate.versionUpdates = new Subject<any>()
    mobileAppsSvc = createSpyObj('MobileAppsService', ['init'])
    btnBackSvc = createSpyObj('BreadcrumbsOrgService', ['initialize'])
    rootSvc = new RootService()

    TestBed.configureTestingModule({
      declarations: [RootComponent],
      providers: [
        { provide: MatDialog, useValue: dialog },
        { provide: Router, useValue: { events: routerEvents$.asObservable() } },
        { provide: LoggerService, useValue: createSpyObj('LoggerService', ['log']) },
        { provide: ConfigurationsService, useValue: {} },
        { provide: ValueService, useValue: { isXSmall$: of(false) } },
        { provide: MobileAppsService, useValue: mobileAppsSvc },
        { provide: RootService, useValue: rootSvc },
        { provide: BreadcrumbsOrgService, useValue: btnBackSvc },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(RootComponent, { set: { providers: [{ provide: SwUpdate, useValue: swUpdate }] } })
      .compileComponents()

    fixture = TestBed.createComponent(RootComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  afterEach(() => TestBed.resetTestingModule())

  it('should create and initialize mobile apps + breadcrumb service on init', () => {
    build()
    expect(component).toBeTruthy()
    expect(mobileAppsSvc.init).toHaveBeenCalled()
    expect(btnBackSvc.initialize).toHaveBeenCalled()
  })

  describe('router event handling', () => {
    it('should mark isSetupPage on a /setup/ NavigationEnd', () => {
      build()
      routerEvents$.next(new NavigationEnd(1, '/setup/step1', '/setup/step1'))
      expect(component.isSetupPage).toBe(true)
    })

    it('should hide the nav bar for a preview/embed NavigationStart', () => {
      build()
      routerEvents$.next(new NavigationStart(1, '/preview/x'))
      expect(component.isNavBarRequired).toBe(false)
      expect(component.routeChangeInProgress).toBe(true)
    })

    it('should hide the nav bar for author/ routes while in an iframe', () => {
      build()
      component.isInIframe = true
      routerEvents$.next(new NavigationStart(1, '/author/edit'))
      expect(component.isNavBarRequired).toBe(false)
    })

    it('should show the nav bar for a normal NavigationStart', () => {
      build()
      routerEvents$.next(new NavigationStart(1, '/app/home'))
      expect(component.isNavBarRequired).toBe(true)
    })

    it('should clear routeChangeInProgress and set currentUrl on NavigationEnd', () => {
      build()
      routerEvents$.next(new NavigationEnd(1, '/app/home', '/app/home'))
      expect(component.routeChangeInProgress).toBe(false)
      expect(component.currentUrl).toBe('/app/home')
    })

    it('should clear routeChangeInProgress on NavigationCancel', () => {
      build()
      routerEvents$.next(new NavigationCancel(1, '/x', 'cancelled'))
      expect(component.routeChangeInProgress).toBe(false)
    })

    it('should clear routeChangeInProgress on NavigationError', () => {
      build()
      routerEvents$.next(new NavigationError(1, '/x', new Error('boom')))
      expect(component.routeChangeInProgress).toBe(false)
    })
  })

  it('should update showNavbar from RootService after the debounce delay', fakeAsync(() => {
    build()
    rootSvc.showNavbarDisplay$.next(false)
    tick(500)
    expect(component.showNavbar).toBe(false)
  }))

  describe('initAppUpdateCheck', () => {
    it('should skip the update-check wiring entirely outside production', () => {
      build()
      expect(swUpdate.checkForUpdate).not.toHaveBeenCalled()
    })

    it('should check for updates and skip version-update wiring when SwUpdate is disabled (production)', fakeAsync(() => {
      (environment as any).production = true
      build(false)
      tick()
      expect(swUpdate.versionUpdates.observers.length).toBe(0)
      ;(environment as any).production = false
      discardPeriodicTasks()
    }))

    it('should open the update dialog on a VERSION_READY event and reload after activation (production, enabled)', fakeAsync(() => {
      (environment as any).production = true
      const afterClosed$ = new BehaviorSubject<any>(true)
      const originalCaches = (window as any).caches
      ;(window as any).caches = { keys: jest.fn().mockResolvedValue(['k1']), delete: jest.fn().mockResolvedValue(true) }
      const reloadSpy = jest.fn()
      Object.defineProperty(window, 'location', { value: { reload: reloadSpy }, writable: true })

      build(true)
      dialog.open.mockReturnValue({ afterClosed: () => afterClosed$.asObservable() })
      swUpdate.activateUpdate.mockResolvedValue(undefined)
      swUpdate.versionUpdates.next({ type: 'VERSION_READY' })
      tick(3000)

      expect(dialog.open).toHaveBeenCalled()
      expect(swUpdate.activateUpdate).toHaveBeenCalled()
      ;(window as any).caches = originalCaches
      ;(environment as any).production = false
      discardPeriodicTasks()
    }))

    it('should ignore non VERSION_READY events and skip activation when the dialog is dismissed without confirming', fakeAsync(() => {
      (environment as any).production = true
      build(true)
      dialog.open.mockReturnValue({ afterClosed: () => of(false) })

      swUpdate.versionUpdates.next({ type: 'NO_NEW_VERSION_DETECTED' })
      expect(dialog.open).not.toHaveBeenCalled()

      swUpdate.versionUpdates.next({ type: 'VERSION_READY' })
      tick()
      expect(swUpdate.activateUpdate).not.toHaveBeenCalled()
      ;(environment as any).production = false
      discardPeriodicTasks()
    }))
  })

  it('ngOnDestroy should complete the destroy subject', () => {
    build()
    const completeSpy = jest.spyOn((component as any).destroy$, 'complete')
    component.ngOnDestroy()
    expect(completeSpy).toHaveBeenCalled()
  })
})
