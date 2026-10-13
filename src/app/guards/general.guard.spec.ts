import { TestBed, inject } from '@angular/core/testing'
import { Router } from '@angular/router'
import { ConfigurationsService, AuthKeycloakService } from '@sunbird-cb/utils'

import { GeneralGuard } from './general.guard'

describe('GeneralGuard', () => {
  let configSvc: any
  let authSvc: any
  let router: any

  beforeEach(() => {
    configSvc = {
      userProfile: {},
      instanceConfig: { disablePidCheck: false },
      hasAcceptedTnc: true,
      userRoles: new Set(),
      restrictedFeatures: new Set(),
      unMappedUser: {},
      userUrl: '',
    }
    authSvc = {
      logout: jest.fn(),
    }
    router = {
      parseUrl: jest.fn().mockReturnValue('urlTree'),
      navigateByUrl: jest.fn(),
    }

    TestBed.configureTestingModule({
      providers: [
        GeneralGuard,
        { provide: ConfigurationsService, useValue: configSvc },
        { provide: AuthKeycloakService, useValue: authSvc },
        { provide: Router, useValue: router },
      ],
    })
  })

  it('should ...', inject([GeneralGuard], (guard: GeneralGuard) => {
    expect(guard).toBeTruthy()
  }))

  describe('hasRole', () => {
    it('returns true when a role matches (case-insensitive)', inject([GeneralGuard], (guard: GeneralGuard) => {
      configSvc.userRoles = new Set(['admin'])
      expect(guard.hasRole(['ADMIN'])).toBe(true)
    }))

    it('returns false when no role matches', inject([GeneralGuard], (guard: GeneralGuard) => {
      configSvc.userRoles = new Set(['admin'])
      expect(guard.hasRole(['user'])).toBe(false)
    }))

    it('returns false for empty role array', inject([GeneralGuard], (guard: GeneralGuard) => {
      expect(guard.hasRole([])).toBe(false)
    }))

    it('handles falsy role entries and missing userRoles', inject([GeneralGuard], (guard: GeneralGuard) => {
      configSvc.userRoles = null
      expect(guard.hasRole([''])).toBe(false)
    }))
  })

  describe('canActivate / shouldAllow', () => {
    const state: any = { url: '/some/route' }

    it('redirects to invalid-user when userProfile is null and pid check enabled', inject(
      [GeneralGuard],
      async (guard: GeneralGuard) => {
        configSvc.userProfile = null
        configSvc.instanceConfig = { disablePidCheck: false }
        const result = await guard.canActivate({ data: {} } as any, state)
        expect(router.parseUrl).toHaveBeenCalledWith('/app/invalid-user')
        expect(result).toBe('urlTree')
      },
    ))

    it('does not redirect to invalid-user when disablePidCheck is true', inject(
      [GeneralGuard],
      async (guard: GeneralGuard) => {
        configSvc.userProfile = null
        configSvc.instanceConfig = { disablePidCheck: true }
        const result = await guard.canActivate({ data: {} } as any, state)
        expect(router.parseUrl).not.toHaveBeenCalledWith('/app/invalid-user')
        expect(result).toBe(true)
      },
    ))

    it('does not redirect to invalid-user when instanceConfig is falsy', inject(
      [GeneralGuard],
      async (guard: GeneralGuard) => {
        configSvc.userProfile = null
        configSvc.instanceConfig = null
        const result = await guard.canActivate({ data: {} } as any, state)
        expect(router.parseUrl).not.toHaveBeenCalledWith('/app/invalid-user')
        expect(result).toBe(true)
      },
    ))

    it('sets userUrl when tnc not accepted and url is eligible', inject(
      [GeneralGuard],
      async (guard: GeneralGuard) => {
        configSvc.hasAcceptedTnc = false
        const s: any = { url: 'app-some-page' }
        await guard.canActivate({ data: {} } as any, s)
        expect(configSvc.userUrl).toBe('app-some-page')
      },
    ))

    it('does not set userUrl when url includes /app/setup/', inject(
      [GeneralGuard],
      async (guard: GeneralGuard) => {
        configSvc.hasAcceptedTnc = false
        configSvc.userUrl = 'unchanged'
        const s: any = { url: '/app/setup/xyz' }
        await guard.canActivate({ data: {} } as any, s)
        expect(configSvc.userUrl).toBe('unchanged')
      },
    ))

    it('does not set userUrl when url includes /app/tnc', inject(
      [GeneralGuard],
      async (guard: GeneralGuard) => {
        configSvc.hasAcceptedTnc = false
        configSvc.userUrl = 'unchanged'
        const s: any = { url: '/app/tnc' }
        await guard.canActivate({ data: {} } as any, s)
        expect(configSvc.userUrl).toBe('unchanged')
      },
    ))

    it('does not set userUrl when state.url is falsy', inject(
      [GeneralGuard],
      async (guard: GeneralGuard) => {
        configSvc.hasAcceptedTnc = false
        configSvc.userUrl = 'unchanged'
        const s: any = { url: '' }
        await guard.canActivate({ data: {} } as any, s)
        expect(configSvc.userUrl).toBe('unchanged')
      },
    ))

    it('skips the tnc block when hasAcceptedTnc is true', inject(
      [GeneralGuard],
      async (guard: GeneralGuard) => {
        configSvc.hasAcceptedTnc = true
        configSvc.userUrl = 'unchanged'
        const s: any = { url: '/app/some-page' }
        await guard.canActivate({ data: {} } as any, s)
        expect(configSvc.userUrl).toBe('unchanged')
      },
    ))

    it('logs out and returns false when unMappedUser.isDeleted is true', inject(
      [GeneralGuard],
      async (guard: GeneralGuard) => {
        configSvc.unMappedUser = { isDeleted: true }
        const result = await guard.canActivate({ data: {} } as any, state)
        expect(router.navigateByUrl).toHaveBeenCalledWith('/error-access-forbidden')
        expect(authSvc.logout).toHaveBeenCalled()
        expect(result).toBe(false)
      },
    ))

    it('continues normally when unMappedUser.isDeleted is falsy', inject(
      [GeneralGuard],
      async (guard: GeneralGuard) => {
        configSvc.unMappedUser = { isDeleted: false }
        const result = await guard.canActivate({ data: {} } as any, state)
        expect(authSvc.logout).not.toHaveBeenCalled()
        expect(result).toBe(true)
      },
    ))

    it('redirects to /page/home when requiredRoles present but not satisfied', inject(
      [GeneralGuard],
      async (guard: GeneralGuard) => {
        configSvc.userRoles = new Set(['viewer'])
        const result = await guard.canActivate({ data: { requiredRoles: ['admin'] } } as any, state)
        expect(router.parseUrl).toHaveBeenCalledWith('/page/home')
        expect(result).toBe('urlTree')
      },
    ))

    it('allows access when requiredRoles present and satisfied', inject(
      [GeneralGuard],
      async (guard: GeneralGuard) => {
        configSvc.userRoles = new Set(['admin'])
        const result = await guard.canActivate({ data: { requiredRoles: ['admin'] } } as any, state)
        expect(result).toBe(true)
      },
    ))

    it('skips role check when requiredRoles is empty', inject(
      [GeneralGuard],
      async (guard: GeneralGuard) => {
        const result = await guard.canActivate({ data: { requiredRoles: [] } } as any, state)
        expect(result).toBe(true)
      },
    ))

    it('skips role check when userRoles is falsy', inject(
      [GeneralGuard],
      async (guard: GeneralGuard) => {
        configSvc.userRoles = null
        const result = await guard.canActivate({ data: { requiredRoles: ['admin'] } } as any, state)
        expect(result).toBe(true)
      },
    ))

    it('redirects to /app/home when requiredFeatures are restricted', inject(
      [GeneralGuard],
      async (guard: GeneralGuard) => {
        configSvc.restrictedFeatures = new Set(['featureA'])
        const result = await guard.canActivate(
          { data: { requiredFeatures: ['featureA'] } } as any,
          state,
        )
        expect(router.parseUrl).toHaveBeenCalledWith('/app/home')
        expect(result).toBe('urlTree')
      },
    ))

    it('allows access when requiredFeatures are not restricted', inject(
      [GeneralGuard],
      async (guard: GeneralGuard) => {
        configSvc.restrictedFeatures = new Set(['other'])
        const result = await guard.canActivate(
          { data: { requiredFeatures: ['featureA'] } } as any,
          state,
        )
        expect(result).toBe(true)
      },
    ))

    it('skips feature check when requiredFeatures is empty', inject(
      [GeneralGuard],
      async (guard: GeneralGuard) => {
        const result = await guard.canActivate({ data: { requiredFeatures: [] } } as any, state)
        expect(result).toBe(true)
      },
    ))

    it('skips feature check when restrictedFeatures is falsy', inject(
      [GeneralGuard],
      async (guard: GeneralGuard) => {
        configSvc.restrictedFeatures = null
        const result = await guard.canActivate(
          { data: { requiredFeatures: ['featureA'] } } as any,
          state,
        )
        expect(result).toBe(true)
      },
    ))

    it('defaults requiredFeatures/requiredRoles to [] when next.data is missing', inject(
      [GeneralGuard],
      async (guard: GeneralGuard) => {
        const result = await guard.canActivate({} as any, state)
        expect(result).toBe(true)
      },
    ))
  })
})
