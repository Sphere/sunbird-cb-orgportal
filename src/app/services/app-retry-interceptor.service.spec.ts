import { TestBed } from '@angular/core/testing'
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  HttpErrorResponse,
} from '@angular/common/http'
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing'
import { AppRetryInterceptorService } from './app-retry-interceptor.service'

describe('AppRetryInterceptorService', () => {
  let httpClient: HttpClient
  let httpMock: HttpTestingController

  beforeEach(() => {
    jest.useFakeTimers()
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AppRetryInterceptorService,
          multi: true,
        },
      ],
    })
    httpClient = TestBed.inject(HttpClient)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
    jest.useRealTimers()
  })

  it('should pass through a successful request untouched', () => {
    let result: any
    httpClient.get('/api/thing').subscribe(res => (result = res))

    const req = httpMock.expectOne('/api/thing')
    req.flush({ ok: true })

    expect(result).toEqual({ ok: true })
  })

  it('should not retry a request whose body opts out via excludeRetry', () => {
    let errored: HttpErrorResponse | undefined
    httpClient.post('/api/thing', { excludeRetry: true }).subscribe({
      error: err => (errored = err),
    })

    const req = httpMock.expectOne('/api/thing')
    req.flush('server error', { status: 500, statusText: 'Server Error' })

    expect(errored).toBeDefined()
    expect(errored && errored.status).toBe(500)
    httpMock.expectNone('/api/thing')
  })

  it('should not retry a 4xx client error', () => {
    let errored: HttpErrorResponse | undefined
    httpClient.get('/api/thing').subscribe({
      error: err => (errored = err),
    })

    const req = httpMock.expectOne('/api/thing')
    req.flush('bad request', { status: 400, statusText: 'Bad Request' })

    expect(errored).toBeDefined()
    expect(errored && errored.status).toBe(400)
    httpMock.expectNone('/api/thing')
  })

  it('should retry once on a 5xx error and then succeed', () => {
    let result: any
    httpClient.get('/api/thing').subscribe(res => (result = res))

    httpMock.expectOne('/api/thing').flush('boom', { status: 500, statusText: 'Server Error' })

    jest.advanceTimersByTime(5000)

    const retried = httpMock.expectOne('/api/thing')
    retried.flush({ ok: true })

    expect(result).toEqual({ ok: true })
  })

  it('should give up and surface the error after exceeding max retry attempts', () => {
    let errored: HttpErrorResponse | undefined
    httpClient.get('/api/thing').subscribe({
      error: err => (errored = err),
    })

    httpMock.expectOne('/api/thing').flush('boom', { status: 500, statusText: 'Server Error' })
    jest.advanceTimersByTime(5000)

    httpMock.expectOne('/api/thing').flush('boom again', { status: 500, statusText: 'Server Error' })

    expect(errored).toBeDefined()
    expect(errored && errored.status).toBe(500)
    httpMock.expectNone('/api/thing')
  })
})
