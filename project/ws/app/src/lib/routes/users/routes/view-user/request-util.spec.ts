import {
  checkvalue,
  getDateFromText,
  getClass10,
  getClass12,
  getDegree,
  getPostDegree,
  getOrganisationsHistory,
  populateAcademics,
  constructReq,
} from './request-util'

describe('request-util', () => {
  describe('checkvalue', () => {
    it('should return undefined when value is the literal string "undefined" (no explicit return in that branch)', () => {
      expect(checkvalue('undefined')).toBeUndefined()
    })

    it('should return the value unchanged for any other truthy value', () => {
      expect(checkvalue('hello')).toBe('hello')
    })

    it('should return the value unchanged for a falsy value', () => {
      expect(checkvalue('')).toBe('')
    })
  })

  describe('getDateFromText', () => {
    it('should convert a dd-mm-yyyy string into a Date', () => {
      const result = getDateFromText('15-06-2020')
      expect(result).toBeInstanceOf(Date)
      expect((result as Date).toISOString().startsWith('2020-06-15')).toBe(true)
    })

    it('should return an empty string for a falsy input', () => {
      expect(getDateFromText('')).toBe('')
    })
  })

  describe('getClass10', () => {
    it('should use form-provided school name/year when courseDegree is set', () => {
      const result = getClass10({ courseDegree: true, schoolName10: 'ABC School', yop10: '2010' }, { academics: [] })
      expect(result).toEqual({
        nameOfQualification: '',
        type: 'X_STANDARD',
        nameOfInstitute: 'ABC School',
        yearOfPassing: '2010',
      })
    })

    it('should fall back to existing academic record when courseDegree is not set', () => {
      const userProfileData = {
        academics: [{ type: 'X_STANDARD', nameOfInstitute: 'Old School', yearOfPassing: '2005' }],
      }
      const result = getClass10({}, userProfileData)
      expect(result).toEqual({
        nameOfQualification: '',
        type: 'X_STANDARD',
        nameOfInstitute: 'Old School',
        yearOfPassing: '2005',
      })
    })

    it('should default to empty strings when nothing is available', () => {
      const result = getClass10({}, { academics: [] })
      expect(result).toEqual({
        nameOfQualification: '',
        type: 'X_STANDARD',
        nameOfInstitute: '',
        yearOfPassing: '',
      })
    })
  })

  describe('getClass12', () => {
    it('should use form-provided values when courseDegree is set', () => {
      const result = getClass12({ courseDegree: true, schoolName12: 'XII School', yop12: '2012' }, { academics: [] })
      expect(result).toEqual({
        nameOfQualification: '',
        type: 'XII_STANDARD',
        nameOfInstitute: 'XII School',
        yearOfPassing: '2012',
      })
    })
  })

  describe('getDegree', () => {
    it('should use form-provided degree details when courseDegree is set', () => {
      const result = getDegree(
        { courseDegree: true, degreeName: 'B.Tech', degreeInstitute: 'XYZ University', yopDegree: '2015' },
        { academics: [] },
      )
      expect(result).toEqual({
        nameOfQualification: 'B.Tech',
        type: 'GRADUATE',
        nameOfInstitute: 'XYZ University',
        yearOfPassing: '2015',
      })
    })

    it('should fall back to existing GRADUATE academic record', () => {
      const userProfileData = {
        academics: [
          { type: 'GRADUATE', nameOfQualification: 'B.Sc', nameOfInstitute: 'Old University', yearOfPassing: '2008' },
        ],
      }
      const result = getDegree({}, userProfileData)
      expect(result).toEqual({
        nameOfQualification: 'B.Sc',
        type: 'GRADUATE',
        nameOfInstitute: 'Old University',
        yearOfPassing: '2008',
      })
    })
  })

  describe('getPostDegree', () => {
    it('should use form-provided post-degree details when courseDegree is set', () => {
      const result = getPostDegree(
        { courseDegree: true, postDegreeName: 'M.Tech', postDegreeInstitute: 'PG University', yopPostDegree: '2018' },
        { academics: [] },
      )
      expect(result).toEqual({
        nameOfQualification: 'M.Tech',
        type: 'POSTGRADUATE',
        nameOfInstitute: 'PG University',
        yearOfPassing: '2018',
      })
    })

    it('should fall back to existing POSTGRADUATE academic record', () => {
      const userProfileData = {
        academics: [
          { type: 'POSTGRADUATE', nameOfQualification: 'M.Sc', nameOfInstitute: 'Old PG University', yearOfPassing: '2011' },
        ],
      }
      const result = getPostDegree({}, userProfileData)
      expect(result).toEqual({
        nameOfQualification: 'M.Sc',
        type: 'POSTGRADUATE',
        nameOfInstitute: 'Old PG University',
        yearOfPassing: '2011',
      })
    })
  })

  describe('populateAcademics', () => {
    it('should map academics array entries by type when present on the data object', () => {
      const data = {
        academics: [
          { type: 'X_STANDARD', nameOfInstitute: 'School A', yearOfPassing: '2000' },
          { type: 'GRADUATE', nameOfInstitute: 'College B', yearOfPassing: '2010' },
          { type: 'UNKNOWN_TYPE', nameOfInstitute: 'Ignored', yearOfPassing: '2099' },
        ],
      }
      const result = populateAcademics(data)
      expect(result).toEqual([
        { nameOfQualification: '', type: 'X_STANDARD', nameOfInstitute: 'School A', yearOfPassing: '2000' },
        { nameOfQualification: '', type: 'GRADUATE', nameOfInstitute: 'College B', yearOfPassing: '2010' },
      ])
    })

    it('should build all four academic levels from userProfileData when data.academics is absent', () => {
      const userProfileData = { academics: [] }
      const result = populateAcademics({}, userProfileData)
      expect(result).toHaveLength(4)
      expect(result.map((r: any) => r.type)).toEqual(['X_STANDARD', 'XII_STANDARD', 'GRADUATE', 'POSTGRADUATE'])
    })
  })

  describe('getOrganisationsHistory', () => {
    it('should build a single organisation entry from form values when provided', () => {
      const form = {
        orgType: 'Government',
        designation: 'Officer',
        profession: 'Nurse',
        location: 'City',
        doj: '2020-01-01',
        block: 'Block A',
        subcentre: 'Sub A',
        orgName: 'Org Name',
      }
      const [org] = getOrganisationsHistory(form, {})
      expect(org.orgType).toBe('Government')
      expect(org.designation).toBe('Officer')
      expect(org.profession).toBe('Nurse')
      expect(org.location).toBe('City')
      expect(org.doj).toBe('2020-01-01')
    })

    it('should fall back to the first professionalDetails entry when form fields are missing', () => {
      const userProfileData = {
        professionalDetails: [
          { orgTyp: 'Private', designation: 'Manager', profession: 'Admin', location: 'Town', doj: '2019-01-01', block: 'B1', subcentre: 'S1' },
        ],
      }
      const [org] = getOrganisationsHistory({}, userProfileData)
      expect(org.orgType).toBe('Private')
      expect(org.designation).toBe('Manager')
      expect(org.profession).toBe('Admin')
      expect(org.location).toBe('Town')
    })
  })

  describe('constructReq', () => {
    it('should build a full profile request, preferring form values over existing profile data', () => {
      const userProfileData = {
        personalDetails: {
          firstname: 'Old',
          middlename: '',
          surname: 'Name',
          about: '',
          photo: '',
          dob: '',
          nationality: '',
          domicileMedium: '',
          regNurseRegMidwifeNumber: '',
          gender: '',
          maritalStatus: '',
          knownLanguages: [],
          mobile: '',
          telephone: '',
          primaryEmail: 'old@example.com',
          postalAddress: '',
          pincode: '',
          osName: '',
          browserName: '',
          userCookie: '',
        },
        nationalUniqueId: '',
        doctorRegNumber: '',
        instituteName: '',
        nursingCouncil: '',
        category: '',
        countryCode: '',
        // populateAcademics(userProfileData) is called with a single arg when
        // form.courseDegree is unset, so its internal fallback branch (which
        // reads a second, unpassed userProfileData argument) is unreachable
        // unless academics is empty; give it entries so it takes the
        // map-by-type branch instead.
        academics: [{ type: 'GRADUATE', nameOfInstitute: 'Test University', yearOfPassing: '2015' }],
        employmentDetails: {},
        professionalDetails: [{}],
      }

      const form = { firstname: 'New', surname: 'User' }
      const userAgent = { OS: 'iOS', browserName: 'Safari' }

      const result = constructReq('user-1', form, userProfileData, userAgent, 'cookie-value')
      expect(result.profileReq.id).toBe('user-1')
      expect(result.profileReq.userId).toBe('user-1')
      expect(result.profileReq.personalDetails.firstname).toBe('New')
      expect(result.profileReq.personalDetails.surname).toBe('User')
      expect(result.profileReq.personalDetails.primaryEmail).toBe('old@example.com')
    })
  })
})
