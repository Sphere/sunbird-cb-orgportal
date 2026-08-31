import { UserResolve } from './user-resolve'
import { of, throwError } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('UserResolve (users)', () => {
  let resolver: UserResolve
  let usersSvc: any
  let configSvc: any

  beforeEach(() => {
    usersSvc = createSpyObj('UsersService', ['getUserById'])
    configSvc = { userProfile: { userId: 'u1' } }
    resolver = new UserResolve(usersSvc, configSvc)
  })

  it('should be created', () => {
    expect(resolver).toBeTruthy()
  })

  it('resolves userId from route params when path is not "me"', () => {
    usersSvc.getUserById.mockReturnValue(of({ name: 'A' }))
    const route: any = { routeConfig: { path: 'user/:userId' }, params: { userId: 'p1' }, queryParams: {} }
    let result: any
    resolver.resolve(route, {} as any).subscribe(r => (result = r))
    expect(usersSvc.getUserById).toHaveBeenCalledWith('p1')
    expect(result).toEqual({ data: { name: 'A' }, error: null })
  })

  it('falls back to queryParams.userId when params.userId is absent', () => {
    usersSvc.getUserById.mockReturnValue(of({}))
    const route: any = { routeConfig: { path: 'user' }, params: {}, queryParams: { userId: 'q1' } }
    resolver.resolve(route, {} as any).subscribe()
    expect(usersSvc.getUserById).toHaveBeenCalledWith('q1')
  })

  it('falls back to configSvc.userProfile.userId when neither params nor queryParams have userId', () => {
    usersSvc.getUserById.mockReturnValue(of({}))
    const route: any = { routeConfig: { path: 'user' }, params: {}, queryParams: {} }
    resolver.resolve(route, {} as any).subscribe()
    expect(usersSvc.getUserById).toHaveBeenCalledWith('u1')
  })

  it('uses configSvc.userProfile.userId directly when path is "me"', () => {
    usersSvc.getUserById.mockReturnValue(of({}))
    const route: any = { routeConfig: { path: 'me' }, params: { userId: 'ignored' }, queryParams: {} }
    resolver.resolve(route, {} as any).subscribe()
    expect(usersSvc.getUserById).toHaveBeenCalledWith('u1')
  })

  it('catches errors and emits { error, data: null }', () => {
    const err = new Error('boom')
    usersSvc.getUserById.mockReturnValue(throwError(err))
    const route: any = { routeConfig: { path: 'me' }, params: {}, queryParams: {} }
    let result: any
    resolver.resolve(route, {} as any).subscribe(r => (result = r))
    expect(result.data).toBeNull()
    expect(result.error).toBe(err)
  })
})
