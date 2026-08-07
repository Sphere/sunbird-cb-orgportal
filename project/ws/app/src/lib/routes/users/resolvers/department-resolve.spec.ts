import { of, throwError } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { DepartmentResolve } from './department-resolve'
import { UsersService } from '../services/users.service'

describe('DepartmentResolve', () => {
  let resolver: DepartmentResolve
  let usersService: ReturnType<typeof createSpyObj>

  beforeEach(() => {
    usersService = createSpyObj('UsersService', ['getMyDepartment'])
    resolver = new DepartmentResolve(usersService as unknown as UsersService)
  })

  it('should be created', () => {
    expect(resolver).toBeTruthy()
  })

  it('should emit data with no error on success', done => {
    usersService.getMyDepartment.mockReturnValue(of({ department: 'IT' }))
    resolver.resolve({} as any, {} as any).subscribe(res => {
      expect(res).toEqual({ data: { department: 'IT' }, error: null })
      done()
    })
  })

  it('should complete with no emission on failure (EMPTY)', done => {
    usersService.getMyDepartment.mockReturnValue(throwError(new Error('boom')))
    let emitted = false
    resolver.resolve({} as any, {} as any).subscribe({
      next: () => { emitted = true },
      complete: () => {
        expect(emitted).toBe(false)
        done()
      },
    })
  })
})
