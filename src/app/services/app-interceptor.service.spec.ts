import { TestBed } from '@angular/core/testing'
import { LOCALE_ID } from '@angular/core'
import { HttpErrorResponse, HttpHandler, HttpRequest } from '@angular/common/http'
import { of, throwError } from 'rxjs'
import { ConfigurationsService } from '@sunbird-cb/utils'

import { AppInterceptorService } from './app-interceptor.service'

describe('AppInterceptorService', () => {
  let service: AppInterceptorService
  let configSvc: any
  let mockHandler: jest.Mocked<HttpHandler>

  beforeEach(() => {
    configSvc = { userPreference: null, activeOrg: null, rootOrg: null, hostPath: 'host' }

    TestBed.configureTestingModule({
      providers: [
        AppInterceptorService,
        { provide: ConfigurationsService, useValue: configSvc },
        { provide: LOCALE_ID, useValue: 'en-US' },
      ],
    })
    service = TestBed.inject(AppInterceptorService)
    mockHandler = { handle: jest.fn() } as any
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should pass request through unmodified when activeOrg/rootOrg missing', () => {
    const req = new HttpRequest('GET', '/api/test')
    mockHandler.handle.mockReturnValue(of({} as any))

    service.intercept(req, mockHandler)

    expect(mockHandler.handle).toHaveBeenCalledWith(req)
  })

  it('should replace en-US locale with en', () => {
    configSvc.activeOrg = 'org1'
    configSvc.rootOrg = 'root1'
    const req = new HttpRequest('GET', '/api/test')
    let clonedHeaders: any
    jest.spyOn(req, 'clone').mockImplementation((opts: any) => {
      clonedHeaders = opts.setHeaders
      return req
    })
    mockHandler.handle.mockReturnValue(of({} as any))

    service.intercept(req, mockHandler)

    expect(clonedHeaders.locale).toBe('en')
  })

  it('should append additional languages from userPreference.selectedLangGroup', () => {
    configSvc.activeOrg = 'org1'
    configSvc.rootOrg = 'root1'
    configSvc.userPreference = { selectedLangGroup: 'en, hi ,  ,te' }
    const req = new HttpRequest('GET', '/api/test')
    let clonedHeaders: any
    jest.spyOn(req, 'clone').mockImplementation((opts: any) => {
      clonedHeaders = opts.setHeaders
      return req
    })
    mockHandler.handle.mockReturnValue(of({} as any))

    service.intercept(req, mockHandler)

    expect(clonedHeaders.locale).toBe('en,hi,te')
  })

  it('should not duplicate locale already present in lang array', () => {
    configSvc.activeOrg = 'org1'
    configSvc.rootOrg = 'root1'
    configSvc.userPreference = { selectedLangGroup: 'en' }
    const req = new HttpRequest('GET', '/api/test')
    let clonedHeaders: any
    jest.spyOn(req, 'clone').mockImplementation((opts: any) => {
      clonedHeaders = opts.setHeaders
      return req
    })
    mockHandler.handle.mockReturnValue(of({} as any))

    service.intercept(req, mockHandler)

    expect(clonedHeaders.locale).toBe('en')
  })

  it('should handle missing selectedLangGroup (defaults to empty string)', () => {
    configSvc.activeOrg = 'org1'
    configSvc.rootOrg = 'root1'
    configSvc.userPreference = {}
    const req = new HttpRequest('GET', '/api/test')
    let clonedHeaders: any
    jest.spyOn(req, 'clone').mockImplementation((opts: any) => {
      clonedHeaders = opts.setHeaders
      return req
    })
    mockHandler.handle.mockReturnValue(of({} as any))

    service.intercept(req, mockHandler)

    expect(clonedHeaders.locale).toBe('en')
  })

  it('should clone request with org/rootOrg/hostPath headers when both present', () => {
    configSvc.activeOrg = 'org1'
    configSvc.rootOrg = 'root1'
    configSvc.hostPath = 'https://host.example'
    const req = new HttpRequest('GET', '/api/test')
    let clonedHeaders: any
    jest.spyOn(req, 'clone').mockImplementation((opts: any) => {
      clonedHeaders = opts.setHeaders
      return req
    })
    mockHandler.handle.mockReturnValue(of({} as any))

    service.intercept(req, mockHandler)

    expect(clonedHeaders.org).toBe('org1')
    expect(clonedHeaders.rootOrg).toBe('root1')
    expect(clonedHeaders.wid).toBe('')
    expect(clonedHeaders.hostPath).toBe('https://host.example')
  })

  it('should propagate non-HttpErrorResponse errors unchanged', done => {
    configSvc.activeOrg = 'org1'
    configSvc.rootOrg = 'root1'
    const req = new HttpRequest('GET', '/api/test')
    jest.spyOn(req, 'clone').mockReturnValue(req)
    const err = new Error('boom')
    mockHandler.handle.mockReturnValue(throwError(err))

    service.intercept(req, mockHandler).subscribe({
      error: (e) => {
        expect(e).toBe(err)
        done()
      },
    })
  })

  it('should propagate HttpErrorResponse with a non-419 status unchanged', done => {
    configSvc.activeOrg = 'org1'
    configSvc.rootOrg = 'root1'
    const req = new HttpRequest('GET', '/api/test')
    jest.spyOn(req, 'clone').mockReturnValue(req)
    const err = new HttpErrorResponse({ status: 500 })
    mockHandler.handle.mockReturnValue(throwError(err))

    service.intercept(req, mockHandler).subscribe({
      error: (e) => {
        expect(e).toBe(err)
        done()
      },
    })
  })

  it('should redirect via redirectUrl with local query param on 419 when running on localhost', done => {
    configSvc.activeOrg = 'org1'
    configSvc.rootOrg = 'root1'
    const req = new HttpRequest('GET', '/api/test')
    jest.spyOn(req, 'clone').mockReturnValue(req)
    const err = new HttpErrorResponse({ status: 419, error: { redirectUrl: 'https://login.example' } })
    mockHandler.handle.mockReturnValue(throwError(err))

    const originalLocation = window.location
    // @ts-ignore
    delete (window as any).location
    ;(window as any).location = { origin: 'http://localhost:4200', href: '' }

    service.intercept(req, mockHandler).subscribe({
      error: () => {
        expect(window.location.href).toBe('https://login.example?q=http://localhost:4200/app/home/welcome')
        ;(window as any).location = originalLocation
        done()
      },
    })
  })

  it('should redirect via redirectUrl with page-only query param on 419 when not on localhost', done => {
    configSvc.activeOrg = 'org1'
    configSvc.rootOrg = 'root1'
    const req = new HttpRequest('GET', '/api/test')
    jest.spyOn(req, 'clone').mockReturnValue(req)
    const err = new HttpErrorResponse({ status: 419, error: { redirectUrl: 'https://login.example' } })
    mockHandler.handle.mockReturnValue(throwError(err))

    const originalLocation = window.location
    // @ts-ignore
    delete (window as any).location
    ;(window as any).location = { origin: 'https://prod.example', href: '' }

    service.intercept(req, mockHandler).subscribe({
      error: () => {
        expect(window.location.href).toBe('https://login.example?q=/app/home/welcome')
        ;(window as any).location = originalLocation
        done()
      },
    })
  })
})
