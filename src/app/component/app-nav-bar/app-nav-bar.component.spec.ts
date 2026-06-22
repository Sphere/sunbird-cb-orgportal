import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { Router } from '@angular/router'
import { Subject, EMPTY } from 'rxjs'
import { MatMenuModule } from '@angular/material/menu'

import { AppNavBarComponent } from './app-nav-bar.component'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { CustomTourService } from '@sunbird-cb/collection'

describe('AppNavBarComponent', () => {
  let component: AppNavBarComponent
  let fixture: ComponentFixture<AppNavBarComponent>

  const tourGuideNotifier = new Subject<boolean>()
  const prefChangeNotifier = new Subject<any>()

  const mockRouter = {
    events: EMPTY,
    navigate: jest.fn(),
  }

  const mockConfigSvc = {
    restrictedFeatures: new Set<string>(),
    userProfile: { firstName: 'Sumit', lastName: 'Bajaj' } as any,
    unMappedUser: { roles: ['MDO_ADMIN', 'MDO_DASHBOARD_VIEWER'] } as any,
    instanceConfig: null as any, // null skips DomSanitizer logo path in ngOnInit
    appsConfig: {
      features: {
        feature_home: { url: '/app/home/welcome', icon: 'home' },
        feature_mydashboard: { url: '/app/my-dashboard', icon: 'bar_chart' },
      },
    } as any,
    primaryNavBar: null,
    pageNavBar: null,
    primaryNavBarConfig: null,
    rootOrg: 'TestOrg',
    tourGuideNotifier: tourGuideNotifier.asObservable(),
    prefChangeNotifier,
    completedTour: false,
  }

  const mockTourSvc = {
    isTourComplete: new Subject<boolean>().asObservable(),
    createPopupTour: jest.fn(),
    startTour: jest.fn(),
    cancelPopupTour: jest.fn(),
    startPopupTour: jest.fn(),
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MatMenuModule],
      declarations: [AppNavBarComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ConfigurationsService, useValue: mockConfigSvc },
        { provide: CustomTourService, useValue: mockTourSvc },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AppNavBarComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('getUserInitials()', () => {
    it('returns uppercase initials from firstName and lastName', () => {
      expect(component.getUserInitials()).toBe('SB')
    })

    it('falls back to GU when userProfile is null', () => {
      const orig = mockConfigSvc.userProfile
      mockConfigSvc.userProfile = null as any
      expect(component.getUserInitials()).toBe('GU')
      mockConfigSvc.userProfile = orig
    })
  })

  describe('getFeatureUrl()', () => {
    it('returns the configured url for a known feature', () => {
      expect(component.getFeatureUrl('feature_home')).toBe('/app/home/welcome')
    })

    it('returns / for an unknown feature', () => {
      expect(component.getFeatureUrl('feature_unknown')).toBe('/')
    })
  })

  describe('getFeatureIcon()', () => {
    it('returns the configured icon for a known feature', () => {
      expect(component.getFeatureIcon('feature_mydashboard')).toBe('bar_chart')
    })

    it('returns home as fallback for an unknown feature', () => {
      expect(component.getFeatureIcon('feature_unknown')).toBe('home')
    })
  })

  describe('role-based visibility', () => {
    it('sets isDashboardReport true when MDO_DASHBOARD_VIEWER role is present', () => {
      expect(component.isDashboardReport).toBe(true)
    })

    it('sets isDashboardReport false when MDO_DASHBOARD_VIEWER role is absent', () => {
      mockConfigSvc.unMappedUser = { roles: ['MDO_ADMIN'] } as any
      const localFixture = TestBed.createComponent(AppNavBarComponent)
      localFixture.detectChanges()
      expect(localFixture.componentInstance.isDashboardReport).toBe(false)
      mockConfigSvc.unMappedUser = { roles: ['MDO_ADMIN', 'MDO_DASHBOARD_VIEWER'] } as any
    })
  })
})
