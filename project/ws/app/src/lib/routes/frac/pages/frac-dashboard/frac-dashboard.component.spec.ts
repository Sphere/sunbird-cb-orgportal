import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { Router } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { FracDashboardComponent } from './frac-dashboard.component'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('FracDashboardComponent', () => {
  let component: FracDashboardComponent
  let fixture: ComponentFixture<FracDashboardComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FracDashboardComponent],
      providers: [
        { provide: Router, useValue: createSpyObj('Router', ['navigateByUrl']) },
        { provide: ConfigurationsService, useValue: { instanceConfig: {} } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(FracDashboardComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('onBtnClick navigates when redirectLink is provided', () => {
    const router = TestBed.inject(Router)
    component.onBtnClick('/app/frac/some-route')
    expect(router.navigateByUrl).toHaveBeenCalledWith('/app/frac/some-route')
  })

  it('onBtnClick does nothing when redirectLink is undefined', () => {
    const router = TestBed.inject(Router)
    component.onBtnClick(undefined)
    expect(router.navigateByUrl).not.toHaveBeenCalled()
  })

  it('onBtnClick does nothing when redirectLink is an empty string', () => {
    const router = TestBed.inject(Router)
    component.onBtnClick('')
    expect(router.navigateByUrl).not.toHaveBeenCalled()
  })

  it('getIconUrl returns default icon URL for known icon when no override configured', () => {
    expect(component.getIconUrl('upload')).toBe('https://aastar-assets.s3.ap-south-1.amazonaws.com/mdo-frac/icons/frac_upload_icon.svg')
  })

  it('getIconUrl returns empty string for an unknown icon name', () => {
    expect(component.getIconUrl('unknown-icon')).toBe('')
  })

  it('includes the Map Roles to Positions card by default (feature flag not false)', () => {
    const titles = component.actionCards.map(card => card.title)
    expect(titles).toContain('Map Roles to Positions')
  })
})

describe('FracDashboardComponent with dashboardIconUrls override', () => {
  let component: FracDashboardComponent

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FracDashboardComponent],
      providers: [
        { provide: Router, useValue: { navigateByUrl: jest.fn() } },
        {
          provide: ConfigurationsService,
          useValue: {
            instanceConfig: {
              frac: {
                dashboardIconUrls: { upload: 'https://custom.example.com/upload.svg' },
                routes: { competencyUpload: '/custom/upload' },
              },
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    const fixture = TestBed.createComponent(FracDashboardComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('getIconUrl prefers the configured override over the default URL', () => {
    expect(component.getIconUrl('upload')).toBe('https://custom.example.com/upload.svg')
  })

  it('uses the overridden route for a redirect link when configured', () => {
    const uploadCard = component.actionCards.find(card => card.title === 'Upload Competency')
    expect(uploadCard?.actions[0].redirectLink).toBe('/custom/upload')
  })
})

describe('FracDashboardComponent with enableRolePositionMapping disabled', () => {
  let component: FracDashboardComponent

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FracDashboardComponent],
      providers: [
        { provide: Router, useValue: { navigateByUrl: jest.fn() } },
        {
          provide: ConfigurationsService,
          useValue: {
            instanceConfig: {
              frac: {
                featureFlags: { enableRolePositionMapping: false },
              },
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    const fixture = TestBed.createComponent(FracDashboardComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('excludes the Map Roles to Positions card when the feature flag is disabled', () => {
    const titles = component.actionCards.map(card => card.title)
    expect(titles).not.toContain('Map Roles to Positions')
  })
})

describe('FracDashboardComponent with empty-string route overrides', () => {
  let component: FracDashboardComponent

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FracDashboardComponent],
      providers: [
        { provide: Router, useValue: { navigateByUrl: jest.fn() } },
        {
          provide: ConfigurationsService,
          useValue: {
            instanceConfig: {
              frac: {
                routes: {
                  competencyUpload: '',
                  competencyManage: '',
                  activityUpload: '',
                  activityManage: '',
                  roleUpload: '',
                  roleManage: '',
                  mapActivity: '',
                  mapRole: '',
                  mapRolePosition: '',
                },
              },
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    const fixture = TestBed.createComponent(FracDashboardComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('falls back to the default FRAC_ROUTES for every action card when overrides are falsy', () => {
    const uploadCard = component.actionCards.find(card => card.title === 'Upload Competency')
    expect(uploadCard?.actions[0].redirectLink).toBe('/app/frac/competency?mode=upload')
    expect(uploadCard?.actions[1].redirectLink).toBe('/app/frac/competency?mode=manage')

    const activityCard = component.actionCards.find(card => card.title === 'Upload Activities')
    expect(activityCard?.actions[0].redirectLink).toBe('/app/frac/activity?mode=upload')
    expect(activityCard?.actions[1].redirectLink).toBe('/app/frac/activity?mode=manage')

    const roleCard = component.actionCards.find(card => card.title === 'Upload Roles')
    expect(roleCard?.actions[0].redirectLink).toBe('/app/frac/role?mode=upload')
    expect(roleCard?.actions[1].redirectLink).toBe('/app/frac/role?mode=manage')

    const mapActivityCard = component.actionCards.find(card => card.title === 'Map Activities to Competencies')
    expect(mapActivityCard?.actions[0].redirectLink).toBe('/app/frac/map-activity')

    const mapRoleCard = component.actionCards.find(card => card.title === 'Map Roles to Activities')
    expect(mapRoleCard?.actions[0].redirectLink).toBe('/app/frac/map-role')

    const mapRolePositionCard = component.actionCards.find(card => card.title === 'Map Roles to Positions')
    expect(mapRolePositionCard?.actions[0].redirectLink).toBe('/app/frac/map-role-position')
  })
})
