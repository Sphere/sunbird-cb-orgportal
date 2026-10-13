import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing'

import { CompetencyService } from './competency.service'

describe('CompetencyService', () => {
  let service: CompetencyService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
    service = TestBed.inject(CompetencyService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('getAllEntity should post to the endpoint', () => {
    service.getAllEntity({ q: 1 }).subscribe()
    const req = httpMock.expectOne('/apis/protected/v8/entityCompetency/getAllEntity')
    expect(req.request.method).toBe('POST')
    req.flush({})
  })

  it('updatePassbook should patch to the endpoint', () => {
    service.updatePassbook({ q: 1 }).subscribe()
    const req = httpMock.expectOne('/apis/proxies/v8/user/v1/passbook')
    expect(req.request.method).toBe('PATCH')
    req.flush({})
  })

  it('getUserPassbook should post to the endpoint', () => {
    service.getUserPassbook({ q: 1 }).subscribe()
    const req = httpMock.expectOne('/apis/proxies/v8/user/v1/admin/passbook')
    expect(req.request.method).toBe('POST')
    req.flush({})
  })

  describe('getFormatedData', () => {
    it('should return formatted data when response array is non-empty', () => {
      const data = {
        result: {
          response: [
            {
              id: '1', name: 'Comp1', type: 'core', additionalProperties: {}, isActive: true,
              levelId: 'l1', level: 1,
            },
          ],
        },
      }
      const result = service.getFormatedData(data)
      expect(result).toEqual([
        {
          value: '1', displayName: 'Comp1', type: 'core', additionalProperties: {},
          isActive: true, levelId: 'l1', level: 1,
        },
      ])
    })

    it('should return empty array when response is empty', () => {
      const result = service.getFormatedData({ result: { response: [] } })
      expect(result).toEqual([])
    })

    it('should return empty array when data is missing result.response', () => {
      const result = service.getFormatedData({})
      expect(result).toEqual([])
    })
  })

  describe('formatedUserCompetency', () => {
    it('should build response when passbook has matching competency', () => {
      const entity = [{ id: 'c1' }]
      const passbook = [
        {
          competencies: {
            c1: {
              acquiredDetails: [{ competencyName: 'Comp1', acquiredChannel: 'course', competencyLevelId: 'l1' }],
              competencyId: 'c1',
            },
          },
        },
      ]
      const result = service.formatedUserCompetency(entity, passbook)
      expect(result.length).toBe(1)
      expect(result[0].competencyId).toBe('c1')
    })

    it('should return empty array when no competency matches', () => {
      const entity = [{ id: 'c1' }]
      const passbook = [{ competencies: { c2: {} } }]
      const result = service.formatedUserCompetency(entity, passbook)
      expect(result).toEqual([])
    })
  })

  describe('acquiredPassbookLogs', () => {
    it('should return empty array when acquiredDetails is empty', () => {
      expect(service.acquiredPassbookLogs([])).toEqual([])
    })

    it('should map acquiredDetails with acquiredChannel present', () => {
      const result = service.acquiredPassbookLogs([
        {
          acquiredChannel: 'admin',
          createdDate: '2024-01-01',
          competencyLevelId: 'l3',
          additionalParams: { remarks: 'note' },
        },
      ])
      expect(result[0]).toEqual({
        source: 'admin',
        date: '2024-01-01',
        level: 'Level 3',
        color: '#A4DFCA',
        remarks: 'note',
      })
    })

    it('should default source to empty string when acquiredChannel missing', () => {
      const result = service.acquiredPassbookLogs([
        { createdDate: '2024-01-01', competencyLevelId: 'l1' },
      ])
      expect(result[0].source).toBe('')
    })
  })

  describe('acauiredChannelColourCode', () => {
    it('should mark the matching level as selected with correct color', () => {
      const result = service.acauiredChannelColourCode([
        { acquiredChannel: 'selfAssessment', competencyLevelId: 'l2' },
      ])
      const level2 = result.find((r: any) => r.displayLevel === '2')
      expect(level2.selected).toBe(true)
      expect(level2.color).toBe('#7CB5E6')
    })

    it('should leave all levels unselected when no match', () => {
      const result = service.acauiredChannelColourCode([])
      expect(result.every((r: any) => r.selected === false)).toBe(true)
    })
  })

  describe('getColor', () => {
    it('should return color for course channel', () => {
      expect(service.getColor('course')).toBe('#FFFBB0')
    })

    it('should return color for selfAssessment channel', () => {
      expect(service.getColor('selfAssessment')).toBe('#7CB5E6')
    })

    it('should return color for admin channel', () => {
      expect(service.getColor('admin')).toBe('#A4DFCA')
    })

    it('should return default color for unknown channel', () => {
      expect(service.getColor('unknown')).toBe('#FFFBB0')
    })
  })
})
