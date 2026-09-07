import { UtilityService } from './utility.service'

describe('UtilityService', () => {
  let service: UtilityService

  beforeEach(() => {
    service = new UtilityService()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getFormatedRequest', () => {
    it('should return empty array when data is null', () => {
      expect(service.getFormatedRequest(null)).toEqual([])
    })

    it('should return empty array when data.content is missing', () => {
      expect(service.getFormatedRequest({})).toEqual([])
    })

    it('should return empty array when data.content length is 0', () => {
      expect(service.getFormatedRequest({ content: [] })).toEqual([])
    })

    it('should process users with profileDetails and professionalDetails present', () => {
      const data = {
        content: [
          {
            isDeleted: false,
            firstName: 'John',
            lastName: 'Doe',
            id: 'u1',
            blocked: false,
            personalDetails: { primaryEmail: 'john@doe.com' },
            profileDetails: {
              profileReq: {
                professionalDetails: [{ designation: 'Manager' }],
                personalDetails: { postalAddress: 'India,Karnataka,Bengaluru' },
              },
            },
          },
        ],
      }
      const result = service.getFormatedRequest(data)
      expect(result.length).toBe(1)
      expect(result[0].fullName).toBe('John Doe')
      expect(result[0].email).toBe('john@doe.com')
      expect(result[0].userId).toBe('u1')
      expect(result[0].active).toBe(true)
      expect(result[0].designation).toBe('Manager')
      expect(result[0].state).toBe('Karnataka')
      expect(result[0].city).toBe('Bengaluru')
    })

    it('should fall back to user.email when personalDetails.primaryEmail is absent', () => {
      const data = {
        content: [
          {
            isDeleted: false,
            firstName: 'Jane',
            lastName: 'Smith',
            id: 'u2',
            blocked: true,
            email: 'jane@fallback.com',
          },
        ],
      }
      const result = service.getFormatedRequest(data)
      expect(result[0].email).toBe('jane@fallback.com')
      expect(result[0].designation).toBe('')
      expect(result[0].state).toBe('')
      expect(result[0].city).toBe('')
      expect(result[0].active).toBe(true)
      expect(result[0].blocked).toBe(true)
    })

    it('should handle falsy user (null fullName branch)', () => {
      // filter with isDeleted false excludes falsy entries unless it matches predicate;
      // lodash filter on a plain object won't match {isDeleted:false} predicate, so this covers ternary via a deleted:false object with no name
      const data = {
        content: [
          { isDeleted: false, firstName: undefined, lastName: undefined, id: 'u3', email: 'x@x.com' },
        ],
      }
      const result = service.getFormatedRequest(data)
      expect(result[0].fullName).toBe('undefined undefined')
    })

    it('should skip users with isDeleted true', () => {
      const data = {
        content: [
          { isDeleted: true, firstName: 'Skip', lastName: 'Me', id: 'u4' },
        ],
      }
      const result = service.getFormatedRequest(data)
      expect(result.length).toBe(0)
    })
  })

  describe('getprofessionalDetails', () => {
    it('should return empty object when data is null', () => {
      expect(service.getprofessionalDetails(null)).toEqual({})
    })

    it('should return empty object when data length is 0', () => {
      expect(service.getprofessionalDetails([])).toEqual({})
    })

    it('should set designation when present', () => {
      const result = service.getprofessionalDetails([{ designation: 'Lead' }])
      expect(result.designation).toBe('Lead')
    })

    it('should set designation to empty string when absent', () => {
      const result = service.getprofessionalDetails([{}])
      expect(result.designation).toBe('')
    })
  })

  describe('getPostalAdress', () => {
    it('should return empty object when data is null', () => {
      expect(service.getPostalAdress(null)).toEqual({})
    })

    it('should return empty object when postalAddress is missing', () => {
      expect(service.getPostalAdress({})).toEqual({})
    })

    it('should split postalAddress into country, state, city', () => {
      const result = service.getPostalAdress({ postalAddress: 'India,Karnataka,Bengaluru' })
      expect(result.country).toBe('India')
      expect(result.state).toBe('Karnataka')
      expect(result.city).toBe('Bengaluru')
    })
  })
})
