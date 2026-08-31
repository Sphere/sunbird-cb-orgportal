import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { CompetencyApiService } from './competency-api.service'

describe('CompetencyApiService', () => {
  let service: CompetencyApiService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CompetencyApiService],
    })
    service = TestBed.inject(CompetencyApiService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getCompetencyListByLanguage', () => {
    it('maps entity search response with levels into RawCompetencyEntity[]', () => {
      let result: any
      service.getCompetencyListByLanguage('en').subscribe(r => (result = r))
      const req = httpMock.expectOne('/apis/proxies/v8/entity/v1/search')
      expect(req.request.body.language).toBe('en')
      req.flush({
        result: {
          entity: [
            {
              entityId: 'e1',
              code: 'C1',
              name: ' Comp One ',
              description: ' desc ',
              type: 'Domain',
              status: 'Active',
              area: 'Area1',
              languageCode: 'en',
              levels: [{ levelNumber: 1, levelName: ' L1 ', levelDescription: ' d1 ' }],
              additionalProperties: { parentCompetency: 'x' },
              createdAt: '2020',
              createdBy: 'u1',
              updatedAt: '2021',
              updatedBy: 'u2',
            },
          ],
        },
      })
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'e1',
        name: 'Comp One',
        description: 'desc',
        code: 'C1',
        language: 'en',
      })
      expect(result[0].children).toHaveLength(1)
      expect(result[0].children[0]).toMatchObject({
        code: 'C1_L1',
        level: 'L1',
        levelId: 1,
        name: 'L1',
        description: 'd1',
      })
    })

    it('handles empty/missing result gracefully', () => {
      let result: any
      service.getCompetencyListByLanguage().subscribe(r => (result = r))
      const req = httpMock.expectOne('/apis/proxies/v8/entity/v1/search')
      req.flush({})
      expect(result).toEqual([])
    })

    it('falls back to entity.id and defaults when fields are missing', () => {
      let result: any
      service.getCompetencyListByLanguage('fr').subscribe(r => (result = r))
      const req = httpMock.expectOne('/apis/proxies/v8/entity/v1/search')
      req.flush({ result: { entity: [{ id: 5 }] } })
      expect(result[0].id).toBe(5)
      expect(result[0].language).toBe('fr')
      expect(result[0].status).toBe('Active')
      expect(result[0].entityType).toBe('Domain')
      expect(result[0].children).toEqual([])
    })
  })

  describe('searchCompetencies', () => {
    it('sends query when provided and trims it', () => {
      service.searchCompetencies('  test  ', 50).subscribe()
      const req = httpMock.expectOne('/apis/proxies/v8/entity/v1/search')
      expect(req.request.body.request.entity.query).toEqual({ name: 'test' })
      expect(req.request.body.request.entity.limit).toBe(50)
      req.flush({ result: { entity: [] } })
    })

    it('omits query when blank/undefined', () => {
      service.searchCompetencies('   ').subscribe()
      const req = httpMock.expectOne('/apis/proxies/v8/entity/v1/search')
      expect(req.request.body.request.entity.query).toBeUndefined()
      req.flush({ result: { entity: [] } })
    })

    it('maps entity with children array into Competency', () => {
      let result: any
      service.searchCompetencies().subscribe(r => (result = r))
      const req = httpMock.expectOne('/apis/proxies/v8/entity/v1/search')
      req.flush({
        result: {
          entity: [
            {
              id: 1,
              code: 'C1',
              name: 'Comp',
              description: 'd',
              type: 'competency',
              status: 'Active',
              children: [{ levelId: 2, name: 'Lvl2', description: 'ld' }, { level: 'L3', name: 'Lvl3' }],
            },
          ],
        },
      })
      expect(result[0].levels).toEqual([
        { level: 2, name: 'Lvl2', description: 'ld' },
        { level: 3, name: 'Lvl3', description: undefined },
      ])
    })

    it('maps entity with competencyLevelDescription JSON string (legacy format)', () => {
      let result: any
      service.searchCompetencies().subscribe(r => (result = r))
      const req = httpMock.expectOne('/apis/proxies/v8/entity/v1/search')
      req.flush({
        result: {
          entity: [
            {
              id: 2,
              additionalProperties: {
                Code: 'C2',
                competencyLevelDescription: JSON.stringify([{ level: '1', name: 'L1', description: 'desc1' }]),
              },
            },
          ],
        },
      })
      expect(result[0].code).toBe('C2')
      expect(result[0].levels).toEqual([{ level: 1, name: 'L1', description: 'desc1' }])
    })

    it('handles unparseable competencyLevelDescription string gracefully', () => {
      let result: any
      service.searchCompetencies().subscribe(r => (result = r))
      const req = httpMock.expectOne('/apis/proxies/v8/entity/v1/search')
      req.flush({
        result: {
          entity: [
            { id: 3, additionalProperties: { competencyLevelDescription: 'not-json' } },
          ],
        },
      })
      expect(result[0].levels).toEqual([])
    })

    it('handles competencyLevelDescription already as array', () => {
      let result: any
      service.searchCompetencies().subscribe(r => (result = r))
      const req = httpMock.expectOne('/apis/proxies/v8/entity/v1/search')
      req.flush({
        result: {
          entity: [
            {
              id: 4,
              additionalProperties: { competencyLevelDescription: [{ level: 2, name: 'L2' }] },
            },
          ],
        },
      })
      expect(result[0].levels).toEqual([{ level: 2, name: 'L2', description: undefined }])
    })

    it('falls back to no levels and generated code when nothing matches', () => {
      let result: any
      service.searchCompetencies().subscribe(r => (result = r))
      const req = httpMock.expectOne('/apis/proxies/v8/entity/v1/search')
      req.flush({ result: { entity: [{ id: 9 }] } })
      expect(result[0].levels).toEqual([])
      expect(result[0].code).toBe('C9')
    })
  })
})
