import { TestBed } from '@angular/core/testing'
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http'
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing'
import { FracApiErrorNormalizerInterceptor } from './frac-api-error-normalizer.interceptor'

describe('FracApiErrorNormalizerInterceptor', () => {
  let httpClient: HttpClient
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: FracApiErrorNormalizerInterceptor,
          multi: true,
        },
      ],
    })
    httpClient = TestBed.inject(HttpClient)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('should pass through a successful response untouched', () => {
    let result: any
    httpClient.get('/apis/proxies/v8/entity/v1/search').subscribe(res => (result = res))

    httpMock.expectOne('/apis/proxies/v8/entity/v1/search').flush({ ok: true })
    expect(result).toEqual({ ok: true })
  })

  // NOTE: this interceptor calls throwError(() => value) at every catchError
  // branch — the RxJS 7 factory-function overload. This project now runs
  // RxJS 7.8.2 (see package.json), where throwError(fn) correctly invokes
  // the factory and throws its result, so subscribers receive the real
  // error/HttpErrorResponse rather than the function itself.
  it('should emit the real error (not a thunk) for a non-FRAC endpoint', () => {
    let error: any
    httpClient.get('/apis/other/endpoint').subscribe({ error: err => (error = err) })

    httpMock.expectOne('/apis/other/endpoint').flush(
      { message: 'raw error' },
      { status: 500, statusText: 'Server Error' },
    )

    expect(typeof error).not.toBe('function')
    expect(error).toBeDefined()
  })

  it('should emit the normalized error (not a thunk) for a FRAC JSON error payload', () => {
    let error: any
    httpClient.get('/apis/proxies/v8/entity/v1/search').subscribe({ error: err => (error = err) })

    httpMock.expectOne('/apis/proxies/v8/entity/v1/search').flush(
      { responseCode: 'CLIENT_ERROR', params: { errmsg: 'Duplicate entry' } },
      { status: 400, statusText: 'Bad Request' },
    )

    expect(typeof error).not.toBe('function')
    expect(error.error.responseCode).toBe('CLIENT_ERROR')
  })

  it('should match the alternate FRAC API path pattern (api/v1/frac/entity)', () => {
    let error: any
    httpClient.get('/api/v1/frac/entity/search').subscribe({ error: err => (error = err) })

    httpMock.expectOne('/api/v1/frac/entity/search').flush(
      { responseCode: 'CLIENT_ERROR' },
      { status: 400, statusText: 'Bad Request' },
    )

    expect(typeof error).not.toBe('function')
    expect(error.error.responseCode).toBe('CLIENT_ERROR')
  })
})
