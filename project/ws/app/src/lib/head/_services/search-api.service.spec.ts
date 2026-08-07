import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { KeycloakService } from 'keycloak-angular'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { SearchApiService } from './search-api.service'

describe('SearchApiService', () => {
  let service: SearchApiService
  let httpMock: HttpTestingController
  let keycloakSvc: ReturnType<typeof createSpyObj>

  beforeEach(() => {
    keycloakSvc = createSpyObj('KeycloakService', ['getKeycloakInstance'])
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: KeycloakService, useValue: keycloakSvc }],
    })
    service = TestBed.inject(SearchApiService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => httpMock.verify())

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('getSearchResults should POST to the social search endpoint', () => {
    service.getSearchResults({ q: 'x' }).subscribe()
    const req = httpMock.expectOne('/apis/protected/v8/social/post/search')
    expect(req.request.method).toBe('POST')
    req.flush({})
  })

  it('getSearchAutoCompleteResults should GET with params', () => {
    service.getSearchAutoCompleteResults({ q: 'a', l: 'en' }).subscribe()
    const req = httpMock.expectOne(r => r.url === '/apis/proxies/v8/sunbirdigot/read')
    expect(req.request.params.get('q')).toBe('a')
    req.flush([])
  })

  describe('userId', () => {
    it('should return undefined when no keycloak instance', () => {
      keycloakSvc.getKeycloakInstance.mockReturnValue(undefined)
      expect(service.userId).toBeUndefined()
    })

    it('should return tokenParsed.sub when present', () => {
      keycloakSvc.getKeycloakInstance.mockReturnValue({ tokenParsed: { sub: 'u1' } })
      expect(service.userId).toBe('u1')
    })

    it('should fall back to idTokenParsed.sub when tokenParsed is missing', () => {
      keycloakSvc.getKeycloakInstance.mockReturnValue({ idTokenParsed: { sub: 'u2' } })
      expect(service.userId).toBe('u2')
    })
  })

  describe('getSearchV6Results', () => {
    it('should build filters from facets and collapse a single-value catalogPaths entry to an empty children array', done => {
      service.getSearchV6Results({}).subscribe(res => {
        expect(res.filters[0]).toEqual({
          displayName: 'catalogPaths',
          type: 'catalogPaths',
          content: [],
        })
        done()
      })
      const req = httpMock.expectOne('/apis/proxies/v8/sunbirdigot/search')
      req.flush({
        result: {
          facets: [{ name: 'catalogPaths', values: [{ name: 'sub', count: 2 }] }],
        },
      })
    })

    it('should leave a multi-value catalogPaths entry as-is (only single-entry ones collapse)', done => {
      service.getSearchV6Results({}).subscribe(res => {
        const catalog = res.filters.find((f: any) => f.type === 'catalogPaths')
        expect(catalog.content.length).toBe(2)
        done()
      })
      const req = httpMock.expectOne('/apis/proxies/v8/sunbirdigot/search')
      req.flush({
        result: {
          facets: [{
            name: 'catalogPaths',
            values: [{ name: 'a', count: 1 }, { name: 'b', count: 2 }],
          }],
        },
      })
    })

    it('should handle an empty facets array without building any filters', done => {
      service.getSearchV6Results({}).subscribe(res => {
        expect(res.filters).toEqual([])
        done()
      })
      const req = httpMock.expectOne('/apis/proxies/v8/sunbirdigot/search')
      req.flush({ result: { facets: [] } })
    })
  })

  it('getSearch should copy the query into the fixed request shape and POST', () => {
    service.getSearch({ request: { query: 'hello' } }).subscribe()
    const req = httpMock.expectOne(r => r.url === '/apis/proxies/v8/sunbirdigot/read')
    expect(req.request.body.request.query).toBe('hello')
    expect(req.request.body.request.filters.status).toEqual(['Draft', 'Live'])
    req.flush({})
  })
})
