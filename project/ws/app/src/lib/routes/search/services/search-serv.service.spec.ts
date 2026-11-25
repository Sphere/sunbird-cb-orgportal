import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { KeycloakService } from 'keycloak-angular'
import { of } from 'rxjs'
import { EventService, ConfigurationsService } from '@sunbird-cb/utils'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { SearchServService } from './search-serv.service'
import { SearchApiService } from '../apis/search-api.service'

describe('SearchServService', () => {
  let service: SearchServService
  let httpMock: HttpTestingController
  let searchApiSpy: any
  let configSrvSpy: any
  let eventsSpy: any

  beforeEach(() => {
    searchApiSpy = createSpyObj('SearchApiService', ['getSearchAutoCompleteResults', 'getSearchV6Results', 'getSearchResults'])
    configSrvSpy = {
      sitePath: 'http://localhost',
      activeOrg: 'org1',
      rootOrg: 'rootOrg1',
    }
    eventsSpy = createSpyObj('EventService', ['dispatchEvent'])

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: 'environment', useValue: {} },
        { provide: KeycloakService, useValue: createSpyObj('KeycloakService', ['getKeycloakInstance']) },
        { provide: SearchApiService, useValue: searchApiSpy },
        { provide: ConfigurationsService, useValue: configSrvSpy },
        { provide: EventService, useValue: eventsSpy },
      ],
    })
    service = TestBed.inject(SearchServService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('defaultFiltersTranslated should return empty en/all objects', () => {
    expect(service.defaultFiltersTranslated).toEqual({ en: {}, all: {} })
  })

  describe('getSearchConfig', () => {
    it('fetches config from http when not cached', async () => {
      const promise = service.getSearchConfig()
      const req = httpMock.expectOne('http://localhost/feature/search.json')
      expect(req.request.method).toBe('GET')
      req.flush({ search: { tabs: [{ phraseSearch: true }] } })
      const result = await promise
      expect(result).toEqual({ search: { tabs: [{ phraseSearch: true }] } })
    })

    it('returns cached config on subsequent calls without new http request', async () => {
      const promise = service.getSearchConfig()
      const req = httpMock.expectOne('http://localhost/feature/search.json')
      req.flush({ search: { tabs: [{ phraseSearch: false }] } })
      await promise

      const result2 = await service.getSearchConfig()
      httpMock.expectNone('http://localhost/feature/search.json')
      expect(result2).toEqual({ search: { tabs: [{ phraseSearch: false }] } })
    })
  })

  describe('getApplyPhraseSearch', () => {
    it('returns true when phraseSearch is true', async () => {
      const promise = service.getApplyPhraseSearch()
      const req = httpMock.expectOne('http://localhost/feature/search.json')
      req.flush({ search: { tabs: [{ phraseSearch: true }] } })
      expect(await promise).toBe(true)
    })

    it('returns true when phraseSearch is undefined', async () => {
      const promise = service.getApplyPhraseSearch()
      const req = httpMock.expectOne('http://localhost/feature/search.json')
      req.flush({ search: { tabs: [{}] } })
      expect(await promise).toBe(true)
    })

    it('returns false when phraseSearch is explicitly false', async () => {
      const promise = service.getApplyPhraseSearch()
      const req = httpMock.expectOne('http://localhost/feature/search.json')
      req.flush({ search: { tabs: [{ phraseSearch: false }] } })
      expect(await promise).toBe(false)
    })
  })

  describe('searchAutoComplete', () => {
    it('calls api when single non-all locale provided', async () => {
      searchApiSpy.getSearchAutoCompleteResults.mockReturnValue(of([{ term: 'abc' }]))
      const result = await service.searchAutoComplete({ q: 'ABC', l: 'en' } as any)
      expect(searchApiSpy.getSearchAutoCompleteResults).toHaveBeenCalledWith({ q: 'abc', l: 'en' })
      expect(result).toEqual([{ term: 'abc' }])
    })

    it('returns empty array when locale is "all"', async () => {
      const result = await service.searchAutoComplete({ q: 'ABC', l: 'all' } as any)
      expect(result).toEqual([])
      expect(searchApiSpy.getSearchAutoCompleteResults).not.toHaveBeenCalled()
    })

    it('returns empty array when multiple locales provided', async () => {
      const result = await service.searchAutoComplete({ q: 'ABC', l: 'en,fr' } as any)
      expect(result).toEqual([])
      expect(searchApiSpy.getSearchAutoCompleteResults).not.toHaveBeenCalled()
    })
  })

  describe('getLearning / searchV6Wrapper', () => {
    it('resets locale to [] when locale[0] is "all"', () => {
      searchApiSpy.getSearchV6Results.mockReturnValue(of({ filters: [] }))
      const request: any = { locale: ['all'], filters: {} }
      service.getLearning(request)
      expect(request.locale).toEqual([])
      const req = httpMock.expectOne('http://localhost/feature/search.json')
      req.flush({ search: { visibleFilters: {}, excludeSourceFields: [] } })
    })

    it('keeps locale when not "all"', () => {
      searchApiSpy.getSearchV6Results.mockReturnValue(of({ filters: [] }))
      const request: any = { locale: ['en'], filters: {} }
      service.getLearning(request)
      expect(request.locale).toEqual(['en'])
      const req = httpMock.expectOne('http://localhost/feature/search.json')
      req.flush({ search: { visibleFilters: {}, excludeSourceFields: [] } })
    })

    it('builds v6 request with andFilters from request.filters and calls api', () => {
      searchApiSpy.getSearchV6Results.mockReturnValue(of({ filters: [] }))
      const request: any = {
        locale: ['en'],
        pageNo: 1,
        pageSize: 10,
        query: 'test',
        didYouMean: true,
        filters: { subject: ['math'] },
        isStandAlone: true,
        sort: [{ score: 'desc' }],
      }
      service.searchV6Wrapper(request)
      expect(searchApiSpy.getSearchV6Results).toHaveBeenCalled()
      const sentRequest = searchApiSpy.getSearchV6Results.mock.calls[0][0]
      expect(sentRequest.filters[0].andFilters).toEqual([{ subject: ['math'] }])
      expect(sentRequest.query).toBe('test')
      expect(sentRequest.isStandAlone).toBe(true)
      expect(sentRequest.sort).toEqual([{ score: 'desc' }])
      const req = httpMock.expectOne('http://localhost/feature/search.json')
      req.flush({ search: { visibleFilters: { a: 1 }, excludeSourceFields: ['x'] } })
    })

    it('handles missing sort and isStandAlone gracefully', () => {
      searchApiSpy.getSearchV6Results.mockReturnValue(of({ filters: [] }))
      const request: any = { locale: ['en'], query: 'q', filters: {} }
      service.searchV6Wrapper(request)
      const sentRequest = searchApiSpy.getSearchV6Results.mock.calls[0][0]
      expect(sentRequest.isStandAlone).toBeUndefined()
      expect(sentRequest.sort).toBeUndefined()
      const req = httpMock.expectOne('http://localhost/feature/search.json')
      req.flush({ search: { visibleFilters: {}, excludeSourceFields: [] } })
    })

    it('silently catches error from getSearchConfig failure', done => {
      searchApiSpy.getSearchV6Results.mockReturnValue(of({ filters: [] }))
      const request: any = { locale: ['en'], query: 'q', filters: {} }
      service.searchV6Wrapper(request)
      const req = httpMock.expectOne('http://localhost/feature/search.json')
      req.flush('error', { status: 500, statusText: 'Server Error' })
      setTimeout(() => done(), 0)
    })
  })

  describe('fetchSocialSearchUsers', () => {
    it('merges org/rootOrg into request and calls api', () => {
      searchApiSpy.getSearchResults.mockReturnValue(of({}))
      const request: any = { query: 'hello' }
      service.fetchSocialSearchUsers(request)
      expect(searchApiSpy.getSearchResults).toHaveBeenCalledWith({
        org: 'org1',
        rootOrg: 'rootOrg1',
        query: 'hello',
      })
    })
  })

  describe('updateSelectedFiltersSet', () => {
    it('handles tags filters by splitting on / and building cumulative paths', () => {
      const result = service.updateSelectedFiltersSet({ tags: ['a/b/c'] })
      expect(result.filterSet.has('a')).toBe(true)
      expect(result.filterSet.has('a/b')).toBe(true)
      expect(result.filterSet.has('a/b/c')).toBe(true)
      expect(result.filterReset).toBe(true)
    })

    it('handles non-tags filters by adding raw values', () => {
      const result = service.updateSelectedFiltersSet({ subject: ['math', 'science'] })
      expect(result.filterSet.has('math')).toBe(true)
      expect(result.filterSet.has('science')).toBe(true)
      expect(result.filterReset).toBe(true)
    })

    it('returns filterReset false when all filter arrays are empty', () => {
      const result = service.updateSelectedFiltersSet({ subject: [] })
      expect(result.filterReset).toBe(false)
      expect(result.filterSet.size).toBe(0)
    })

    it('handles undefined filters gracefully', () => {
      const result = service.updateSelectedFiltersSet(undefined as any)
      expect(result.filterReset).toBe(false)
      expect(result.filterSet.size).toBe(0)
    })
  })

  describe('transformSearchV6Filters', () => {
    it('flattens andFilters into a single filters map', () => {
      const v6filters: any = [
        { andFilters: [{ subject: ['math'] }, { grade: ['5'] }] },
        { andFilters: [{ topic: ['algebra'] }] },
      ]
      const result = service.transformSearchV6Filters(v6filters)
      expect(result).toEqual({ subject: ['math'], grade: ['5'], topic: ['algebra'] })
    })

    it('handles filters without andFilters key', () => {
      const v6filters: any = [{ type: 'x' }]
      const result = service.transformSearchV6Filters(v6filters)
      expect(result).toEqual({})
    })
  })

  describe('handleFilters', () => {
    it('extracts concepts, excludes dtLastModified, and marks checked items', () => {
      const filters: any = [
        { type: 'concepts', content: Array.from({ length: 15 }, (_, i) => ({ type: `c${i}`, displayName: `c${i}`, count: 1 })) },
        { type: 'dtLastModified', content: [] },
        {
          type: 'subject',
          displayName: 'Subject',
          content: [
            { type: 'math', displayName: 'Math', count: 5, children: [{ type: 'algebra', displayName: 'Algebra', count: 2 }] },
          ],
        },
      ]
      const selectedFilterSet = new Set(['math', 'algebra'])
      const selectedFilters = { subject: ['math'] }
      const result = service.handleFilters(filters, selectedFilterSet, selectedFilters)
      expect(result.concept.length).toBe(10)
      expect(result.filtersRes.length).toBe(1)
      expect(result.filtersRes[0].type).toBe('subject')
      expect(result.filtersRes[0].checked).toBe(true)
      expect(result.filtersRes[0].content[0].checked).toBe(true)
      expect(result.filtersRes[0].content[0].children[0].checked).toBe(true)
    })

    it('excludes contentType filter when showContentType is true', () => {
      const filters: any = [
        { type: 'contentType', displayName: 'Content Type', content: [] },
        { type: 'subject', displayName: 'Subject', content: [] },
      ]
      const result = service.handleFilters(filters, new Set(), {}, true)
      expect(result.filtersRes.length).toBe(1)
      expect(result.filtersRes[0].type).toBe('subject')
    })

    it('keeps contentType filter when showContentType is false', () => {
      const filters: any = [
        { type: 'contentType', displayName: 'Content Type', content: [] },
      ]
      const result = service.handleFilters(filters, new Set(), {}, false)
      expect(result.filtersRes.length).toBe(1)
    })

    it('handles content items without children array', () => {
      const filters: any = [
        { type: 'subject', displayName: 'Subject', content: [{ type: 'math', displayName: 'Math', count: 1 }] },
      ]
      const result = service.handleFilters(filters, new Set(), {})
      expect(result.filtersRes[0].content[0].children).toEqual([])
    })
  })

  describe('formatFilterForSearch', () => {
    it('formats filters into a query-friendly string', () => {
      const result = service.formatFilterForSearch({ subject: ['math', 'science'] })
      expect(result).toBe('"subject":["math","science"]')
    })

    it('joins multiple filter keys with $', () => {
      const result = service.formatFilterForSearch({ subject: ['math'], grade: ['5'] })
      expect(result).toBe('"subject":["math"]$"grade":["5"]')
    })

    it('skips keys with empty arrays', () => {
      const result = service.formatFilterForSearch({ subject: [] })
      expect(result).toBe('')
    })
  })

  describe('getDisplayName', () => {
    it.each([
      ['automationcentral', 'Tools'],
      ['autogeneratedtopic', 'Topics'],
      ['topics', 'Topics'],
      ['kshopdocument', 'Kshop Document'],
      ['project', 'Project References'],
      ['kshop', 'Documents'],
      ['itemtype', 'Item Type'],
      ['authors.mailid', 'Authors'],
      ['mstlocation', 'Location'],
      ['status', 'Project Status'],
      ['marketing', 'Marketing'],
    ])('maps %s to %s', (input, expected) => {
      expect(service.getDisplayName(input)).toBe(expected)
    })

    it('returns the original type for unrecognized types', () => {
      expect(service.getDisplayName('unknownType')).toBe('unknownType')
    })

    it('is case-insensitive', () => {
      expect(service.getDisplayName('KSHOP')).toBe('Documents')
    })
  })

  describe('getLanguageSearchIndex', () => {
    it('maps zh-CN to zh', () => {
      expect(service.getLanguageSearchIndex('zh-CN')).toBe('zh')
    })

    it('returns the original language for other values', () => {
      expect(service.getLanguageSearchIndex('en')).toBe('en')
    })
  })

  describe('raiseSearchEvent', () => {
    it('dispatches a telemetry interact event', () => {
      service.raiseSearchEvent('query1', { a: 1 }, 'en')
      expect(eventsSpy.dispatchEvent).toHaveBeenCalled()
      const arg = eventsSpy.dispatchEvent.mock.calls[0][0]
      expect(arg.data.object.query).toBe('query1')
      expect(arg.data.object.filters).toEqual({ a: 1 })
      expect(arg.data.object.locale).toBe('en')
    })
  })

  describe('raiseSearchResponseEvent', () => {
    it('dispatches a telemetry search event', () => {
      service.raiseSearchResponseEvent('query1', { a: 1 }, 42, 'en')
      expect(eventsSpy.dispatchEvent).toHaveBeenCalled()
      const arg = eventsSpy.dispatchEvent.mock.calls[0][0]
      expect(arg.data.query).toBe('query1')
      expect(arg.data.size).toBe(42)
    })
  })

  describe('translateSearchFilters', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    it('fetches and caches translation for a single new language', async () => {
      const promise = service.translateSearchFilters('fr')
      const req = httpMock.expectOne('/apis/protected/v8/translate/filterdata/fr')
      req.flush({ label: 'translated' })
      const result = await promise
      expect(result).toEqual({ label: 'translated' })
      const stored = JSON.parse(localStorage.getItem('filtersTranslation') || '{}')
      expect(stored.fr).toEqual({ label: 'translated' })
    })

    it('returns cached translation without new http call when already present', async () => {
      localStorage.setItem('filtersTranslation', JSON.stringify({ en: { label: 'cached' }, all: {} }))
      const result = await service.translateSearchFilters('en')
      httpMock.expectNone('/apis/protected/v8/translate/filterdata/en')
      expect(result).toEqual({ label: 'cached' })
    })

    it('returns "en" translation when multiple languages requested', async () => {
      localStorage.setItem('filtersTranslation', JSON.stringify({ en: { label: 'englabel' }, all: {} }))
      const result = await service.translateSearchFilters('en,fr')
      expect(result).toEqual({ label: 'englabel' })
    })

    it('returns empty object when multiple languages requested and no en cache', async () => {
      const result = await service.translateSearchFilters('en,fr')
      expect(result).toEqual({})
    })
  })
})
