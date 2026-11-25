import { WorkflowResolve } from './workflow-resolve'
import { of, throwError, EMPTY } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('WorkflowResolve', () => {
  let resolver: WorkflowResolve
  let needApprService: any
  let configSvc: any

  beforeEach(() => {
    needApprService = createSpyObj('NeedApprovalsService', ['fetchNeedApprovals'])
    configSvc = { unMappedUser: { channel: 'dept1' }, userProfile: { userId: 'u1' } }
    resolver = new WorkflowResolve(needApprService, configSvc)
  })

  it('should be created', () => {
    expect(resolver).toBeTruthy()
  })

  it('resolves userId from route params when path is not "me"', () => {
    needApprService.fetchNeedApprovals.mockReturnValue(of({ result: 'ok' }))
    const route: any = { routeConfig: { path: 'user/:userId' }, params: { userId: 'p1' }, queryParams: {} }
    let result: any
    resolver.resolve(route, {} as any).subscribe(r => (result = r))
    expect(needApprService.fetchNeedApprovals).toHaveBeenCalledWith(
      expect.objectContaining({ applicationIds: ['p1'], deptName: 'dept1' }),
    )
    expect(result).toEqual({ data: { result: 'ok' }, error: null })
  })

  it('falls back to queryParams.userId when params.userId is absent', () => {
    needApprService.fetchNeedApprovals.mockReturnValue(of({}))
    const route: any = { routeConfig: { path: 'user' }, params: {}, queryParams: { userId: 'q1' } }
    resolver.resolve(route, {} as any).subscribe()
    expect(needApprService.fetchNeedApprovals).toHaveBeenCalledWith(
      expect.objectContaining({ applicationIds: ['q1'] }),
    )
  })

  it('falls back to configSvc.userProfile.userId when neither params nor queryParams have userId', () => {
    needApprService.fetchNeedApprovals.mockReturnValue(of({}))
    const route: any = { routeConfig: { path: 'user' }, params: {}, queryParams: {} }
    resolver.resolve(route, {} as any).subscribe()
    expect(needApprService.fetchNeedApprovals).toHaveBeenCalledWith(
      expect.objectContaining({ applicationIds: ['u1'] }),
    )
  })

  it('uses configSvc.userProfile.userId directly when path is "me"', () => {
    needApprService.fetchNeedApprovals.mockReturnValue(of({}))
    const route: any = { routeConfig: { path: 'me' }, params: { userId: 'ignored' }, queryParams: {} }
    resolver.resolve(route, {} as any).subscribe()
    expect(needApprService.fetchNeedApprovals).toHaveBeenCalledWith(
      expect.objectContaining({ applicationIds: ['u1'] }),
    )
  })

  it('catches errors and emits { error, data: null }', () => {
    const err = new Error('boom')
    needApprService.fetchNeedApprovals.mockReturnValue(throwError(err))
    const route: any = { routeConfig: { path: 'me' }, params: {}, queryParams: {} }
    let result: any
    resolver.resolve(route, {} as any).subscribe(r => (result = r))
    expect(result.data).toBeNull()
    expect(result.error).toBe(err)
  })

  it('returns EMPTY when departName is falsy', done => {
    configSvc.unMappedUser = undefined
    const route: any = { routeConfig: { path: 'me' }, params: {}, queryParams: {} }
    const result$ = resolver.resolve(route, {} as any)
    expect(result$).toBe(EMPTY)
    let emitted = false
    result$.subscribe({
      next: () => (emitted = true),
      complete: () => {
        expect(emitted).toBe(false)
        done()
      },
    })
  })
})
