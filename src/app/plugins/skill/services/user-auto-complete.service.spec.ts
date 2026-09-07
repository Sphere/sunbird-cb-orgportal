import { TestBed } from '@angular/core/testing'
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing'
import { UserAutoCompleteService } from './user-auto-complete.service'

describe('UserAutoCompleteService', () => {
  let service: UserAutoCompleteService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserAutoCompleteService],
    })
    service = TestBed.inject(UserAutoCompleteService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('fetchAutoComplete', () => {
    it('should query the autocomplete endpoint and return the response body', () => {
      let result: any
      service.fetchAutoComplete('jdoe').subscribe(res => (result = res))

      const req = httpMock.expectOne(
        r => r.url === '/apis/protected/v8/autoCompletev2/getUserDetails',
      )
      expect(req.request.method).toBe('GET')
      expect(req.request.params.get('details')).toBe('jdoe')
      req.flush({ result: { response: [{ id: 'u1' }] } })

      expect(result).toEqual([{ id: 'u1' }])
    })
  })

  describe('getStringifiedQueryParams', () => {
    it('should join truthy entries as key=value pairs', () => {
      const result = service.getStringifiedQueryParams({ a: 1, b: 'x', c: undefined, d: '' })
      expect(result).toBe('a=1&b=x')
    })

    it('should return an empty string when nothing is truthy', () => {
      expect(service.getStringifiedQueryParams({ a: undefined, b: '' })).toBe('')
    })
  })

  describe('fetchUserList', () => {
    it('should fetch and format the user list', () => {
      let result: any
      service.fetchUserList('jdoe').subscribe(res => (result = res))

      const req = httpMock.expectOne(
        r => r.url === '/apis/protected/v8/autoCompletev2/getUserDetails',
      )
      req.flush({
        result: {
          response: {
            content: [
              {
                id: 'u1',
                isDeleted: false,
                blocked: false,
                profileDetails: {
                  profileReq: {
                    personalDetails: {
                      firstname: 'John',
                      lastname: 'Doe',
                      primaryEmail: 'john@example.com',
                      postalAddress: 'India,Karnataka,Bengaluru',
                    },
                    professionalDetails: [{ designation: 'Engineer' }],
                  },
                },
              },
            ],
          },
        },
      })

      expect(result).toEqual([
        {
          fullName: 'John Doe',
          email: 'john@example.com',
          userId: 'u1',
          active: true,
          blocked: false,
          designation: 'Engineer',
          state: 'Karnataka',
          city: 'Bengaluru',
        },
      ])
    })
  })

  describe('getFormatedRequest', () => {
    it('should return an empty array when there is no content', () => {
      expect(service.getFormatedRequest(null)).toEqual([])
      expect(service.getFormatedRequest({ content: [] })).toEqual([])
    })

    it('should exclude deleted users', () => {
      const result = service.getFormatedRequest({
        content: [{ id: 'u1', isDeleted: true }],
      })
      expect(result).toEqual([])
    })

    it('should fall back to the top-level email when personal details are missing', () => {
      const result = service.getFormatedRequest({
        content: [{ id: 'u2', isDeleted: false, email: 'fallback@example.com' }],
      })

      expect(result).toEqual([
        {
          fullName: ' ',
          email: 'fallback@example.com',
          userId: 'u2',
          active: true,
          blocked: null,
          designation: '',
          state: '',
          city: '',
        },
      ])
    })
  })

  describe('getprofessionalDetails', () => {
    it('should return an empty object when data is missing or empty', () => {
      expect(service.getprofessionalDetails(null)).toEqual({})
      expect(service.getprofessionalDetails([])).toEqual({})
    })

    it('should extract designation from the entries', () => {
      expect(service.getprofessionalDetails([{ designation: 'Lead' }])).toEqual({
        designation: 'Lead',
      })
    })
  })

  describe('getPostalAdress', () => {
    it('should return an empty object when postalAddress is missing', () => {
      expect(service.getPostalAdress({})).toEqual({})
    })

    it('should split a comma-separated postal address into country/state/city', () => {
      const result = service.getPostalAdress({ postalAddress: 'India,Karnataka,Bengaluru' })
      expect(result).toEqual({
        country: 'India',
        state: 'Karnataka',
        city: 'Bengaluru',
      })
    })
  })
})
