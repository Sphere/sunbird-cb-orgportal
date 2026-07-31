import { HttpClientTestingModule } from '@angular/common/http/testing'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { UtilityService } from '../../../home/services/utility.service'
import { of, Subject } from 'rxjs'
import { KeycloakService } from 'keycloak-angular'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'

import { LearningComponent } from './learning.component'

describe('LearningComponent', () => {
  let component: LearningComponent
  let fixture: ComponentFixture<LearningComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatMenuModule],
      declarations: [LearningComponent],
      providers: [
        { provide: 'environment', useValue: {} },
        { provide: KeycloakService, useValue: createSpyObj('KeycloakService', ['getKeycloakInstance']) },
        UtilityService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                pageroute: 'learning',
                pageData: {
                  data: {
                    search: {
                      tabs: [
                        {
                          titleKey: 'learning',
                          phraseSearch: true,
                          isStandAlone: true,
                          acrossPreferredLang: false,
                          searchQuery: { filters: {} },
                        },
                      ],
                    },
                  },
                },
              },
              queryParamMap: {
                get: () => null,
              },
            },
            queryParamMap: of({
              has: () => false,
              get: () => null,
            }),
            parent: null,
          },
        },
      ],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(LearningComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})

describe('LearningComponent (direct instantiation)', () => {
  let component: LearningComponent
  let activatedMock: any
  let routerMock: any
  let valueSvcMock: any
  let searchServMock: any
  let configSvcMock: any
  let utilitySvcMock: any
  let isLtMediumSubject: Subject<boolean>
  let queryParamMapSubject: Subject<any>

  function buildActivated(overrides: any = {}) {
    return {
      snapshot: {
        data: {
          pageroute: 'learning',
          pageData: {
            data: {
              search: {
                tabs: [
                  {
                    titleKey: 'learning',
                    phraseSearch: true,
                    isStandAlone: true,
                    acrossPreferredLang: false,
                    searchQuery: { filters: {} },
                  },
                ],
              },
            },
          },
        },
        queryParamMap: {
          get: () => null,
        },
      },
      queryParamMap: queryParamMapSubject.asObservable(),
      parent: {},
      ...overrides,
    }
  }

  beforeEach(() => {
    isLtMediumSubject = new Subject<boolean>()
    queryParamMapSubject = new Subject<any>()

    activatedMock = buildActivated()

    routerMock = {
      navigate: jest.fn().mockResolvedValue(true),
    }

    valueSvcMock = {
      isLtMedium$: isLtMediumSubject.asObservable(),
    }

    searchServMock = {
      getLanguageSearchIndex: jest.fn((locale: string) => locale),
      translateSearchFilters: jest.fn().mockResolvedValue({ someKey: 'someVal' }),
      updateSelectedFiltersSet: jest.fn().mockReturnValue({ filterSet: new Set(['a']), filterReset: true }),
      raiseSearchEvent: jest.fn(),
      raiseSearchResponseEvent: jest.fn(),
      handleFilters: jest.fn().mockReturnValue({ filtersRes: [] }),
      getLearning: jest.fn().mockReturnValue(of({
        totalHits: 0,
        result: [],
        filters: [],
        queryUsed: '',
        doYouMean: '',
      })),
      searchConfig: {},
    }

    configSvcMock = {
      activeLocale: { locals: ['en'] },
      userPreference: { selectedLangGroup: 'en', selectedLocale: 'en' },
      prefChangeNotifier: new Subject<void>(),
      isIntranetAllowed: true,
      restrictedFeatures: new Set(['other']),
    }

    utilitySvcMock = {
      isMobile: false,
    }

    component = new LearningComponent(
      activatedMock,
      routerMock,
      valueSvcMock,
      searchServMock,
      configSvcMock,
      utilitySvcMock,
    )
  })

  it('should be created', () => {
    expect(component).toBeTruthy()
  })

  describe('getActiveLocale', () => {
    it('returns language search index using active locale', () => {
      const result = component.getActiveLocale()
      expect(searchServMock.getLanguageSearchIndex).toHaveBeenCalledWith('en')
      expect(result).toBe('en')
    })

    it('falls back to empty string when activeLocale missing', () => {
      configSvcMock.activeLocale = null
      component.getActiveLocale()
      expect(searchServMock.getLanguageSearchIndex).toHaveBeenCalledWith('')
    })
  })

  describe('applyPhraseSearch', () => {
    it('returns true when phraseSearch is true', () => {
      expect(component.applyPhraseSearch).toBe(true)
    })

    it('returns true when phraseSearch is undefined', () => {
      activatedMock.snapshot.data.pageData.data.search.tabs[0].phraseSearch = undefined
      expect(component.applyPhraseSearch).toBe(true)
    })

    it('returns false when phraseSearch is false', () => {
      activatedMock.snapshot.data.pageData.data.search.tabs[0].phraseSearch = false
      expect(component.applyPhraseSearch).toBe(false)
    })
  })

  describe('applyIsStandAlone', () => {
    it('returns true when isStandAlone is true', () => {
      expect(component.applyIsStandAlone).toBe(true)
    })

    it('returns false when isStandAlone is false', () => {
      activatedMock.snapshot.data.pageData.data.search.tabs[0].isStandAlone = false
      expect(component.applyIsStandAlone).toBe(false)
    })
  })

  describe('filtersFromConfig', () => {
    it('returns configured filters from the first tab', () => {
      activatedMock.snapshot.data.pageData.data.search.tabs[0].searchQuery.filters = { category: ['x'] }
      expect(component.filtersFromConfig).toEqual({ category: ['x'] })
    })
  })

  describe('isDefaultFilterApplied', () => {
    it('returns false when there are no default filters configured', () => {
      activatedMock.snapshot.data.pageData.data.search.tabs[0].searchQuery.filters = {}
      expect(component.isDefaultFilterApplied).toBe(false)
    })

    it('returns true when applied filters match default filters exactly', () => {
      activatedMock.snapshot.data.pageData.data.search.tabs[0].searchQuery.filters = { category: ['x'] }
      component.searchRequestObject.filters = { category: ['x'] }
      expect(component.isDefaultFilterApplied).toBe(true)
    })

    it('returns false when applied filters differ from default filters', () => {
      activatedMock.snapshot.data.pageData.data.search.tabs[0].searchQuery.filters = { category: ['x'] }
      component.searchRequestObject.filters = { category: ['y'] }
      expect(component.isDefaultFilterApplied).toBe(false)
    })
  })

  describe('preferredLanguages', () => {
    it('returns joined preferred languages from user preference', () => {
      configSvcMock.userPreference = { selectedLangGroup: 'en,hi' }
      const result = component.preferredLanguages
      expect(result).toBe('en,hi')
    })

    it('returns "en" when no user preference selectedLangGroup is set', () => {
      configSvcMock.userPreference = null
      expect(component.preferredLanguages).toBe('en')
    })
  })

  describe('searchAcrossPreferredLang', () => {
    it('returns false when acrossPreferredLang tab config is falsy', () => {
      activatedMock.snapshot.data.pageData.data.search.tabs[0].acrossPreferredLang = false
      expect(component.searchAcrossPreferredLang).toBe(false)
    })

    it('returns true when locale does not match preferred languages', () => {
      activatedMock.snapshot.data.pageData.data.search.tabs[0].acrossPreferredLang = true
      component.searchRequestObject.locale = ['fr']
      configSvcMock.userPreference = { selectedLangGroup: 'en' }
      expect(component.searchAcrossPreferredLang).toBe(true)
    })

    it('returns false when locale matches preferred languages', () => {
      activatedMock.snapshot.data.pageData.data.search.tabs[0].acrossPreferredLang = true
      configSvcMock.userPreference = { selectedLangGroup: 'en' }
      component.searchRequestObject.locale = ['en']
      expect(component.searchAcrossPreferredLang).toBe(false)
    })
  })

  describe('removeDefaultFiltersApplied', () => {
    it('does nothing when default filters key missing from applied filters', () => {
      activatedMock.snapshot.data.pageData.data.search.tabs[0].searchQuery.filters = { category: ['x'] }
      component.searchRequestObject.filters = {}
      component.removeDefaultFiltersApplied()
      expect(routerMock.navigate).not.toHaveBeenCalled()
    })

    it('does nothing when default and applied filters differ', () => {
      activatedMock.snapshot.data.pageData.data.search.tabs[0].searchQuery.filters = { category: ['x'] }
      component.searchRequestObject.filters = { category: ['y'] }
      component.removeDefaultFiltersApplied()
      expect(routerMock.navigate).not.toHaveBeenCalled()
    })

    it('navigates with default filters removed when they match', () => {
      activatedMock.snapshot.data.pageData.data.search.tabs[0].searchQuery.filters = { category: ['x'] }
      component.searchRequestObject.filters = { category: ['x'], other: ['y'] }
      component.removeDefaultFiltersApplied()
      expect(routerMock.navigate).toHaveBeenCalledWith([], {
        queryParams: { f: JSON.stringify({ other: ['y'] }) },
        relativeTo: activatedMock.parent,
        queryParamsHandling: 'merge',
      })
    })
  })

  describe('searchWithPreferredLanguage', () => {
    it('navigates with preferred language query param', () => {
      configSvcMock.userPreference = { selectedLangGroup: 'en' }
      component.searchWithPreferredLanguage()
      expect(routerMock.navigate).toHaveBeenCalledWith([], {
        queryParams: { lang: 'en' },
        relativeTo: activatedMock.parent,
        queryParamsHandling: 'merge',
      })
    })
  })

  describe('ft', () => {
    it('deletes prop from the object', () => {
      const obj = { prop: 'value' }
      component.ft(obj)
      expect(obj.prop).toBeUndefined()
    })
  })

  describe('contentTrackBy', () => {
    it('returns the identifier of an item', () => {
      expect(component.contentTrackBy({ identifier: 'abc123' } as any)).toBe('abc123')
    })
  })

  describe('sortOrder', () => {
    it('navigates with sort query param', () => {
      component.sortOrder('duration')
      expect(routerMock.navigate).toHaveBeenCalledWith([], {
        queryParams: { sort: 'duration' },
        queryParamsHandling: 'merge',
        relativeTo: activatedMock.parent,
      })
    })

    it('propagates errors thrown by router.navigate', () => {
      routerMock.navigate = jest.fn(() => { throw new Error('nav failed') })
      expect(() => component.sortOrder('duration')).toThrow('nav failed')
    })
  })

  describe('getSortType', () => {
    it('returns lastUpdatedOn desc for "lastUpdatedOn"', () => {
      expect(component.getSortType('lastUpdatedOn')).toEqual([{ lastUpdatedOn: 'desc' }])
    })

    it('returns duration desc for "duration"', () => {
      expect(component.getSortType('duration')).toEqual([{ duration: 'desc' }])
    })

    it('returns size desc for "size"', () => {
      expect(component.getSortType('size')).toEqual([{ size: 'desc' }])
    })

    it('returns default lastUpdatedOn desc for unknown sort types', () => {
      expect(component.getSortType('unknown')).toEqual([{ lastUpdatedOn: 'desc' }])
    })
  })

  describe('searchLanguage', () => {
    it('navigates with lang query param and resets expandToPrefLang on success', async () => {
      component.expandToPrefLang = true
      await component.searchLanguage('hi')
      expect(routerMock.navigate).toHaveBeenCalledWith([], {
        queryParams: { lang: 'hi' },
        queryParamsHandling: 'merge',
        relativeTo: activatedMock.parent,
      })
      expect(component.expandToPrefLang).toBe(false)
    })

    it('propagates errors thrown synchronously by router.navigate', () => {
      routerMock.navigate = jest.fn(() => { throw new Error('boom') })
      expect(() => component.searchLanguage('hi')).toThrow('boom')
    })
  })

  describe('didYouMeanSearch', () => {
    it('strips <em> tags and navigates with cleaned query', () => {
      component.didYouMeanSearch('<em>hello</em>')
      expect(routerMock.navigate).toHaveBeenCalledWith([], {
        queryParams: { q: 'hello' },
        queryParamsHandling: 'merge',
        relativeTo: activatedMock.parent,
      })
    })
  })

  describe('searchInsteadFor', () => {
    it('clears results and refetches without didYouMean', () => {
      component.searchResults.result = [{ identifier: '1' } as any]
      const spy = jest.spyOn(component, 'getResults')
      component.searchInsteadFor()
      expect(component.searchResults.result).toEqual([])
      expect(spy).toHaveBeenCalledWith(undefined, false)
    })
  })

  describe('removeFilters', () => {
    it('navigates clearing filters but keeping query', () => {
      component.searchRequestObject.query = 'javascript'
      component.removeFilters()
      expect(routerMock.navigate).toHaveBeenCalledWith([], {
        queryParams: { f: null, q: 'javascript' },
        relativeTo: activatedMock.parent,
      })
    })
  })

  describe('removeLanguage', () => {
    it('clears language and navigates with existing filters/query', () => {
      component.searchRequest.filters = { category: ['x'] }
      component.searchRequestObject.query = 'javascript'
      component.removeLanguage()
      expect(component.searchRequest.lang).toBe('')
      expect(routerMock.navigate).toHaveBeenCalledWith([], {
        queryParams: {
          f: JSON.stringify({ category: ['x'] }),
          q: 'javascript',
          lang: null,
        },
        relativeTo: activatedMock.parent,
      })
    })
  })

  describe('closeFilter', () => {
    it('sets sideNavBarOpened to the provided value', () => {
      component.closeFilter(false)
      expect(component.sideNavBarOpened).toBe(false)
      component.closeFilter(true)
      expect(component.sideNavBarOpened).toBe(true)
    })
  })

  describe('ngOnDestroy', () => {
    it('unsubscribes from all active subscriptions', () => {
      const sub1 = { unsubscribe: jest.fn() }
      const sub2 = { unsubscribe: jest.fn() }
      const sub3 = { unsubscribe: jest.fn() }
      component.searchResultsSubscription = sub1 as any
      component.defaultSideNavBarOpenedSubscription = sub2 as any
      component.prefChangeSubscription = sub3 as any
      component.ngOnDestroy()
      expect(sub1.unsubscribe).toHaveBeenCalled()
      expect(sub2.unsubscribe).toHaveBeenCalled()
      expect(sub3.unsubscribe).toHaveBeenCalled()
    })

    it('does not throw when subscriptions are null', () => {
      component.searchResultsSubscription = undefined
      component.defaultSideNavBarOpenedSubscription = null
      component.prefChangeSubscription = null
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })

  describe('ngOnInit', () => {
    it('subscribes to preference changes and toggles intranet setting', () => {
      component.ngOnInit()
      configSvcMock.isIntranetAllowed = false
      configSvcMock.prefChangeNotifier.next()
      expect(component.isIntranetAllowedSettings).toBe(false)
    })

    it('reacts to isLtMedium$ emissions by toggling side nav state', () => {
      component.ngOnInit()
      isLtMediumSubject.next(true)
      expect(component.screenSizeIsLtMedium).toBe(true)
      expect(component.sideNavBarOpened).toBe(false)

      isLtMediumSubject.next(false)
      expect(component.screenSizeIsLtMedium).toBe(false)
      expect(component.sideNavBarOpened).toBe(true)
    })

    it('navigates to apply default config filters when query has no "f" param', () => {
      activatedMock.snapshot.data.pageData.data.search.tabs[0].searchQuery.filters = { category: ['x'] }
      activatedMock.snapshot.queryParamMap.get = () => null
      component.ngOnInit()
      expect(routerMock.navigate).toHaveBeenCalledWith([], {
        queryParams: { f: JSON.stringify({ category: ['x'] }) },
        relativeTo: activatedMock.parent,
        queryParamsHandling: 'merge',
      })
    })

    it('sets translatedFilters once translateSearchFilters resolves', async () => {
      component.ngOnInit()
      await Promise.resolve()
      await Promise.resolve()
      expect(component.translatedFilters).toEqual({ someKey: 'someVal' })
    })

    it('processes query params, sets routeComp and applies matching tab filters', () => {
      activatedMock.snapshot.data.pageroute = 'other'
      activatedMock.snapshot.data.pageData.data.search.tabs[0].titleKey = 'other'
      activatedMock.snapshot.data.pageData.data.search.tabs[0].searchQuery.filters = { category: ['x'] }
      component.ngOnInit()

      queryParamMapSubject.next({
        has: (key: string) => key === 'q',
        get: (key: string) => (key === 'q' ? 'javascript' : null),
      })

      expect(component.routeComp).toBe('other')
      expect(component.searchRequestObject.filters).toEqual({ category: ['x'] })
      expect(component.searchRequestObject.query).toBe('javascript')
    })

    it('sets routeComp without applying filters when route is "learning"', () => {
      component.ngOnInit()
      queryParamMapSubject.next({
        has: () => false,
        get: () => null,
      })
      expect(component.routeComp).toBe('learning')
      expect(component.searchRequestObject.filters).toEqual({})
    })

    it('applies isInIntranet filter when mobile and intranet not allowed', () => {
      utilitySvcMock.isMobile = true
      configSvcMock.isIntranetAllowed = false
      component.ngOnInit()
      configSvcMock.prefChangeNotifier.next()
      queryParamMapSubject.next({
        has: () => false,
        get: () => null,
      })
      expect(component.searchRequestObject.filters['isInIntranet']).toEqual(['false'])
    })

    it('merges filters from "f" query param into the search request object', () => {
      component.ngOnInit()
      queryParamMapSubject.next({
        has: (key: string) => key === 'f',
        get: (key: string) => (key === 'f' ? JSON.stringify({ category: ['java'] }) : null),
      })
      expect(component.searchRequestObject.filters['category']).toEqual(['java'])
    })

    it('reads sort from query param via getSortType when sort already exists on the request object', () => {
      component.searchRequestObject.sort = [{ lastUpdatedOn: 'desc' }]
      const spy = jest.spyOn(component, 'getSortType')
      component.ngOnInit()
      queryParamMapSubject.next({
        has: (key: string) => key === 'sort',
        get: (key: string) => (key === 'sort' ? 'duration' : null),
      })
      expect(spy).toHaveBeenCalledWith('duration')
      // query is empty by default, so the later "no-query" branch resets sort to lastUpdatedOn desc
      expect(component.searchRequestObject.sort).toEqual([{ lastUpdatedOn: 'desc' }])
    })

    it('lowercases and splits language into locale array', () => {
      component.ngOnInit()
      queryParamMapSubject.next({
        has: (key: string) => key === 'lang',
        get: (key: string) => (key === 'lang' ? 'EN,HI' : null),
      })
      expect(component.searchRequest.lang).toBe('en,hi')
      expect(component.searchRequestObject.locale).toEqual(['en', 'hi'])
    })

    it('sets sort to lastUpdatedOn desc when query is "all"', () => {
      component.ngOnInit()
      queryParamMapSubject.next({
        has: (key: string) => key === 'q',
        get: (key: string) => (key === 'q' ? 'all' : null),
      })
      expect(component.searchRequestObject.sort).toEqual([{ lastUpdatedOn: 'desc' }])
    })

    it('clears sort and marks isStandAlone when a real query is provided without contentType filter', () => {
      component.ngOnInit()
      queryParamMapSubject.next({
        has: (key: string) => key === 'q',
        get: (key: string) => (key === 'q' ? 'javascript' : null),
      })
      expect(component.searchRequestObject.sort).toEqual([])
      expect(component.searchRequestObject.isStandAlone).toBe(true)
    })

    it('resets pageNo to 0 when it was previously non-zero', () => {
      component.searchRequestObject.pageNo = 5
      component.ngOnInit()
      queryParamMapSubject.next({
        has: () => false,
        get: () => null,
      })
      expect(component.searchRequestObject.pageNo).toBe(0)
    })

    it('calls getResults after processing query params', () => {
      const spy = jest.spyOn(component, 'getResults')
      component.ngOnInit()
      queryParamMapSubject.next({
        has: () => false,
        get: () => null,
      })
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('getResults', () => {
    it('sets status to fetching then done, and populates results on success', () => {
      component.searchRequestObject.query = 'javascript'
      searchServMock.getLearning.mockReturnValue(of({
        totalHits: 1,
        result: [{ identifier: '1' }],
        filters: [],
        queryUsed: 'javascript',
        doYouMean: '',
      }))
      component.getResults(true)
      expect(component.searchRequestStatus).toBe('done')
      expect(component.searchResults.totalHits).toBe(1)
      expect(component.searchResults.result).toEqual([{ identifier: '1' }])
    })

    it('wraps multi-word query in quotes when no explicit withQuotes flag is passed', () => {
      component.searchRequestObject.query = 'hello world'
      component.searchRequestObject.pageNo = 0
      component.exactResult.applied = false
      searchServMock.getLearning.mockReturnValue(of({
        totalHits: 1,
        result: [{ identifier: '1' }],
        filters: [],
        queryUsed: '',
        doYouMean: '',
      }))
      component.getResults(undefined)
      expect(component.searchRequestObject.query).toBe('"hello world"')
    })

    it('strips quotes and marks exactResult applied when withQuotes is true', () => {
      component.searchRequestObject.query = 'hello world'
      searchServMock.getLearning.mockReturnValue(of({
        totalHits: 0,
        result: [],
        filters: [],
        queryUsed: '',
        doYouMean: '',
      }))
      component.getResults(true)
      expect(component.exactResult.applied).toBe(true)
      expect(component.searchRequestObject.query).toBe('hello world')
    })

    it('sets noContent true when there are no results for a single-word query', () => {
      component.searchRequestObject.query = 'zzz'
      searchServMock.getLearning.mockReturnValue(of({
        totalHits: 0,
        result: [],
        filters: [],
        queryUsed: '',
        doYouMean: '',
      }))
      component.getResults(true)
      expect(component.noContent).toBe(true)
    })

    it('sets searchRequestStatus to hasMore when more results are available than currently loaded', () => {
      component.searchRequestObject.query = 'zzz'
      component.searchRequestObject.pageNo = 0
      searchServMock.getLearning.mockReturnValue(of({
        totalHits: 5,
        result: [{ identifier: '1' }],
        filters: [],
        queryUsed: '',
        doYouMean: '',
      }))
      component.getResults(true)
      expect(component.searchRequestStatus).toBe('hasMore')
      expect(component.searchRequestObject.pageNo).toBe(1)
    })

    it('sets error state when the search subscription errors out', () => {
      searchServMock.getLearning.mockReturnValue({
        subscribe: (_next: any, errorCb: any) => {
          errorCb('network error')
          return { unsubscribe: jest.fn() }
        },
      })
      component.getResults(true)
      expect(component.error.load).toBe(true)
      expect(component.error.message).toBe('network error')
      expect(component.searchRequestStatus).toBe('done')
    })

    it('unsubscribes from a previous in-flight search before issuing a new one', () => {
      const unsubscribe = jest.fn()
      component.searchResultsSubscription = { unsubscribe } as any
      searchServMock.getLearning.mockReturnValue(of({
        totalHits: 0,
        result: [],
        filters: [],
        queryUsed: '',
        doYouMean: '',
      }))
      component.getResults(true)
      expect(unsubscribe).toHaveBeenCalled()
    })

    it('sets didYouMean to false when multiple locales are used', () => {
      component.searchRequestObject.locale = ['en', 'hi']
      searchServMock.getLearning.mockReturnValue(of({
        totalHits: 0,
        result: [],
        filters: [],
        queryUsed: '',
        doYouMean: '',
      }))
      component.getResults(true)
      expect(component.searchRequestObject.didYouMean).toBe(false)
    })
  })
})
