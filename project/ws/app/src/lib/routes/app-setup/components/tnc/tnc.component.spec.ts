import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { of } from 'rxjs'
import { LoggerService, ConfigurationsService } from '@sunbird-cb/utils'
import { TncAppResolverService } from '../../../../../../../../../src/app/services/tnc-app-resolver.service'
import { TncPublicResolverService } from '../../../../../../../../../src/app/services/tnc-public-resolver.service'
import { Globals } from '../../globals'

import { TncComponent } from './tnc.component'

describe('TncComponent', () => {
  let component: TncComponent
  let fixture: ComponentFixture<TncComponent>

  const mockActivatedRoute = {
    data: of({ tnc: { data: null }, isPublic: false }),
    queryParams: of({}),
    params: of({}),
    snapshot: {
      params: {},
      queryParams: {},
      queryParamMap: { has: jest.fn().mockReturnValue(false), get: jest.fn().mockReturnValue(null) },
      data: {},
    },
  }

  const mockRouter = {
    navigate: jest.fn(),
    navigateByUrl: jest.fn(),
    events: of(),
  }

  const mockLoggerService = {
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
  }

  const mockConfigurationsService = {
    pageNavBar: {},
    isNewUser: false,
    hasAcceptedTnc: false,
    userUrl: '',
    userPreference: null,
    appSetup: false,
  }

  const mockTncAppResolverService = {
    getTnc: jest.fn().mockReturnValue(of(null)),
    resolve: jest.fn().mockReturnValue(of({ data: null, error: null })),
  }

  const mockTncPublicResolverService = {
    getPublicTnc: jest.fn().mockReturnValue(of(null)),
    resolve: jest.fn().mockReturnValue(of({ data: null, error: null })),
  }

  const mockGlobals = {
    firstTimeSetupDone: false,
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TncComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: ConfigurationsService, useValue: mockConfigurationsService },
        { provide: TncAppResolverService, useValue: mockTncAppResolverService },
        { provide: TncPublicResolverService, useValue: mockTncPublicResolverService },
        { provide: Globals, useValue: mockGlobals },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(TncComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
