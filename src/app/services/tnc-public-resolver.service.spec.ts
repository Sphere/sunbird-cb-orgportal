import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'

import { TncPublicResolverService } from './tnc-public-resolver.service'

describe('TncPublicResolverService', () => {
  let service: TncPublicResolverService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TncPublicResolverService],
    })
    service = TestBed.inject(TncPublicResolverService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => httpMock.verify())

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getPublicTnc', () => {
    it('should GET without a locale query param when none is given', () => {
      service.getPublicTnc().subscribe()
      const req = httpMock.expectOne('/apis/public/v8/tnc')
      req.flush({})
    })

    it('should GET with a locale query param when given', () => {
      service.getPublicTnc('en').subscribe()
      const req = httpMock.expectOne('/apis/public/v8/tnc?locale=en')
      req.flush({})
    })
  })

  describe('resolve', () => {
    it('should emit data with no error on success', done => {
      service.resolve().subscribe(res => {
        expect(res).toEqual({ data: { title: 't' }, error: null })
        done()
      })
      const req = httpMock.expectOne('/apis/public/v8/tnc')
      req.flush({ title: 't' })
    })

    it('should emit error with null data on failure', done => {
      service.resolve().subscribe(res => {
        expect((res as any).data).toBeNull()
        expect((res as any).error).toBeTruthy()
        done()
      })
      const req = httpMock.expectOne('/apis/public/v8/tnc')
      req.flush('fail', { status: 500, statusText: 'Server Error' })
    })
  })
})
