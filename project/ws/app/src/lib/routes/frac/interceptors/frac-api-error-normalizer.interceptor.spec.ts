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
  // branch — the RxJS 7 factory-function overload. This project runs RxJS
  // 6.5.5 (see package.json), where throwError(x) treats x as the error
  // value directly rather than invoking it as a factory. As a result, every
  // error this interceptor emits is the *function* `() => value`, not the
  // underlying error/HttpErrorResponse. These specs assert that actual,
  // currently-shipping behavior rather than the presumably-intended one, so
  // a future RxJS 7 upgrade (or a fix to use throwError(x) directly) will
  // surface as a clear, intentional test failure here instead of silently
  // "just working" without anyone noticing the change.
  it('should currently emit a thunk function (not the real error) for a non-FRAC endpoint', () => {
    let error: any
    httpClient.get('/apis/other/endpoint').subscribe({ error: err => (error = err) })

    httpMock.expectOne('/apis/other/endpoint').flush(
      { message: 'raw error' },
      { status: 500, statusText: 'Server Error' },
    )

    expect(typeof error).toBe('function')
    expect(error()).toBeDefined()
  })

  it('should currently emit a thunk function (not the normalized error) for a FRAC JSON error payload', () => {
    let error: any
    httpClient.get('/apis/proxies/v8/entity/v1/search').subscribe({ error: err => (error = err) })

    httpMock.expectOne('/apis/proxies/v8/entity/v1/search').flush(
      { responseCode: 'CLIENT_ERROR', params: { errmsg: 'Duplicate entry' } },
      { status: 400, statusText: 'Bad Request' },
    )

    expect(typeof error).toBe('function')
    // The thunk still closes over the correctly-normalized error, so callers
    // that happen to invoke it as a function would see the right shape —
    // but rxjs delivers the thunk itself as the error, not its result.
    const normalized = error()
    expect(normalized.error.responseCode).toBe('CLIENT_ERROR')
  })

  it('should match the alternate FRAC API path pattern (api/v1/frac/entity)', () => {
    let error: any
    httpClient.get('/api/v1/frac/entity/search').subscribe({ error: err => (error = err) })

    httpMock.expectOne('/api/v1/frac/entity/search').flush(
      { responseCode: 'CLIENT_ERROR' },
      { status: 400, statusText: 'Bad Request' },
    )

    expect(typeof error).toBe('function')
    expect(error().error.responseCode).toBe('CLIENT_ERROR')
  })
})
