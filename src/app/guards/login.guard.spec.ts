import { Router } from '@angular/router'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { LoginGuard } from './login.guard'

describe('LoginGuard', () => {
  let guard: LoginGuard
  let router: jest.Mocked<Router>
  let configSvc: any

  const build = (config: any) => {
    router = createSpyObj('Router', ['parseUrl'])
    configSvc = config
    guard = new LoginGuard(router as any, configSvc)
  }

  it('should create', () => {
    build({})
    expect(guard).toBeTruthy()
  })

  it('should allow activation when not authenticated and login is not hidden', () => {
    build({ isAuthenticated: false, instanceConfig: { keycloak: { isLoginHidden: false } } })
    expect(guard.canActivate({ queryParamMap: { has: () => false, get: () => null } } as any, {} as any)).toBe(true)
  })

  it('should allow activation when not authenticated and instanceConfig is missing', () => {
    build({ isAuthenticated: false, instanceConfig: undefined })
    expect(guard.canActivate({} as any, {} as any)).toBe(true)
  })

  it('should deny activation when not authenticated and login is hidden', () => {
    build({ isAuthenticated: false, instanceConfig: { keycloak: { isLoginHidden: true } } })
    expect(guard.canActivate({} as any, {} as any)).toBe(false)
  })

  it('should redirect to the decoded ref query param when authenticated', () => {
    build({ isAuthenticated: true })
    router.parseUrl.mockReturnValue('parsed-tree' as any)
    const next = { queryParamMap: { has: () => true, get: () => encodeURIComponent('/app/x') } }
    const result = guard.canActivate(next as any, {} as any)
    expect(router.parseUrl).toHaveBeenCalledWith('/app/x')
    expect(result).toBe('parsed-tree')
  })

  it('should fall back to an empty ref when the query param decodes to empty', () => {
    build({ isAuthenticated: true })
    const next = { queryParamMap: { has: () => true, get: () => '' } }
    guard.canActivate(next as any, {} as any)
    expect(router.parseUrl).toHaveBeenCalledWith('')
  })

  it('should redirect to app/home when authenticated with no ref param', () => {
    build({ isAuthenticated: true })
    const next = { queryParamMap: { has: () => false, get: () => null } }
    guard.canActivate(next as any, {} as any)
    expect(router.parseUrl).toHaveBeenCalledWith('app/home')
  })
})
