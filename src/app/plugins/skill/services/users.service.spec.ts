import { TestBed } from '@angular/core/testing'
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing'
import { UsersService } from './users.service'

describe('UsersService', () => {
  let service: UsersService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UsersService],
    })
    service = TestBed.inject(UsersService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getUserById', () => {
    it('should call the v1 endpoint and format the response when a userid is provided', () => {
      let result: any
      service.getUserById('user-1').subscribe(res => (result = res))

      const req = httpMock.expectOne('/apis/proxies/v8/user/v1/read/user-1')
      expect(req.request.method).toBe('GET')
      req.flush({
        result: {
          response: {
            userName: 'jdoe',
            roles: ['admin'],
            profileDetails: {
              profileReq: {
                professionalDetails: [{ designation: 'Engineer' }],
              },
            },
          },
        },
      })

      expect(result).toEqual({
        userName: 'jdoe',
        role: 'admin',
        designation: 'Engineer',
      })
    })

    it('should call the v2 endpoint and return the raw response when no userid is provided', () => {
      let result: any
      service.getUserById('').subscribe(res => (result = res))

      const req = httpMock.expectOne('/apis/proxies/v8/api/user/v2/read')
      expect(req.request.method).toBe('GET')
      req.flush({ result: { response: { userName: 'anon' } } })

      expect(result).toEqual({ userName: 'anon' })
    })
  })

  describe('getFormatedRequest', () => {
    it('should return an empty object when data is falsy', () => {
      expect(service.getFormatedRequest(null)).toEqual({})
    })

    it('should default userName and role when missing', () => {
      expect(service.getFormatedRequest({})).toEqual({
        userName: '',
        role: '',
        designation: undefined,
      })
    })

    it('should extract userName, role, and designation from a full profile', () => {
      const result = service.getFormatedRequest({
        userName: 'jdoe',
        roles: ['manager', 'admin'],
        profileDetails: {
          profileReq: {
            professionalDetails: [{ designation: 'Lead' }],
          },
        },
      })

      expect(result).toEqual({
        userName: 'jdoe',
        role: 'manager',
        designation: 'Lead',
      })
    })
  })

  describe('getprofessionalDetails', () => {
    it('should return an empty object when data is missing', () => {
      expect(service.getprofessionalDetails(null)).toEqual({})
    })

    it('should return an empty object for an empty array', () => {
      expect(service.getprofessionalDetails([])).toEqual({})
    })

    it('should use the last entry designation when multiple entries are present', () => {
      const result = service.getprofessionalDetails([
        { designation: 'Junior' },
        { designation: 'Senior' },
      ])
      expect(result).toEqual({ designation: 'Senior' })
    })

    it('should default designation to an empty string when missing on the entry', () => {
      const result = service.getprofessionalDetails([{}])
      expect(result).toEqual({ designation: '' })
    })
  })
})
