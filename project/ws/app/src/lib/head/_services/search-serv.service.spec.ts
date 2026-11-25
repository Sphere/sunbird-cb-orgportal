import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { KeycloakService } from 'keycloak-angular'
import { of } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { ConfigurationsService, EventService } from '@sunbird-cb/utils'

import { SearchServService } from './search-serv.service'
import { SearchApiService } from './search-api.service'

describe('SearchServService', () => {
  let service: SearchServService
  let httpMock: HttpTestingController
  let searchApiSpy: any
  let eventsSpy: any

  beforeEach(() => {
    searchApiSpy = createSpyObj('SearchApiService', ['getSearch', 'getSearchResults'])
    eventsSpy = createSpyObj('EventService', ['dispatchEvent'])

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: 'environment', useValue: {} },
        { provide: KeycloakService, useValue: createSpyObj('KeycloakService', ['getKeycloakInstance']) },
        { provide: SearchApiService, useValue: searchApiSpy },
        { provide: EventService, useValue: eventsSpy },
      ],
    })
    service = TestBed.inject(SearchServService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
    localStorage.clear()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('getSearchConfig should fetch config from http when not cached', async () => {
    const configSrv: ConfigurationsService = TestBed.inject(ConfigurationsService)
    configSrv.sitePath = 'https://site'
    const mockConfig = { search: { tabs: [{ phraseSearch: true }], visibleFiltersV2: { a: 1 } } }

    const promise = service.getSearchConfig()
    const req = httpMock.expectOne('https://site/feature/search.json')
    req.flush(mockConfig)
    const result = await promise
    expect(result).toEqual(mockConfig)
    expect(service.searchConfig).toEqual(mockConfig)
  })

  it('getSearchConfig should reuse cached config on subsequent calls', async () => {
    const cached = { search: { tabs: [{}], visibleFiltersV2: {} } }
    service.searchConfig = cached
    const result = await service.getSearchConfig()
    expect(result).toEqual(cached)
    httpMock.expectNone('https://site/feature/search.json')
  })

  it('getApplyPhraseSearch returns true when phraseSearch is true', async () => {
    service.searchConfig = { search: { tabs: [{ phraseSearch: true }] } }
    const result = await service.getApplyPhraseSearch()
    expect(result).toBe(true)
  })

  it('getApplyPhraseSearch returns true when phraseSearch is undefined', async () => {
    service.searchConfig = { search: { tabs: [{}] } }
    const result = await service.getApplyPhraseSearch()
    expect(result).toBe(true)
  })

  it('getApplyPhraseSearch returns false when phraseSearch is explicitly false', async () => {
    service.searchConfig = { search: { tabs: [{ phraseSearch: false }] } }
    const result = await service.getApplyPhraseSearch()
    expect(result).toBe(false)
  })

  it('searchAutoComplete lowercases q and resolves empty array', async () => {
    const result = await service.searchAutoComplete({ q: 'HeLLo' })
    expect(result).toEqual([])
  })

  it('searchV6Wrapper builds request and delegates to searchApi.getSearch', () => {
    service.searchConfig = { search: { visibleFiltersV2: { foo: 1, bar: 2 } } }
    searchApiSpy.getSearch.mockReturnValue(of({ ok: true }))
    const request = { query: 'q', filters: { x: 1 }, lastUpdatedOn: 'desc', fields: ['a'] }
    let result: any
    service.searchV6Wrapper(request).subscribe((r: any) => (result = r))
    expect(result).toEqual({ ok: true })
    expect(searchApiSpy.getSearch).toHaveBeenCalledWith({
      request: {
        query: 'q',
        filters: { x: 1 },
        sort_by: { lastUpdatedOn: 'desc' },
        facets: ['foo', 'bar'],
        fields: ['a'],
      },
    })
  })

  it('getLearning delegates to searchV6Wrapper', () => {
    service.searchConfig = { search: { visibleFiltersV2: {} } }
    searchApiSpy.getSearch.mockReturnValue(of({ ok: 1 }))
    let result: any
    service.getLearning({ query: 'q', filters: {}, fields: [] }).subscribe((r: any) => (result = r))
    expect(result).toEqual({ ok: 1 })
  })

  it('fetchSocialSearchUsers merges configSrv org info and delegates to getSearchResults', () => {
    const configSrv: ConfigurationsService = TestBed.inject(ConfigurationsService)
    configSrv.activeOrg = 'org1'
    configSrv.rootOrg = 'root1'
    searchApiSpy.getSearchResults.mockReturnValue(of({ users: [] }))
    let result: any
    service.fetchSocialSearchUsers({ q: 'hi' }).subscribe((r: any) => (result = r))
    expect(searchApiSpy.getSearchResults).toHaveBeenCalledWith({
      org: 'org1',
      rootOrg: 'root1',
      q: 'hi',
    })
    expect(result).toEqual({ users: [] })
  })

  it('fetchSearchDataDocs returns empty string as any', () => {
    expect(service.fetchSearchDataDocs({})).toBe('')
  })

  it('fetchSearchDataProjects returns empty string as any', () => {
    expect(service.fetchSearchDataProjects({})).toBe('')
  })

  describe('updateSelectedFiltersSet', () => {
    it('expands tags filter into sub-parts and marks resetable', () => {
      const result = service.updateSelectedFiltersSet({ tags: ['a/b/c'] })
      expect(result.filterReset).toBe(true)
      expect(result.filterSet.has('a')).toBe(true)
      expect(result.filterSet.has('a/b')).toBe(true)
      expect(result.filterSet.has('a/b/c')).toBe(true)
    })

    it('handles non-tags filters directly and empty filters not resetable', () => {
      const result = service.updateSelectedFiltersSet({ type: ['x', 'y'] })
      expect(result.filterReset).toBe(true)
      expect(result.filterSet.has('x')).toBe(true)
      expect(result.filterSet.has('y')).toBe(true)
    })

    it('handles undefined filters gracefully', () => {
      const result = service.updateSelectedFiltersSet(undefined as any)
      expect(result.filterReset).toBe(false)
      expect(result.filterSet.size).toBe(0)
    })
  })

  it('transformSearchV6Filters merges andFilters into a flat object', () => {
    const v6filters: any = [
      { andFilters: [{ a: 1 }, { b: 2 }] },
      { andFilters: undefined },
    ]
    const result = service.transformSearchV6Filters(v6filters)
    expect(result).toEqual({ a: 1, b: 2 })
  })

  describe('handleFilters', () => {
    const filters = [
      {
        type: 'concepts',
        content: Array.from({ length: 15 }, (_, i) => ({ type: `c${i}` })),
      },
      { type: 'dtLastModified', content: [] },
      { type: 'contentType', content: [{ type: 'ct1', children: [] }] },
      {
        type: 'topics',
        content: [
          { type: 'topic1', children: [{ type: 'child1' }] },
          { type: 'topic2' },
        ],
      },
    ]

    it('extracts concepts (max 10), drops dtLastModified, marks checked/children', () => {
      const selectedFilterSet = new Set(['child1'])
      const selectedFilters = { topics: ['topic1'] }
      const result = service.handleFilters(filters, selectedFilterSet, selectedFilters)
      expect(result.concept.length).toBe(10)
      const types = result.filtersRes.map((f: any) => f.type)
      expect(types).not.toContain('dtLastModified')
      expect(types).toContain('contentType')
      const topicsFilter = result.filtersRes.find((f: any) => f.type === 'topics')
      expect(topicsFilter.checked).toBe(true)
      expect(topicsFilter.content[0].checked).toBe(false)
      expect(topicsFilter.content[0].children[0].checked).toBe(true)
    })

    it('drops contentType filter when showContentType is true', () => {
      const result = service.handleFilters(filters, new Set(), {}, true)
      const types = result.filtersRes.map((f: any) => f.type)
      expect(types).not.toContain('contentType')
    })
  })

  it('setTilesDocs maps response into tile objects', () => {
    const response = [
      {
        authors: ['a'],
        category: 'cat',
        itemId: '1',
        itemType: 'course',
        source: 'KShop',
      },
      {
        itemId: '2',
        source: 'other',
      },
    ]
    const tiles = service.setTilesDocs(response)
    expect(tiles.length).toBe(2)
    expect(tiles[0].color).toBe('3px solid #f26522')
    expect(tiles[1].color).toBe('3px solid #28a9b2')
    expect(tiles[1].title).toBe('')
  })

  it('setTilesDocs rethrows errors', () => {
    expect(() => service.setTilesDocs([{ source: undefined }])).toThrow()
  })

  it('setTileProject maps response into project tile objects', () => {
    const response = [
      {
        itemId: 'p1',
        mstProjectName: 'Project X',
        dateStartDate: '2020-01-01',
      },
    ]
    const tiles = service.setTileProject(response)
    expect(tiles.length).toBe(1)
    expect(tiles[0].title).toBe('Project X')
    expect(tiles[0].source).toBe('PROMT')
  })

  it('setTileProject rethrows errors', () => {
    expect(() => service.setTileProject(null as any)).toThrow()
  })

  it('formatKhubFilters builds filter objects with display names', () => {
    const filters = {
      automationCentral: [{ doc_count: 3, key: 'k1' }],
      unknownType: [{ doc_count: 1, key: 'k2' }],
    }
    const result = service.formatKhubFilters(filters)
    expect(result.length).toBe(2)
    expect(result[0].displayName).toBe('Tools')
    expect(result[0].content[0]).toEqual({ count: 3, displayName: 'k1', type: 'k1' })
    expect(result[1].displayName).toBe('unknownType')
  })

  it('fetchContentOfFilter maps doc_count/key into content items', () => {
    const result = service.fetchContentOfFilter([{ doc_count: 5, key: 'abc' }])
    expect(result).toEqual([{ count: 5, displayName: 'abc', type: 'abc' }])
  })

  it('formatFilterForSearch builds a query string from filters', () => {
    const result = service.formatFilterForSearch({ type: ['a', 'b'], empty: [] })
    expect(result).toBe('"type":["a","b"]')
  })

  describe('getDisplayName', () => {
    const cases: Array<[string, string]> = [
      ['automationCentral', 'Tools'],
      ['autoGeneratedTopic', 'Topics'],
      ['topics', 'Topics'],
      ['kshopDocument', 'Kshop Document'],
      ['project', 'Project References'],
      ['kshop', 'Documents'],
      ['itemType', 'Item Type'],
      ['authors.mailId', 'Authors'],
      ['mstLocation', 'Location'],
      ['status', 'Project Status'],
      ['marketing', 'Marketing'],
      ['somethingElse', 'somethingElse'],
    ]
    cases.forEach(([input, expected]) => {
      it(`maps ${input} to ${expected}`, () => {
        expect(service.getDisplayName(input)).toBe(expected)
      })
    })
  })

  describe('getLanguageSearchIndex', () => {
    it('maps zh-CN to zh', () => {
      expect(service.getLanguageSearchIndex('zh-CN')).toBe('zh')
    })
    it('returns the same language for unmapped codes', () => {
      expect(service.getLanguageSearchIndex('en')).toBe('en')
    })
  })

  it('raiseSearchEvent dispatches a telemetry interact event', () => {
    service.raiseSearchEvent('query', { a: 1 }, 'en')
    expect(eventsSpy.dispatchEvent).toHaveBeenCalledTimes(1)
    const arg = eventsSpy.dispatchEvent.mock.calls[0][0]
    expect(arg.data.object).toEqual({ query: 'query', filters: { a: 1 }, locale: 'en' })
  })

  it('raiseSearchResponseEvent dispatches a telemetry search event', () => {
    service.raiseSearchResponseEvent('query', { a: 1 }, 42, 'en')
    expect(eventsSpy.dispatchEvent).toHaveBeenCalledTimes(1)
    const arg = eventsSpy.dispatchEvent.mock.calls[0][0]
    expect(arg.data.size).toBe(42)
    expect(arg.data.query).toBe('query')
  })

  describe('translateSearchFilters', () => {
    it('fetches translation via http when lang not cached', async () => {
      const promise = service.translateSearchFilters('fr')
      const req = httpMock.expectOne('/apis/protected/v8/translate/filterdata/fr')
      req.flush({ hello: 'bonjour' })
      const result = await promise
      expect(result).toEqual({ hello: 'bonjour' })
    })

    it('returns cached translation without an http call when already present', async () => {
      localStorage.setItem('filtersTranslation', JSON.stringify({ es: { hi: 'hola' } }))
      const result = await service.translateSearchFilters('es')
      expect(result).toEqual({ hi: 'hola' })
      httpMock.expectNone('/apis/protected/v8/translate/filterdata/es')
    })

    it('returns the "en" bucket when multiple languages requested', async () => {
      localStorage.setItem('filtersTranslation', JSON.stringify({ en: { greeting: 'hi' } }))
      const result = await service.translateSearchFilters('en,fr')
      expect(result).toEqual({ greeting: 'hi' })
    })

    it('returns empty object for multi-language request when no "en" bucket cached', async () => {
      const result = await service.translateSearchFilters('fr,de')
      expect(result).toEqual({})
    })
  })
})
