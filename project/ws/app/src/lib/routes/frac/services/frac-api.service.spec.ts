import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { FracApiService } from './frac-api.service'

describe('FracApiService', () => {
  let service: FracApiService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        FracApiService,
        {
          provide: ConfigurationsService,
          useValue: {
            userProfile: { userId: 'test-user' },
            instanceConfig: {
              frac: {
                api: {
                  endpoints: {
                    searchEntity: '/custom/search',
                    uploadEntity: '/custom/upload',
                  },
                },
              },
            },
          },
        },
      ],
    })

    service = TestBed.inject(FracApiService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should send typed search payload with mapped language and entity type', () => {
    service.searchEntities('activity', 'task', 'Hindi').subscribe((response) => {
      expect(response).toEqual({ result: { entity: [] } })
    })

    const req = httpMock.expectOne('/custom/search')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual({
      entityType: 'Activity',
      language: 'hi',
      query: 'task',
      strict: 'false',
      field: ['code', 'name'],
    })

    req.flush({ result: { entity: [] } })
  })

  it('should parse upload text response JSON payload', () => {
    service.uploadFile(new File(['id'], 'activity.csv'), 'English').subscribe((response: any) => {
      expect(response.responseCode).toBe('OK')
      expect(response.result.entity[0].entityCode).toEqual(['ACT_01'])
    })

    const req = httpMock.expectOne('/custom/upload')
    expect(req.request.method).toBe('POST')
    expect(req.request.responseType).toBe('text')

    req.flush(
      JSON.stringify({
        responseCode: 'OK',
        result: {
          entity: [{ entityType: 'activity', entityCode: ['ACT_01'] }],
        },
      }),
      { status: 200, statusText: 'OK' },
    )
  })

  it('should keep upload text payload when response is non-json', () => {
    service.uploadFile(new File(['id'], 'activity.csv'), 'English').subscribe((response) => {
      expect(response).toBe('upstream plain-text error')
    })

    const req = httpMock.expectOne('/custom/upload')
    req.flush('upstream plain-text error', { status: 200, statusText: 'OK' })
  })
})
