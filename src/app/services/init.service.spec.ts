import { TestBed } from '@angular/core/testing'
import { APP_BASE_HREF } from '@angular/common'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { MatIconRegistry } from '@angular/material/icon'
import { DomSanitizer } from '@angular/platform-browser'
import { BtnSettingsService } from '@sunbird-cb/collection'
import { WidgetResolverService } from '@sunbird-cb/resolver'
import {
  AuthKeycloakService,
  ConfigurationsService,
  LoggerService,
  UserPreferenceService,
} from '@sunbird-cb/utils'

import { InitService } from './init.service'

describe('InitService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InitService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_BASE_HREF, useValue: '/' },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: ConfigurationsService,
          useValue: {
            isProduction: false,
            instanceConfig: null,
            rootOrg: '',
            org: [],
            activeOrg: '',
            appSetup: false,
            restrictedFeatures: null,
            restrictedWidgets: null,
            userRoles: new Set(),
            userGroups: new Set(),
            userProfile: null,
            userProfileV2: null,
            unMappedUser: null,
            hasAcceptedTnc: false,
            profileDetailsStatus: false,
            isActive: true,
            sitePath: '',
            primaryNavBar: null,
            pageNavBar: null,
            primaryNavBarConfig: null,
            pinnedApps: { next: jest.fn() },
            profileSettings: null,
            userPreference: null,
            appsConfig: null,
          },
        },
        {
          provide: AuthKeycloakService,
          useValue: {
            logout: jest.fn(),
            initAuth: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: WidgetResolverService,
          useValue: {
            initialize: jest.fn(),
          },
        },
        {
          provide: BtnSettingsService,
          useValue: {
            initializePrefChanges: jest.fn(),
          },
        },
        {
          provide: UserPreferenceService,
          useValue: {
            fetchUserPreference: jest.fn().mockResolvedValue({}),
            initialize: jest.fn(),
          },
        },
        {
          provide: MatIconRegistry,
          useValue: {
            addSvgIcon: jest.fn(),
          },
        },
        {
          provide: DomSanitizer,
          useValue: {
            bypassSecurityTrustResourceUrl: jest.fn().mockReturnValue(''),
          },
        },
      ],
    })
  })

  it('should be created', () => {
    const service: InitService = TestBed.inject(InitService)
    expect(service).toBeTruthy()
  })
})
