import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { ConfigurationsService } from '@sunbird-cb/utils'

import { TncAppResolverService } from './tnc-app-resolver.service'

describe('TncAppResolverService', () => {
  let service: TncAppResolverService
  let httpMock: HttpTestingController
  let configSvc: any

  beforeEach(() => {
    configSvc = {}
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TncAppResolverService,
        { provide: ConfigurationsService, useValue: configSvc },
      ],
    })
    service = TestBed.inject(TncAppResolverService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => httpMock.verify())

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getTnc', () => {
    it('should GET without a locale query param when none is given', () => {
      service.getTnc().subscribe()
      const req = httpMock.expectOne('/apis/protected/v8/user/tnc')
      req.flush({})
    })

    it('should GET with a locale query param when given', () => {
      service.getTnc('en').subscribe()
      const req = httpMock.expectOne('/apis/protected/v8/user/tnc?locale=en')
      req.flush({})
    })
  })

  describe('resolve', () => {
    it('should use the userPreference selectedLocale when present', done => {
      configSvc.userPreference = { selectedLocale: 'fr' }
      service.resolve().subscribe(res => {
        expect(res).toEqual({ data: { title: 't' }, error: null })
        done()
      })
      const req = httpMock.expectOne('/apis/protected/v8/user/tnc?locale=fr')
      req.flush({ title: 't' })
    })

    it('should default to no locale when userPreference is missing', done => {
      service.resolve().subscribe(res => {
        expect(res).toEqual({ data: {}, error: null })
        done()
      })
      const req = httpMock.expectOne('/apis/protected/v8/user/tnc')
      req.flush({})
    })

    it('should emit error with null data on failure', done => {
      service.resolve().subscribe(res => {
        expect((res as any).data).toBeNull()
        expect((res as any).error).toBeTruthy()
        done()
      })
      const req = httpMock.expectOne('/apis/protected/v8/user/tnc')
      req.flush('fail', { status: 500, statusText: 'Server Error' })
    })
  })
})
