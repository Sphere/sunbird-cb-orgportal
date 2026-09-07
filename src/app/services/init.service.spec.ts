import { TestBed } from '@angular/core/testing'
import { APP_BASE_HREF } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { MatIconRegistry } from '@angular/material/icon'
import { WidgetResolverService } from '@sunbird-cb/resolver'
import { of, throwError } from 'rxjs'

import { InitService } from './init.service'
import { environment } from '../../environments/environment'

describe('InitService', () => {
  let httpGetMock: jest.Mock
  let logoutMock: jest.Mock
  let initializePrefChangesMock: jest.Mock
  let fetchUserPreferenceMock: jest.Mock
  let userPreferenceInitializeMock: jest.Mock
  let configSvc: any
  let widgetResolverInitializeMock: jest.Mock

  const buildInstanceConfig = (overrides: any = {}) => ({
    rootOrg: 'root-org',
    org: ['org1'],
    appSetup: true,
    locals: [],
    backgrounds: {},
    details: { appName: 'Test App' },
    indexHtmlMeta: {},
    featuredApps: [],
    ...overrides,
  })

  beforeEach(() => {
    httpGetMock = jest.fn()
    logoutMock = jest.fn().mockResolvedValue(undefined)
    initializePrefChangesMock = jest.fn()
    fetchUserPreferenceMock = jest.fn().mockResolvedValue({})
    userPreferenceInitializeMock = jest.fn()
    widgetResolverInitializeMock = jest.fn()

    configSvc = {
      isProduction: false,
      instanceConfig: null,
      userPreference: null,
      pinnedApps: { next: jest.fn() },
      restrictedFeatures: null,
      restrictedWidgets: null,
      userRoles: null,
      userGroups: null,
      sitePath: 'site-path',
      appsConfig: null,
      profileSettings: null,
      hasAcceptedTnc: false,
      profileDetailsStatus: false,
      isActive: false,
      unMappedUser: null,
      userProfile: null,
      userProfileV2: null,
      rootOrg: null,
      org: null,
      activeOrg: null,
      appSetup: null,
      primaryNavBar: null,
      pageNavBar: null,
      primaryNavBarConfig: null,
    }

    TestBed.configureTestingModule({
      providers: [
        InitService,
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: HttpClient, useValue: { get: httpGetMock } },
        {
          provide: 'ConfigurationsService', useValue: configSvc,
        },
        { provide: WidgetResolverService, useValue: { initialize: widgetResolverInitializeMock } },
        { provide: MatIconRegistry, useValue: { addSvgIcon: jest.fn() } },
      ],
    })
  })

  function createService(): InitService {
    // Manually construct the service using TestBed injector overrides via `new`
    // to have full control over each dependency (ConfigurationsService is a class
    // token, so we override with `useValue` isn't picked up via string token above;
    // instead we directly instantiate.)
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
    const authSvc = { logout: logoutMock }
    const widgetResolverService = { initialize: widgetResolverInitializeMock }
    const settingsSvc = { initializePrefChanges: initializePrefChangesMock }
    const userPreference = {
      fetchUserPreference: fetchUserPreferenceMock,
      initialize: userPreferenceInitializeMock,
    }
    const http = { get: httpGetMock }
    const sanitizerSvc = { trustResourceUrl: jest.fn((url: string) => url) }
    const iconRegistry = { addSvgIcon: jest.fn() }

    const service = new (InitService as any)(
      logger,
      configSvc,
      authSvc,
      widgetResolverService,
      settingsSvc,
      userPreference,
      http,
      '/',
      sanitizerSvc,
      iconRegistry,
    )
    return service as InitService
  }

  it('should be created', () => {
    const service = createService()
    expect(service).toBeTruthy()
  })

  describe('locale', () => {
    it('returns "en" when baseHref is "/"', () => {
      const service = createService()
      expect(service.locale).toBe('en')
    })

    it('returns the stripped baseHref when set', () => {
      const service: any = new (InitService as any)(
        { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
        configSvc,
        { logout: logoutMock },
        { initialize: widgetResolverInitializeMock },
        { initializePrefChanges: initializePrefChangesMock },
        { fetchUserPreference: fetchUserPreferenceMock, initialize: userPreferenceInitializeMock },
        { get: httpGetMock },
        '/fr/',
        { trustResourceUrl: jest.fn((u: string) => u) },
        { addSvgIcon: jest.fn() },
      )
      expect(service.locale).toBe('fr')
    })
  })

  describe('hasRole', () => {
    it('returns true when a role matches a portal role', () => {
      const service = createService()
      const matchingRole = environment.portalRoles[0]
      expect(service.hasRole([matchingRole])).toBe(true)
    })

    it('returns false when no roles match', () => {
      const service = createService()
      expect(service.hasRole(['SOME_UNKNOWN_ROLE_XYZ'])).toBe(false)
    })

    it('returns false for an empty roles array', () => {
      const service = createService()
      expect(service.hasRole([])).toBe(false)
    })
  })

  describe('updateNavConfig (private, via any cast)', () => {
    it('does nothing when instanceConfig is null', () => {
      const service: any = createService()
      configSvc.instanceConfig = null
      service.updateNavConfig()
      expect(configSvc.primaryNavBar).toBeNull()
    })

    it('updates primaryNavBar and pageNavBar from backgrounds', () => {
      const service: any = createService()
      configSvc.instanceConfig = buildInstanceConfig({
        backgrounds: { primaryNavBar: { color: 'red' }, pageNavBar: { color: 'blue' } },
        primaryNavBarConfig: { foo: 'bar' },
      })
      service.updateNavConfig()
      expect(configSvc.primaryNavBar).toEqual({ color: 'red' })
      expect(configSvc.pageNavBar).toEqual({ color: 'blue' })
      expect(configSvc.primaryNavBarConfig).toEqual({ foo: 'bar' })
    })

    it('does not set primaryNavBarConfig when absent', () => {
      const service: any = createService()
      configSvc.instanceConfig = buildInstanceConfig({ backgrounds: {} })
      service.updateNavConfig()
      expect(configSvc.primaryNavBarConfig).toBeNull()
    })
  })

  describe('updateAppIndexMeta (private, via any cast)', () => {
    afterEach(() => {
      document.title = ''
      document.body.innerHTML = ''
    })

    it('does nothing when instanceConfig is null', () => {
      const service: any = createService()
      configSvc.instanceConfig = null
      service.updateAppIndexMeta()
      expect(document.title).toBe('')
    })

    it('sets document title from instanceConfig', () => {
      const service: any = createService()
      configSvc.instanceConfig = buildInstanceConfig({ details: { appName: 'My App' } })
      service.updateAppIndexMeta()
      expect(document.title).toBe('My App')
    })

    it('updates description meta, webmanifest link, png icon and x icon when elements exist', () => {
      const service: any = createService()
      const descElem = document.createElement('meta')
      descElem.id = 'id-app-description'
      document.body.appendChild(descElem)

      const manifestElem = document.createElement('link')
      manifestElem.id = 'id-app-webmanifest'
      document.body.appendChild(manifestElem)

      const pngIconElem = document.createElement('link')
      pngIconElem.id = 'id-app-fav-icon'
      document.body.appendChild(pngIconElem)

      const xIconElem = document.createElement('link')
      xIconElem.id = 'id-app-x-icon'
      document.body.appendChild(xIconElem)

      configSvc.instanceConfig = buildInstanceConfig({
        indexHtmlMeta: {
          description: 'A description',
          webmanifest: 'manifest.json',
          pngIcon: 'icon.png',
          xIcon: 'icon.ico',
        },
      })
      service.updateAppIndexMeta()

      expect(descElem.getAttribute('content')).toBe('A description')
      expect(manifestElem.getAttribute('href')).toBe('manifest.json')
      expect(pngIconElem.href).toContain('icon.png')
      expect(xIconElem.href).toContain('icon.ico')
    })

    it('does not throw when target elements are missing', () => {
      const service: any = createService()
      configSvc.instanceConfig = buildInstanceConfig({
        indexHtmlMeta: {
          description: 'A description',
          webmanifest: 'manifest.json',
          pngIcon: 'icon.png',
          xIcon: 'icon.ico',
        },
      })
      expect(() => service.updateAppIndexMeta()).not.toThrow()
    })

    it('logs an error when an exception occurs while updating meta', () => {
      const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
      const service: any = new (InitService as any)(
        logger,
        configSvc,
        { logout: logoutMock },
        { initialize: widgetResolverInitializeMock },
        { initializePrefChanges: initializePrefChangesMock },
        { fetchUserPreference: fetchUserPreferenceMock, initialize: userPreferenceInitializeMock },
        { get: httpGetMock },
        '/',
        { trustResourceUrl: jest.fn((u: string) => u) },
        { addSvgIcon: jest.fn() },
      )
      configSvc.instanceConfig = {
        details: { appName: 'My App' },
        get indexHtmlMeta(): any {
          throw new Error('boom')
        },
      }
      service.updateAppIndexMeta()
      expect(logger.error).toHaveBeenCalledWith('Error updating index html meta >', expect.any(Error))
    })
  })

  describe('reloadAccordingToLocale (private, via any cast)', () => {
    it('returns early on localhost origin', () => {
      const service: any = createService()
      // jsdom default origin is http://localhost
      expect(window.location.origin.indexOf('http://localhost')).toBeGreaterThanOrEqual(0)
      expect(() => service.reloadAccordingToLocale()).not.toThrow()
      // no instanceConfig access should occur; nothing to assert further but should not throw
    })
  })

  describe('fetchDefaultConfig (private, via any cast)', () => {
    it('fetches host config and stores it on configSvc', async () => {
      const service: any = createService()
      const publicConfig = buildInstanceConfig({ rootOrg: 'ro', org: ['o1', 'o2'], appSetup: false })
      httpGetMock.mockReturnValue(of(publicConfig))

      const result = await service.fetchDefaultConfig()

      expect(httpGetMock).toHaveBeenCalledWith('assets/configurations/host.config.json')
      expect(result).toBe(publicConfig)
      expect(configSvc.instanceConfig).toBe(publicConfig)
      expect(configSvc.rootOrg).toBe('ro')
      expect(configSvc.org).toEqual(['o1', 'o2'])
      expect(configSvc.activeOrg).toBe('o1')
      expect(configSvc.appSetup).toBe(false)
    })
  })

  describe('fetchAppsConfig (private, via any cast)', () => {
    it('fetches apps config', async () => {
      const service: any = createService()
      const appsConfig = { features: {}, groups: [], tourGuide: {} }
      httpGetMock.mockReturnValue(of(appsConfig))

      const result = await service.fetchAppsConfig()

      expect(httpGetMock).toHaveBeenCalledWith('assets/configurations/feature/apps.json')
      expect(result).toBe(appsConfig)
    })
  })

  describe('fetchInstanceConfig (private, via any cast)', () => {
    it('fetches site config, stores it, and updates app index meta', async () => {
      const service: any = createService()
      const publicConfig = buildInstanceConfig({ rootOrg: 'ro2', org: ['orgA'] })
      httpGetMock.mockReturnValue(of(publicConfig))

      const result = await service.fetchInstanceConfig()

      expect(httpGetMock).toHaveBeenCalledWith('site-path/site.config.json')
      expect(result).toBe(publicConfig)
      expect(configSvc.instanceConfig).toBe(publicConfig)
      expect(configSvc.rootOrg).toBe('ro2')
      expect(configSvc.activeOrg).toBe('orgA')
      expect(document.title).toBe('Test App')
    })
  })

  describe('fetchFeaturesStatus (private, via any cast)', () => {
    it('computes restrictedFeatures based on permission configs', async () => {
      const service: any = createService()
      configSvc.userRoles = new Set(['learner'])
      configSvc.userGroups = new Set()
      const featureConfigs = {
        featureA: { roles: ['admin'] },
        featureB: {},
      }
      httpGetMock.mockReturnValue(of(featureConfigs))

      const result = await service.fetchFeaturesStatus()

      expect(httpGetMock).toHaveBeenCalledWith('assets/configurations/features.config.json')
      expect(result).toBeInstanceOf(Set)
      expect(configSvc.restrictedFeatures).toBe(result)
    })
  })

  describe('fetchWidgetStatus (private, via any cast)', () => {
    it('fetches widget configs', async () => {
      const service: any = createService()
      const widgetConfigs = [{ widgetPermission: {} }]
      httpGetMock.mockReturnValue(of(widgetConfigs))

      const result = await service.fetchWidgetStatus()

      expect(httpGetMock).toHaveBeenCalledWith('assets/configurations/widgets.config.json')
      expect(result).toBe(widgetConfigs)
    })
  })

  describe('processWidgetStatus (private, via any cast)', () => {
    it('returns empty set when WidgetResolverService.getWidgetKey is unavailable and no permissions match', () => {
      const service: any = createService()
      configSvc.userRoles = new Set()
      configSvc.userGroups = new Set()
      configSvc.restrictedFeatures = new Set()
      const result = service.processWidgetStatus([])
      expect(result).toEqual(new Set())
      expect(configSvc.restrictedWidgets).toBe(result)
    })
  })

  describe('processAppsConfig (private, via any cast)', () => {
    it('filters features and groups according to restrictedFeatures', () => {
      const service: any = createService()
      configSvc.restrictedFeatures = new Set(['restricted-feature'])
      const appsConfig = {
        tourGuide: { some: 'guide' },
        features: {
          f1: { id: 'f1', permission: { restrictedFeatureIds: [] } },
          f2: { id: 'f2', permission: { restrictedFeatureIds: ['restricted-feature'] } },
        },
        groups: [
          { featureIds: ['f1'] },
          { featureIds: ['f2'] },
        ],
      }
      const result = service.processAppsConfig(appsConfig)
      expect(result.tourGuide).toEqual({ some: 'guide' })
      expect(Object.keys(result.features)).toContain('f1')
      expect(result.groups.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('fetchStartUpDetails (private, via any cast)', () => {
    it('returns default public details when disablePidCheck is true', async () => {
      const service: any = createService()
      configSvc.instanceConfig = buildInstanceConfig({ disablePidCheck: true })

      const result = await service.fetchStartUpDetails()

      expect(result.tncStatus).toBe(true)
      expect(result.isActive).toBe(true)
      expect(httpGetMock).not.toHaveBeenCalled()
    })

    it('returns default public details when instanceConfig is null', async () => {
      const service: any = createService()
      configSvc.instanceConfig = null

      const result = await service.fetchStartUpDetails()

      expect(result.profileDetailsStatus).toBe(true)
      expect(httpGetMock).not.toHaveBeenCalled()
    })

    it('fetches profile, sets userProfile when role matches, and returns details', async () => {
      const service: any = createService()
      configSvc.instanceConfig = buildInstanceConfig({ disablePidCheck: false })
      const matchingRole = environment.portalRoles[0]
      const responseBody = {
        result: {
          response: {
            roles: [matchingRole],
            userId: 'u1',
            firstName: 'John',
            lastName: 'Doe',
            userName: 'johndoe',
            email: 'john@example.com',
            channel: 'dept',
            rootOrgId: 'root1',
            thumbnail: 'thumb.png',
            profileDetails: { mandatoryFieldsExists: true },
            promptTnC: false,
            isDeleted: false,
          },
        },
      }
      httpGetMock.mockReturnValue(of(responseBody))

      const result = await service.fetchStartUpDetails()

      expect(httpGetMock).toHaveBeenCalledWith('/apis/proxies/v8/api/user/v2/read')
      expect(configSvc.unMappedUser).toBeTruthy()
      expect(configSvc.userProfile.userId).toBe('u1')
      expect(configSvc.userProfile.firstName).toBe('John')
      expect(configSvc.hasAcceptedTnc).toBe(true)
      expect(configSvc.isActive).toBe(true)
      expect(configSvc.userRoles.has(matchingRole.toLowerCase())).toBe(true)
      expect(result.roles).toEqual([matchingRole.toLowerCase()])
      expect(logoutMock).not.toHaveBeenCalled()
    })

    it('logs out the user when roles do not match any portal role', async () => {
      const service: any = createService()
      configSvc.instanceConfig = buildInstanceConfig({ disablePidCheck: false })
      const responseBody = {
        result: {
          response: {
            roles: ['NOT_A_PORTAL_ROLE'],
            userId: 'u2',
            firstName: 'Jane',
          },
        },
      }
      httpGetMock.mockReturnValue(of(responseBody))

      await service.fetchStartUpDetails()

      expect(logoutMock).toHaveBeenCalled()
    })

    it('rethrows the error and clears userProfile when the http call fails', async () => {
      const service: any = createService()
      configSvc.instanceConfig = buildInstanceConfig({ disablePidCheck: false })
      configSvc.userProfile = { userId: 'stale' }
      httpGetMock.mockReturnValue(throwError(() => new Error('network error')))

      await expect(service.fetchStartUpDetails()).rejects.toThrow('network error')
      expect(configSvc.userProfile).toBeNull()
    })
  })

  describe('init', () => {
    it('returns false and updates nav config when fetchStartUpDetails fails (not authenticated)', async () => {
      const service = createService()
      httpGetMock.mockImplementation((url: string) => {
        if (url.includes('host.config.json')) {
          return of(buildInstanceConfig({ disablePidCheck: false }))
        }
        if (url.includes('/apis/proxies')) {
          return throwError(() => new Error('unauthenticated'))
        }
        return of({})
      })

      const result = await service.init()

      expect(result).toBe(false)
      expect(initializePrefChangesMock).toHaveBeenCalledWith(environment.production)
    })

    it('runs the full success path and returns true', async () => {
      const service = createService()
      const matchingRole = environment.portalRoles[0]

      httpGetMock.mockImplementation((url: string) => {
        if (url.includes('host.config.json')) {
          return of(buildInstanceConfig({ disablePidCheck: true }))
        }
        if (url.includes('site.config.json')) {
          return of(buildInstanceConfig({ disablePidCheck: true, featuredApps: ['f1'] }))
        }
        if (url.includes('feature/apps.json')) {
          return of({
            features: { f1: { id: 'f1', permission: {} } },
            groups: [{ featureIds: ['f1'] }],
            tourGuide: {},
          })
        }
        if (url.includes('features.config.json')) {
          return of({})
        }
        if (url.includes('widgets.config.json')) {
          return of([])
        }
        return of({})
      })
      fetchUserPreferenceMock.mockResolvedValue({
        pinnedApps: 'app1,app2',
        profileSettings: ['s1'],
        selectedLocale: 'en',
      })

      const result = await service.init()

      expect(result).toBe(true)
      expect(configSvc.pinnedApps.next).toHaveBeenCalledWith(new Set(['app1', 'app2']))
      expect(configSvc.profileSettings).toEqual(['s1'])
      expect(configSvc.appsConfig).toEqual({
        features: { f1: { id: 'f1', permission: {} } },
        groups: [{ featureIds: ['f1'] }],
        tourGuide: {},
      })
      expect(configSvc.instanceConfig.featuredApps).toEqual(['f1'])
      expect(widgetResolverInitializeMock).toHaveBeenCalled()
      expect(userPreferenceInitializeMock).toHaveBeenCalled()
      expect(initializePrefChangesMock).toHaveBeenCalledWith(environment.production)
      void matchingRole
    })

    it('catches errors in the post-auth phase and still calls initializePrefChanges', async () => {
      const service = createService()
      httpGetMock.mockImplementation((url: string) => {
        if (url.includes('host.config.json')) {
          return of(buildInstanceConfig({ disablePidCheck: true }))
        }
        if (url.includes('site.config.json')) {
          return of(buildInstanceConfig({ disablePidCheck: true }))
        }
        if (url.includes('feature/apps.json')) {
          return of({ features: {}, groups: [], tourGuide: {} })
        }
        if (url.includes('widgets.config.json')) {
          return of([])
        }
        if (url.includes('features.config.json')) {
          return throwError(() => new Error('features config failed'))
        }
        return of({})
      })
      fetchUserPreferenceMock.mockResolvedValue({})

      const result = await service.init()

      expect(result).toBe(true)
      expect(initializePrefChangesMock).toHaveBeenCalledWith(environment.production)
    })
  })
})
