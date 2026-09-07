import { WorkflowHistoryResolve } from './workflow-history-resolve'
import { of, throwError } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('WorkflowHistoryResolve (events)', () => {
  let resolver: WorkflowHistoryResolve
  let usersService: any
  let configSvc: any

  beforeEach(() => {
    usersService = createSpyObj('UsersService', ['getWfHistoryByAppId'])
    configSvc = { userProfile: { userId: 'u1' } }
    resolver = new WorkflowHistoryResolve(usersService, configSvc)
  })

  it('should be created', () => {
    expect(resolver).toBeTruthy()
  })

  it('resolves userId from route params when path is not "me"', () => {
    usersService.getWfHistoryByAppId.mockReturnValue(of({ history: [] }))
    const route: any = { routeConfig: { path: 'user/:userId' }, params: { userId: 'p1' }, queryParams: {} }
    let result: any
    resolver.resolve(route, {} as any).subscribe(r => (result = r))
    expect(usersService.getWfHistoryByAppId).toHaveBeenCalledWith('p1')
    expect(result).toEqual({ data: { history: [] }, error: null })
  })

  it('falls back to queryParams.userId when params.userId is absent', () => {
    usersService.getWfHistoryByAppId.mockReturnValue(of({}))
    const route: any = { routeConfig: { path: 'user' }, params: {}, queryParams: { userId: 'q1' } }
    resolver.resolve(route, {} as any).subscribe()
    expect(usersService.getWfHistoryByAppId).toHaveBeenCalledWith('q1')
  })

  it('falls back to configSvc.userProfile.userId when neither params nor queryParams have userId', () => {
    usersService.getWfHistoryByAppId.mockReturnValue(of({}))
    const route: any = { routeConfig: { path: 'user' }, params: {}, queryParams: {} }
    resolver.resolve(route, {} as any).subscribe()
    expect(usersService.getWfHistoryByAppId).toHaveBeenCalledWith('u1')
  })

  it('uses configSvc.userProfile.userId directly when path is "me"', () => {
    usersService.getWfHistoryByAppId.mockReturnValue(of({}))
    const route: any = { routeConfig: { path: 'me' }, params: { userId: 'ignored' }, queryParams: {} }
    resolver.resolve(route, {} as any).subscribe()
    expect(usersService.getWfHistoryByAppId).toHaveBeenCalledWith('u1')
  })

  it('catches errors and emits { error, data: null }', () => {
    const err = new Error('boom')
    usersService.getWfHistoryByAppId.mockReturnValue(throwError(err))
    const route: any = { routeConfig: { path: 'me' }, params: {}, queryParams: {} }
    let result: any
    resolver.resolve(route, {} as any).subscribe(r => (result = r))
    expect(result.data).toBeNull()
    expect(result.error).toBe(err)
  })
})
