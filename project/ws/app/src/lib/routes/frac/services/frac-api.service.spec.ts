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

    const req = httpMock.expectOne(r => r.url === '/custom/upload')
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

    const req = httpMock.expectOne(r => r.url === '/custom/upload')
    req.flush('upstream plain-text error', { status: 200, statusText: 'OK' })
  })

  it('should keep non-string response body as-is on upload (non-json branch)', () => {
    service.uploadFile(new File(['id'], 'a.csv')).subscribe((response: any) => {
      expect(response).toEqual({ some: 'obj' })
    })
    const req = httpMock.expectOne(r => r.url === '/custom/upload')
    // simulate a non-string body by flushing an object; angular testing keeps responseType text but flush accepts any
    req.flush({ some: 'obj' } as any, { status: 200, statusText: 'OK' })
  })

  it('should wrap a non-array payload into an array and use passed userId for updateEntity', () => {
    service.updateEntity({ id: '1' } as any, 'explicit-user').subscribe()
    const req = httpMock.expectOne(r => r.url.includes('updateEntity') || r.url.includes('update'))
    expect(req.request.body).toEqual([{ id: '1' }])
    expect(req.request.params.get('userId')).toBe('explicit-user')
    req.flush({})
  })

  it('should keep array payload as-is and derive userId when not passed for updateEntity', () => {
    service.updateEntity([{ id: '1' }, { id: '2' }] as any).subscribe()
    const req = httpMock.expectOne(() => true)
    expect(req.request.body).toEqual([{ id: '1' }, { id: '2' }])
    expect(req.request.params.get('userId')).toBe('test-user')
    req.flush({})
  })

  it('should send DELETE request for deleteEntity', () => {
    service.deleteEntity({ ids: ['1'] } as any).subscribe()
    const req = httpMock.expectOne(() => true)
    expect(req.request.method).toBe('DELETE')
    expect(req.request.body).toEqual({ ids: ['1'] })
    req.flush({})
  })

  it('should POST for mapEntity', () => {
    service.mapEntity({ parent: 'p' } as any).subscribe()
    const req = httpMock.expectOne(() => true)
    expect(req.request.method).toBe('POST')
    req.flush({})
  })

  it('should trim entityCode and map type/language for searchEntityMapping (default language branch)', () => {
    service.searchEntityMapping('role', '  R1  ').subscribe()
    const req = httpMock.expectOne(() => true)
    expect(req.request.body).toEqual({
      entityType: 'Role',
      entityCode: 'R1',
      entityLanguage: 'en',
    })
    req.flush({})
  })

  it('should handle empty entityCode for searchEntityMapping', () => {
    service.searchEntityMapping('position', undefined as any).subscribe()
    const req = httpMock.expectOne(() => true)
    expect(req.request.body.entityCode).toBe('')
    req.flush({})
  })

  it('should build hierarchy request body with mapped type/lang', () => {
    service.searchEntityHierarchy('competency', 'C1', 'Tamil').subscribe()
    const req = httpMock.expectOne(() => true)
    expect(req.request.body).toEqual({
      entityType: 'Competency',
      entityCode: 'C1',
      entityLanguage: 'ta',
    })
    req.flush({})
  })

  it('should default entityType to Competency for unknown mapEntityType input', () => {
    service.searchEntities('unknown-type' as any, 'kw').subscribe()
    const req = httpMock.expectOne(() => true)
    expect(req.request.body.entityType).toBe('Competency')
    req.flush({})
  })

  it('should default keyword and language for searchEntities', () => {
    service.searchEntities('role' as any).subscribe()
    const req = httpMock.expectOne(() => true)
    expect(req.request.body.query).toBe('')
    expect(req.request.body.language).toBe('en')
    req.flush({})
  })

  it('should pass through an already-coded language (mapLanguageToCode passthrough branch)', () => {
    service.searchEntities('activity' as any, 'kw', 'mr').subscribe()
    const req = httpMock.expectOne(() => true)
    expect(req.request.body.language).toBe('mr')
    req.flush({})
  })

  it('should use default language param for searchEntityHierarchy', () => {
    service.searchEntityHierarchy('role', 'R1').subscribe()
    const req = httpMock.expectOne(() => true)
    expect(req.request.body.entityLanguage).toBe('en')
    req.flush({})
  })

  it('should handle empty entityCode for searchEntityHierarchy (falsy branch)', () => {
    service.searchEntityHierarchy('role', '').subscribe()
    const req = httpMock.expectOne(() => true)
    expect(req.request.body.entityCode).toBe('')
    req.flush({})
  })

  it('should handle empty/undefined language in mapLanguageToCode (falsy branch)', () => {
    service.searchEntities('role' as any, 'kw', '').subscribe()
    const req = httpMock.expectOne(() => true)
    expect(req.request.body.language).toBe('')
    req.flush({})
  })

  it('should handle empty/undefined type in mapEntityType (falsy branch)', () => {
    service.searchEntities('' as any, 'kw').subscribe()
    const req = httpMock.expectOne(() => true)
    expect(req.request.body.entityType).toBe('Competency')
    req.flush({})
  })

  it('should treat a null response body as empty string (nullish-coalescing false branch)', () => {
    service.uploadFile(new File(['id'], 'a.csv')).subscribe((response: any) => {
      expect(response).toBe('')
    })
    const req = httpMock.expectOne(r => r.url === '/custom/upload')
    req.event({ type: 4, body: null } as any)
  })
})

describe('FracApiService - userProfile identifier fallbacks', () => {
  const makeService = (userProfile: any) => {
    TestBed.resetTestingModule()
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        FracApiService,
        { provide: ConfigurationsService, useValue: { userProfile, instanceConfig: {} } },
      ],
    })
    return {
      service: TestBed.inject(FracApiService),
      httpMock: TestBed.inject(HttpTestingController),
    }
  }

  it('should use userName when present', () => {
    const { service, httpMock } = makeService({ userName: 'uname', userId: 'uid', wid: 'w1' })
    service.updateEntity({} as any).subscribe()
    const req = httpMock.expectOne(() => true)
    expect(req.request.params.get('userId')).toBe('uname')
    req.flush({})
    httpMock.verify()
  })

  it('should fall back to userId when userName missing', () => {
    const { service, httpMock } = makeService({ userId: 'uid', wid: 'w1' })
    service.updateEntity({} as any).subscribe()
    const req = httpMock.expectOne(() => true)
    expect(req.request.params.get('userId')).toBe('uid')
    req.flush({})
    httpMock.verify()
  })

  it('should fall back to wid when userName and userId missing', () => {
    const { service, httpMock } = makeService({ wid: 'w1' })
    service.updateEntity({} as any).subscribe()
    const req = httpMock.expectOne(() => true)
    expect(req.request.params.get('userId')).toBe('w1')
    req.flush({})
    httpMock.verify()
  })

  it('should fall back to unknown-user when profile is empty', () => {
    const { service, httpMock } = makeService({})
    service.updateEntity({} as any).subscribe()
    const req = httpMock.expectOne(() => true)
    expect(req.request.params.get('userId')).toBe('unknown-user')
    req.flush({})
    httpMock.verify()
  })

  it('should fall back to unknown-user when configSvc is undefined-ish (no userProfile at all)', () => {
    TestBed.resetTestingModule()
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        FracApiService,
        { provide: ConfigurationsService, useValue: {} },
      ],
    })
    const service = TestBed.inject(FracApiService)
    const httpMock = TestBed.inject(HttpTestingController)
    service.updateEntity({} as any).subscribe()
    const req = httpMock.expectOne(() => true)
    expect(req.request.params.get('userId')).toBe('unknown-user')
    req.flush({})
    httpMock.verify()
  })
})
