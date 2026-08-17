import { HomeResolve } from './home-resolve'
import { of, throwError } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('HomeResolve', () => {
  let resolver: HomeResolve
  let profileV2Svc: any
  let configSvc: any

  beforeEach(() => {
    profileV2Svc = createSpyObj('ProfileV2Service', ['fetchProfile'])
    configSvc = { userProfile: { userId: 'u1' } }
    resolver = new HomeResolve(profileV2Svc, configSvc)
    jest.spyOn(console, 'log').mockImplementation(() => undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should be created', () => {
    expect(resolver).toBeTruthy()
  })

  it('resolves userId from route params when path is not "me"', () => {
    profileV2Svc.fetchProfile.mockReturnValue(of({ name: 'A' }))
    const route: any = { routeConfig: { path: 'user/:userId' }, params: { userId: 'p1' }, queryParams: {} }
    let result: any
    resolver.resolve(route, {} as any).subscribe(r => (result = r))
    expect(profileV2Svc.fetchProfile).toHaveBeenCalledWith('p1')
    expect(result).toEqual({ data: { name: 'A' }, error: null })
  })

  it('falls back to queryParams.userId when params.userId is absent', () => {
    profileV2Svc.fetchProfile.mockReturnValue(of({}))
    const route: any = { routeConfig: { path: 'user' }, params: {}, queryParams: { userId: 'q1' } }
    resolver.resolve(route, {} as any).subscribe()
    expect(profileV2Svc.fetchProfile).toHaveBeenCalledWith('q1')
  })

  it('falls back to configSvc.userProfile.userId when neither params nor queryParams have userId', () => {
    profileV2Svc.fetchProfile.mockReturnValue(of({}))
    const route: any = { routeConfig: { path: 'user' }, params: {}, queryParams: {} }
    resolver.resolve(route, {} as any).subscribe()
    expect(profileV2Svc.fetchProfile).toHaveBeenCalledWith('u1')
  })

  it('uses configSvc.userProfile.userId directly when path is "me"', () => {
    profileV2Svc.fetchProfile.mockReturnValue(of({}))
    const route: any = { routeConfig: { path: 'me' }, params: { userId: 'ignored' }, queryParams: {} }
    resolver.resolve(route, {} as any).subscribe()
    expect(profileV2Svc.fetchProfile).toHaveBeenCalledWith('u1')
  })

  it('catches errors and emits { error, data: null }', () => {
    const err = new Error('boom')
    profileV2Svc.fetchProfile.mockReturnValue(throwError(err))
    const route: any = { routeConfig: { path: 'me' }, params: {}, queryParams: {} }
    let result: any
    resolver.resolve(route, {} as any).subscribe(r => (result = r))
    expect(result.data).toBeNull()
    expect(result.error).toBe(err)
  })
})
