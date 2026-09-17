import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { FormApiService } from './form-api.service'
import { IFormReadRequest, IFormUpdateRequest } from '../models/form.model'

describe('FormApiService', () => {
  let service: FormApiService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FormApiService],
    })

    service = TestBed.inject(FormApiService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should POST the wrapped request to /apis/v1/form/read with a cache-busting v param', () => {
    const request: IFormReadRequest = {
      type: 'web_layout',
      subtype: 'v1',
      action: 'get',
      component: 'ekshamata',
      framework: 'v2',
      rootOrgId: '12345',
    }

    service.readForm(request).subscribe((response) => {
      expect(response).toEqual({ result: { form: {} } } as any)
    })

    // The cache-busting `v` is embedded directly in the URL string (not a
    // separate HttpParams entry), so it shows up in req.request.url itself.
    const req = httpMock.expectOne(r => r.url.startsWith('/apis/v1/form/read?v='))
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual({ request })
    const vValue = req.request.url.split('v=')[1]
    expect(Number(vValue)).not.toBeNaN()

    req.flush({ result: { form: {} } })
  })

  it('should send a fresh v param on every readForm call', () => {
    const request: IFormReadRequest = {
      type: 'web_layout', subtype: 'v1', action: 'get', component: 'web', framework: '*', rootOrgId: '*',
    }
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValueOnce(111).mockReturnValueOnce(222)

    service.readForm(request).subscribe()
    const first = httpMock.expectOne(r => r.url === '/apis/v1/form/read?v=111')
    first.flush({})

    service.readForm(request).subscribe()
    const second = httpMock.expectOne(r => r.url === '/apis/v1/form/read?v=222')
    second.flush({})

    nowSpy.mockRestore()
  })

  it('should POST the wrapped request to the ext-forms create endpoint for updateForm', () => {
    const request: IFormUpdateRequest = {
      type: 'web_layout',
      subtype: 'v1',
      action: 'get',
      component: 'ekshamata',
      framework: 'v2',
      rootOrgId: '12345',
      last_modified_on: '2026-01-01T00:00:00.000Z',
      data: { orgData: {} },
    }

    service.updateForm(request).subscribe((response) => {
      expect(response).toEqual({ responseCode: 'OK' } as any)
    })

    const req = httpMock.expectOne(r => r.url === '/apis/proxies/v8/ext-forms/v1/form/create')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual({ request })

    req.flush({ responseCode: 'OK' })
  })
})
