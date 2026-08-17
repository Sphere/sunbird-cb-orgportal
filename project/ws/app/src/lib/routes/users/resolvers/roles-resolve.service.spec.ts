import { of, throwError } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { RolesResolver } from './roles-resolve.service'
import { RolesService } from '../services/roles.service'

describe('RolesResolver', () => {
  let resolver: RolesResolver
  let rolesService: jest.Mocked<RolesService>

  beforeEach(() => {
    rolesService = createSpyObj('RolesService', ['getAllRoles'])
    resolver = new RolesResolver(rolesService as unknown as RolesService)
  })

  it('should be created', () => {
    expect(resolver).toBeTruthy()
  })

  it('should parse the JSON response value and emit no error', done => {
    rolesService.getAllRoles.mockReturnValue(
      of({ result: { response: { value: JSON.stringify([{ id: 1 }]) } } }),
    )
    resolver.resolve({} as any, {} as any).subscribe(res => {
      expect(res).toEqual({ data: [{ id: 1 }], error: null })
      done()
    })
  })

  it('should default to an empty object when response.value is missing', done => {
    rolesService.getAllRoles.mockReturnValue(of({}))
    resolver.resolve({} as any, {} as any).subscribe(res => {
      expect(res).toEqual({ data: {}, error: null })
      done()
    })
  })

  it('should emit error with null data on failure', done => {
    const err = new Error('boom')
    rolesService.getAllRoles.mockReturnValue(throwError(err))
    resolver.resolve({} as any, {} as any).subscribe(res => {
      expect(res).toEqual({ error: err, data: null })
      done()
    })
  })
})
