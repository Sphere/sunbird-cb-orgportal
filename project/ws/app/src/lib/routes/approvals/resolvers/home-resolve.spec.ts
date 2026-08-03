import { HomeResolve } from './home-resolve'
import { of, throwError } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('HomeResolve (approvals)', () => {
  let resolver: HomeResolve
  let needApprService: any
  let configSvc: any

  beforeEach(() => {
    needApprService = createSpyObj('NeedApprovalsService', ['fetchProfileDeatils'])
    configSvc = { userProfile: { userId: 'u1' } }
    resolver = new HomeResolve(needApprService, configSvc)
  })

  it('should be created', () => {
    expect(resolver).toBeTruthy()
  })

  it('resolves userId from route params when path is not "me"', () => {
    needApprService.fetchProfileDeatils.mockReturnValue(of({ name: 'A' }))
    const route: any = { routeConfig: { path: 'user/:userId' }, params: { userId: 'p1' }, queryParams: {} }
    let result: any
    resolver.resolve(route, {} as any).subscribe(r => (result = r))
    expect(needApprService.fetchProfileDeatils).toHaveBeenCalledWith('p1')
    expect(result).toEqual({ data: { name: 'A' }, error: null })
  })

  it('falls back to queryParams.userId when params.userId is absent', () => {
    needApprService.fetchProfileDeatils.mockReturnValue(of({}))
    const route: any = { routeConfig: { path: 'user' }, params: {}, queryParams: { userId: 'q1' } }
    resolver.resolve(route, {} as any).subscribe()
    expect(needApprService.fetchProfileDeatils).toHaveBeenCalledWith('q1')
  })

  it('falls back to configSvc.userProfile.userId when neither params nor queryParams have userId', () => {
    needApprService.fetchProfileDeatils.mockReturnValue(of({}))
    const route: any = { routeConfig: { path: 'user' }, params: {}, queryParams: {} }
    resolver.resolve(route, {} as any).subscribe()
    expect(needApprService.fetchProfileDeatils).toHaveBeenCalledWith('u1')
  })

  it('uses configSvc.userProfile.userId directly when path is "me"', () => {
    needApprService.fetchProfileDeatils.mockReturnValue(of({}))
    const route: any = { routeConfig: { path: 'me' }, params: { userId: 'ignored' }, queryParams: {} }
    resolver.resolve(route, {} as any).subscribe()
    expect(needApprService.fetchProfileDeatils).toHaveBeenCalledWith('u1')
  })

  it('catches errors and emits { error, data: null }', () => {
    const err = new Error('boom')
    needApprService.fetchProfileDeatils.mockReturnValue(throwError(err))
    const route: any = { routeConfig: { path: 'me' }, params: {}, queryParams: {} }
    let result: any
    resolver.resolve(route, {} as any).subscribe(r => (result = r))
    expect(result.data).toBeNull()
    expect(result.error).toBe(err)
  })
})
