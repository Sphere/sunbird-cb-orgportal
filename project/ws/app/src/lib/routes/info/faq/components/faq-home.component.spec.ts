import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { ConfigurationsService, EFeatures, ValueService } from '@sunbird-cb/utils'
import { Subject } from 'rxjs'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { FaqHomeComponent } from './faq-home.component'

describe('FaqHomeComponent', () => {
  let component: FaqHomeComponent
  let fixture: ComponentFixture<FaqHomeComponent>
  let routeData$: Subject<any>
  let queryParamMap$: Subject<any>
  let isLtMedium$: Subject<boolean>
  let configSvc: any

  const faqConfigs = [
    { groupKey: 'general', contents: [{ q: 'q1' }] },
    { groupKey: 'billing', contents: [{ q: 'q2' }] },
  ]

  const build = (restrictedFeatures: Set<string> = new Set()) => {
    routeData$ = new Subject<any>()
    queryParamMap$ = new Subject<any>()
    isLtMedium$ = new Subject<boolean>()
    configSvc = { pageNavBar: {}, restrictedFeatures }

    TestBed.configureTestingModule({
      declarations: [FaqHomeComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: ConfigurationsService, useValue: configSvc },
        { provide: ValueService, useValue: { isLtMedium$: isLtMedium$.asObservable() } },
        {
          provide: ActivatedRoute,
          useValue: { data: routeData$.asObservable(), queryParamMap: queryParamMap$.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(FaqHomeComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  afterEach(() => TestBed.resetTestingModule())

  it('should create', () => {
    build()
    expect(component).toBeTruthy()
  })

  it('should seed the first tab from route data', () => {
    build()
    routeData$.next({ pageData: { data: faqConfigs } })
    expect(component.selectedTabData).toEqual([{ q: 'q1' }])
    expect(component.selectedTabIndex).toBe(0)
  })

  it('should select the tab matching the query param', () => {
    build()
    routeData$.next({ pageData: { data: faqConfigs } })
    queryParamMap$.next({ get: () => 'billing' })
    expect(component.selectedTabIndex).toBe(1)
    expect(component.selectedTabData).toEqual([{ q: 'q2' }])
  })

  it('should leave the tab unchanged when the query param matches no group', () => {
    build()
    routeData$.next({ pageData: { data: faqConfigs } })
    queryParamMap$.next({ get: () => 'nomatch' })
    expect(component.selectedTabIndex).toBe(0)
  })

  it('should skip query-param tab selection when faqConfigs is not yet loaded', () => {
    build()
    expect(() => queryParamMap$.next({ get: () => 'billing' })).not.toThrow()
  })

  it('should mark FAQ as restricted when configured', () => {
    build(new Set([EFeatures.FAQ]))
    expect(component.isFaqFeature).toBe(false)
  })

  it('should keep FAQ enabled when not restricted', () => {
    build(new Set())
    expect(component.isFaqFeature).toBe(true)
  })

  it('should sync sideNavBarOpened/screenSizeIsLtMedium with isLtMedium$', () => {
    build()
    isLtMedium$.next(true)
    expect(component.sideNavBarOpened).toBe(false)
    expect(component.screenSizeIsLtMedium).toBe(true)
  })

  describe('sideNavOnClick', () => {
    it('should select the tab at the given index', () => {
      build()
      routeData$.next({ pageData: { data: faqConfigs } })
      component.sideNavOnClick(1)
      expect(component.selectedTabIndex).toBe(1)
      expect(component.selectedTabData).toEqual([{ q: 'q2' }])
    })

    it('should toggle the side nav closed on small screens', () => {
      build()
      isLtMedium$.next(true)
      component.sideNavBarOpened = true
      component.sideNavOnClick(0)
      expect(component.sideNavBarOpened).toBe(false)
    })

    it('should not toggle the side nav on large screens', () => {
      build()
      isLtMedium$.next(false)
      component.sideNavBarOpened = true
      component.sideNavOnClick(0)
      expect(component.sideNavBarOpened).toBe(true)
    })

    it('should do nothing when faqConfigs is not loaded', () => {
      build()
      expect(() => component.sideNavOnClick(0)).not.toThrow()
    })
  })

  it('ngOnDestroy should unsubscribe all active subscriptions', () => {
    build()
    routeData$.next({ pageData: { data: faqConfigs } })
    queryParamMap$.next({ get: () => null })
    const faqUnsub = jest.spyOn((component as any).subscriptionFAQ, 'unsubscribe')
    const navUnsub = jest.spyOn((component as any).defaultSideNavBarOpenedSubscription, 'unsubscribe')
    const activeUnsub = jest.spyOn((component as any).subscriptionActiveFAQ, 'unsubscribe')
    component.ngOnDestroy()
    expect(faqUnsub).toHaveBeenCalled()
    expect(navUnsub).toHaveBeenCalled()
    expect(activeUnsub).toHaveBeenCalled()
  })

  it('ngOnDestroy should not throw when subscriptions are missing', () => {
    build()
    ;(component as any).subscriptionFAQ = null
    ;(component as any).defaultSideNavBarOpenedSubscription = null
    ;(component as any).subscriptionActiveFAQ = null
    expect(() => component.ngOnDestroy()).not.toThrow()
  })
})
