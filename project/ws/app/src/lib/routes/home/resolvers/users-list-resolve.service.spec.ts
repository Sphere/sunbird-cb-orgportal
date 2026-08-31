import { of, throwError } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { UsersListResolve } from './users-list-resolve.service'
import { UsersService } from '../../users/services/users.service'

describe('UsersListResolve', () => {
  let resolver: UsersListResolve
  let usersService: jest.Mocked<UsersService>
  let configSvc: any

  beforeEach(() => {
    usersService = createSpyObj('UsersService', ['getAllUsers'])
    configSvc = { unMappedUser: { rootOrg: { id: 'org-1' } } }
    // @SkipSelf() on the constructor confuses TestBed's flat injector —
    // instantiate directly instead of going through DI.
    resolver = new UsersListResolve(usersService as unknown as UsersService, configSvc)
  })

  it('should be created', () => {
    expect(resolver).toBeTruthy()
  })

  it('should emit data with no error on success', done => {
    usersService.getAllUsers.mockReturnValue(of({ result: 'ok' }))
    resolver.resolve({} as any, {} as any).subscribe(res => {
      expect(res).toEqual({ data: { result: 'ok' }, error: null })
      const [filterObj] = usersService.getAllUsers.mock.calls[0] as [any]
      expect(filterObj.request.filters.rootOrgId).toBe('org-1')
      done()
    })
  })

  it('should emit error with null data on failure', done => {
    const err = new Error('boom')
    usersService.getAllUsers.mockReturnValue(throwError(err))
    resolver.resolve({} as any, {} as any).subscribe(res => {
      expect(res).toEqual({ error: err, data: null })
      done()
    })
  })

  it('should default rootOrgId to undefined when unMappedUser is missing', done => {
    configSvc.unMappedUser = undefined
    usersService.getAllUsers.mockReturnValue(of({}))
    resolver.resolve({} as any, {} as any).subscribe(() => {
      const [filterObj] = usersService.getAllUsers.mock.calls[0] as [any]
      expect(filterObj.request.filters.rootOrgId).toBeUndefined()
      done()
    })
  })
})
