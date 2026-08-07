import { of, throwError } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { UserWorkResolverService } from './user-work-resolver.service'
import { UserWorkService } from './user-work.service'

describe('UserWorkResolverService', () => {
  let resolver: UserWorkResolverService
  let userWorkService: ReturnType<typeof createSpyObj>

  beforeEach(() => {
    userWorkService = createSpyObj('UserWorkService', ['fetchUserWorkAllocation'])
    resolver = new UserWorkResolverService(userWorkService as unknown as UserWorkService)
  })

  it('should be created', () => {
    expect(resolver).toBeTruthy()
  })

  it('should fetch by officerId from route params and unwrap result.data', done => {
    userWorkService.fetchUserWorkAllocation.mockReturnValue(of({ result: { data: { userId: 'u1' } } }))
    const route: any = { params: { officerId: 'o1' } }
    resolver.resolve(route).subscribe((res: any) => {
      expect(userWorkService.fetchUserWorkAllocation).toHaveBeenCalledWith('o1')
      expect(res).toEqual({ data: { userId: 'u1' }, error: null })
      done()
    })
  })

  it('should return null data when result is missing', done => {
    userWorkService.fetchUserWorkAllocation.mockReturnValue(of({}))
    resolver.resolve({ params: {} } as any).subscribe((res: any) => {
      expect(res).toEqual({ data: undefined, error: null })
      done()
    })
  })

  it('should emit error with null data on failure', done => {
    const err = new Error('boom')
    userWorkService.fetchUserWorkAllocation.mockReturnValue(throwError(err))
    resolver.resolve({ params: {} } as any).subscribe((res: any) => {
      expect(res).toEqual({ data: null, error: err })
      done()
    })
  })
})
