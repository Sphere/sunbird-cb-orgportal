import { TestBed } from '@angular/core/testing'
import { HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http'
import { of } from 'rxjs'

import { CatalogResponseInterceptorService } from './catalog-response-interceptor.service'

describe('CatalogResponseInterceptorService', () => {
  let service: CatalogResponseInterceptorService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(CatalogResponseInterceptorService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  function run(url: string, handlerReturn: any): Promise<any> {
    const req = new HttpRequest('GET', url)
    const next: HttpHandler = {
      handle: () => of(handlerReturn),
    }
    return new Promise(resolve => {
      service.intercept(req, next).subscribe(event => resolve(event))
    })
  }

  it('passes through requests not matching /v8/catalog', async () => {
    const passthroughEvent = { some: 'event' }
    const result = await run('/apis/protected/v8/other', passthroughEvent)
    expect(result).toBe(passthroughEvent)
  })

  it('passes through non-HttpResponse events for catalog url', async () => {
    const nonResponseEvent = { type: 0 }
    const result = await run('/apis/protected/v8/catalog', nonResponseEvent)
    expect(result).toBe(nonResponseEvent)
  })

  it('passes through HttpResponse whose body is already an array', async () => {
    const response = new HttpResponse({ body: [1, 2, 3] })
    const result = await run('/apis/protected/v8/catalog', response)
    expect(result).toBe(response)
    expect(result.body).toEqual([1, 2, 3])
  })

  it('passes through HttpResponse with null body unchanged', async () => {
    const response = new HttpResponse({ body: null })
    const result = await run('/apis/protected/v8/catalog', response)
    expect(result).toBe(response)
  })

  it('passes through HttpResponse whose body is not an object (e.g. string)', async () => {
    const response = new HttpResponse({ body: 'plain string body' })
    const result = await run('/apis/protected/v8/catalog', response)
    expect(result).toBe(response)
  })

  it('unwraps result.catalog array', async () => {
    const response = new HttpResponse({ body: { result: { catalog: [{ id: 1 }] } } })
    const result = await run('/apis/protected/v8/catalog', response)
    expect(result.body).toEqual([{ id: 1 }])
  })

  it('unwraps result.data array', async () => {
    const response = new HttpResponse({ body: { result: { data: [{ id: 2 }] } } })
    const result = await run('/apis/protected/v8/catalog', response)
    expect(result.body).toEqual([{ id: 2 }])
  })

  it('unwraps result.content array', async () => {
    const response = new HttpResponse({ body: { result: { content: [{ id: 3 }] } } })
    const result = await run('/apis/protected/v8/catalog', response)
    expect(result.body).toEqual([{ id: 3 }])
  })

  it('unwraps result.children array', async () => {
    const response = new HttpResponse({ body: { result: { children: [{ id: 4 }] } } })
    const result = await run('/apis/protected/v8/catalog', response)
    expect(result.body).toEqual([{ id: 4 }])
  })

  it('unwraps result.list array', async () => {
    const response = new HttpResponse({ body: { result: { list: [{ id: 5 }] } } })
    const result = await run('/apis/protected/v8/catalog', response)
    expect(result.body).toEqual([{ id: 5 }])
  })

  it('unwraps result.items array', async () => {
    const response = new HttpResponse({ body: { result: { items: [{ id: 6 }] } } })
    const result = await run('/apis/protected/v8/catalog', response)
    expect(result.body).toEqual([{ id: 6 }])
  })

  it('unwraps result directly when result itself is an array', async () => {
    const response = new HttpResponse({ body: { result: [{ id: 7 }] } })
    const result = await run('/apis/protected/v8/catalog', response)
    expect(result.body).toEqual([{ id: 7 }])
  })

  it('unwraps result.response.content array', async () => {
    const response = new HttpResponse({
      body: { result: { response: { content: [{ id: 8 }] } } },
    })
    const result = await run('/apis/protected/v8/catalog', response)
    expect(result.body).toEqual([{ id: 8 }])
  })

  it('returns empty array when result is null', async () => {
    const response = new HttpResponse({ body: { result: null } })
    const result = await run('/apis/protected/v8/catalog', response)
    expect(result.body).toEqual([])
  })

  it('returns empty array when result is not an object (e.g. string)', async () => {
    const response = new HttpResponse({ body: { result: 'notanobject' } })
    const result = await run('/apis/protected/v8/catalog', response)
    expect(result.body).toEqual([])
  })

  it('returns empty array when result has no matching keys', async () => {
    const response = new HttpResponse({ body: { result: { foo: 'bar' } } })
    const result = await run('/apis/protected/v8/catalog', response)
    expect(result.body).toEqual([])
  })

  it('returns empty array when result.response.content is not an array', async () => {
    const response = new HttpResponse({
      body: { result: { response: { content: 'notanarray' } } },
    })
    const result = await run('/apis/protected/v8/catalog', response)
    expect(result.body).toEqual([])
  })

  it('returns empty array when result is undefined (no result key at all)', async () => {
    const response = new HttpResponse({ body: { responseCode: 'OK' } })
    const result = await run('/apis/protected/v8/catalog', response)
    expect(result.body).toEqual([])
  })
})
