import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { CourseApiService } from './course-api.service'
import { Course, CourseSearchResponse } from '../models/course.model'

describe('CourseApiService', () => {
    let service: CourseApiService
    let httpMock: HttpTestingController
    const API_BASE = '/apis/proxies/v8/sunbirdigot/search'

    const mockCourse: Course = {
        identifier: 'do_123',
        name: 'Intro Course',
        sourceName: 'Provider A',
        primaryCategory: 'Course',
        status: 'Live',
        lang: 'en',
        createdOn: '2024-01-01',
    }

    const mockResponse: CourseSearchResponse = {
        result: {
            content: [mockCourse],
            count: 1,
        },
    }

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [CourseApiService],
        })
        service = TestBed.inject(CourseApiService)
        httpMock = TestBed.inject(HttpTestingController)
    })

    afterEach(() => {
        httpMock.verify()
    })

    it('should be created', () => {
        expect(service).toBeTruthy()
    })

    describe('searchCourses', () => {
        it('should POST to API_BASE with lang filter and default pagination', () => {
            service.searchCourses('en').subscribe(result => {
                expect(result.courses).toEqual([mockCourse])
                expect(result.totalCount).toBe(1)
            })

            const req = httpMock.expectOne(API_BASE)
            expect(req.request.method).toBe('POST')
            expect(req.request.body.request.limit).toBe(20)
            expect(req.request.body.request.offset).toBe(0)
            expect(req.request.body.request.filters.primaryCategory).toEqual(['Course'])
            expect(req.request.body.request.filters.status).toEqual(['Live'])
            expect(req.request.body.request.filters.competency).toBe(false)
            expect(req.request.body.request.filters.lang).toEqual(['en', 'english'])
            req.flush(mockResponse)
        })

        it('should support custom limit/offset', () => {
            service.searchCourses('hi', 50, 10).subscribe()

            const req = httpMock.expectOne(API_BASE)
            expect(req.request.body.request.limit).toBe(50)
            expect(req.request.body.request.offset).toBe(10)
            expect(req.request.body.request.filters.lang).toEqual(['hi', 'hindi'])
            req.flush(mockResponse)
        })

        it('should omit lang filter when language is empty', () => {
            service.searchCourses('').subscribe()

            const req = httpMock.expectOne(API_BASE)
            expect(req.request.body.request.filters.lang).toBeUndefined()
            req.flush(mockResponse)
        })

        it('should default missing content/count to empty/zero', () => {
            service.searchCourses('en').subscribe(result => {
                expect(result.courses).toEqual([])
                expect(result.totalCount).toBe(0)
            })

            const req = httpMock.expectOne(API_BASE)
            req.flush({ result: {} })
        })
    })

    describe('searchCoursesByCompetency', () => {
        it('should POST with competency-based level filters', () => {
            service.searchCoursesByCompetency('100', 'en').subscribe(result => {
                expect(result.courses).toEqual([mockCourse])
                expect(result.totalCount).toBe(1)
            })

            const req = httpMock.expectOne(API_BASE)
            expect(req.request.method).toBe('POST')
            expect(req.request.body.request.filters.competencySearch).toEqual([
                '100-1', '100-2', '100-3', '100-4', '100-5',
            ])
            expect(req.request.body.request.filters.primaryCategory).toEqual(['Course'])
            expect(req.request.body.request.exists).toEqual(['competencies_v1'])
            req.flush(mockResponse)
        })
    })

    describe('buildCompetencySearchRequest', () => {
        it('should build payload with 5 levels and expanded lang filter', () => {
            const payload = service.buildCompetencySearchRequest('200', 'hi')
            expect(payload.request.filters.competencySearch).toEqual([
                '200-1', '200-2', '200-3', '200-4', '200-5',
            ])
            expect(payload.request.filters.lang).toEqual(['hi', 'hindi'])
            expect(payload.request.exists).toEqual(['competencies_v1'])
            expect(payload.request.fields).toEqual(['name', 'sourceName', 'competencies_v1', 'competencySearch'])
        })

        it('should omit lang when language is empty', () => {
            const payload = service.buildCompetencySearchRequest('200', '')
            expect(payload.request.filters.lang).toBeUndefined()
        })
    })

    describe('searchCoursesByMultipleCompetencies', () => {
        it('should build competencySearch for all ids and levels', () => {
            service.searchCoursesByMultipleCompetencies(['100', '200'], 'en').subscribe(result => {
                expect(result.courses).toEqual([mockCourse])
            })

            const req = httpMock.expectOne(API_BASE)
            expect(req.request.body.request.filters.competencySearch).toEqual([
                '100-1', '100-2', '100-3', '100-4', '100-5',
                '200-1', '200-2', '200-3', '200-4', '200-5',
            ])
            expect(req.request.body.request.limit).toBe(9999)
            req.flush(mockResponse)
        })
    })

    describe('parseCompetencyLevels', () => {
        it('should parse valid JSON competencies_v1', () => {
            const course: Course = { ...mockCourse, competencies_v1: '[{"competencyName":"Pregnancy","competencyId":"100","level":"1"}]' }
            const result = service.parseCompetencyLevels(course)
            expect(result).toEqual([{ competencyName: 'Pregnancy', competencyId: '100', level: '1' }])
        })

        it('should return empty array when competencies_v1 is missing', () => {
            expect(service.parseCompetencyLevels(mockCourse)).toEqual([])
        })

        it('should return empty array on invalid JSON', () => {
            const course: Course = { ...mockCourse, competencies_v1: 'not-json' }
            expect(service.parseCompetencyLevels(course)).toEqual([])
        })

        it('should return empty array when JSON is not an array', () => {
            const course: Course = { ...mockCourse, competencies_v1: '{"foo":"bar"}' }
            expect(service.parseCompetencyLevels(course)).toEqual([])
        })
    })

    describe('filterCoursesByLevel', () => {
        it('should match by competencies_v1 field', () => {
            const course: Course = { ...mockCourse, competencies_v1: '[{"competencyName":"X","competencyId":"100","level":"1"}]' }
            const result = service.filterCoursesByLevel([course], '100', 1)
            expect(result).toEqual([course])
        })

        it('should fall back to competencySearch tags', () => {
            const course: Course = { ...mockCourse, competencySearch: ['100-1'] }
            const result = service.filterCoursesByLevel([course], '100', 1)
            expect(result).toEqual([course])
        })

        it('should exclude non-matching courses', () => {
            const course: Course = { ...mockCourse, competencySearch: ['200-1'] }
            const result = service.filterCoursesByLevel([course], '100', 1)
            expect(result).toEqual([])
        })
    })

    describe('filterCourses', () => {
        it('should return all courses when searchTerm is empty', () => {
            expect(service.filterCourses([mockCourse], '')).toEqual([mockCourse])
            expect(service.filterCourses([mockCourse], '   ')).toEqual([mockCourse])
        })

        it('should filter by name', () => {
            expect(service.filterCourses([mockCourse], 'intro')).toEqual([mockCourse])
        })

        it('should filter by sourceName', () => {
            expect(service.filterCourses([mockCourse], 'provider')).toEqual([mockCourse])
        })

        it('should filter by identifier', () => {
            expect(service.filterCourses([mockCourse], 'do_123')).toEqual([mockCourse])
        })

        it('should return empty when no match', () => {
            expect(service.filterCourses([mockCourse], 'nomatch')).toEqual([])
        })
    })

    describe('loadAllCourses', () => {
        it('should resolve to courses array', async () => {
            const promise = service.loadAllCourses('en')

            const req = httpMock.expectOne(API_BASE)
            req.flush(mockResponse)

            const result = await promise
            expect(result).toEqual([mockCourse])
        })

        it('should resolve to empty array when no courses returned', async () => {
            const promise = service.loadAllCourses('en')

            const req = httpMock.expectOne(API_BASE)
            req.flush({ result: {} })

            const result = await promise
            expect(result).toEqual([])
        })
    })

    describe('searchCoursesByIds', () => {
        it('should return empty observable when no ids given', done => {
            service.searchCoursesByIds([]).subscribe(result => {
                expect(result).toEqual({ courses: [], totalCount: 0 })
                done()
            })
            httpMock.expectNone(API_BASE)
        })

        it('should POST filters by trimmed identifiers', () => {
            service.searchCoursesByIds([' do_123 ', 'do_456']).subscribe(result => {
                expect(result.courses).toEqual([mockCourse])
                expect(result.totalCount).toBe(1)
            })

            const req = httpMock.expectOne(API_BASE)
            expect(req.request.body.request.filters.identifier).toEqual(['do_123', 'do_456'])
            expect(req.request.body.request.limit).toBe(12)
            req.flush(mockResponse)
        })

        it('should filter out blank identifiers', () => {
            service.searchCoursesByIds(['  ', 'do_456']).subscribe()

            const req = httpMock.expectOne(API_BASE)
            expect(req.request.body.request.filters.identifier).toEqual(['do_456'])
            req.flush(mockResponse)
        })
    })
})
