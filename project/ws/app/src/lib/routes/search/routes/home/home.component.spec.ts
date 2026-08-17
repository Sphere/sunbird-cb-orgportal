import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { Subject } from 'rxjs'
import { KeycloakService } from 'keycloak-angular'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { MatMenuModule } from '@angular/material/menu'
import { MatAutocompleteModule } from '@angular/material/autocomplete'

import { HomeComponent } from './home.component'
import { SearchServService } from '../../services/search-serv.service'

describe('HomeComponent', () => {
  let component: HomeComponent
  let fixture: ComponentFixture<HomeComponent>
  let router: jest.Mocked<Router>
  let searchSvc: jest.Mocked<SearchServService>
  let configSvc: any
  let queryParamMap$: Subject<any>

  const build = (opts: {
    isAutoCompleteAllowed?: boolean
    languageSearch?: string[]
    userPreference?: any
    activeLocale?: any
    parent?: any
  } = {}) => {
    queryParamMap$ = new Subject<any>()
    router = createSpyObj<Router>('Router', ['navigate'])
    router.navigate.mockReturnValue(Promise.resolve(true))
    searchSvc = createSpyObj<SearchServService>('SearchServService', ['getLanguageSearchIndex', 'searchAutoComplete', 'getSearchConfig'])
    searchSvc.getLanguageSearchIndex.mockImplementation((l: string) => l)
    searchSvc.searchAutoComplete.mockResolvedValue([])
    searchSvc.getSearchConfig.mockResolvedValue({ search: { suggestedFilters: [] } })
    configSvc = {
      pageNavBar: {},
      activeLocale: opts.activeLocale,
      userPreference: opts.userPreference,
    }

    TestBed.configureTestingModule({
      imports: [MatMenuModule, MatAutocompleteModule],
      declarations: [HomeComponent],
      providers: [
        { provide: 'environment', useValue: {} },
        { provide: KeycloakService, useValue: createSpyObj('KeycloakService', ['getKeycloakInstance']) },
        { provide: Router, useValue: router },
        { provide: SearchServService, useValue: searchSvc },
        { provide: ConfigurationsService, useValue: configSvc },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                pageData: {
                  data: {
                    search: {
                      isAutoCompleteAllowed: opts.isAutoCompleteAllowed,
                      languageSearch: opts.languageSearch || ['all', 'en'],
                    },
                  },
                },
              },
            },
            queryParamMap: queryParamMap$.asObservable(),
            parent: opts.parent ?? null,
          },
        },
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(HomeComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  afterEach(() => TestBed.resetTestingModule())

  it('should create', () => {
    build()
    expect(component).toBeTruthy()
  })

  describe('constructor auto-complete wiring', () => {
    it('should wire up auto-complete when isAutoCompleteAllowed is undefined', fakeAsync(() => {
      build({ isAutoCompleteAllowed: undefined })
      component.query.setValue('term')
      tick(200)
      expect(searchSvc.searchAutoComplete).toHaveBeenCalled()
    }))

    it('should wire up auto-complete when isAutoCompleteAllowed is true', fakeAsync(() => {
      build({ isAutoCompleteAllowed: true })
      component.query.setValue('term')
      tick(200)
      expect(searchSvc.searchAutoComplete).toHaveBeenCalled()
    }))

    it('should not wire up auto-complete when isAutoCompleteAllowed is false', fakeAsync(() => {
      build({ isAutoCompleteAllowed: false })
      searchSvc.searchAutoComplete.mockClear()
      component.query.setValue('term')
      tick(200)
      expect(searchSvc.searchAutoComplete).not.toHaveBeenCalled()
    }))
  })

  describe('search', () => {
    it('should navigate to search/home then search/learning with the given query', () => {
      build()
      component.search('hello')
      expect(router.navigate).toHaveBeenCalledWith(
        ['/app/search/home'], expect.objectContaining({ queryParams: expect.objectContaining({ q: 'hello' }) }),
      )
    })

    it('should default to searchQuery.q when no query is given', () => {
      build()
      component.searchQuery.q = 'default'
      component.search()
      expect(router.navigate).toHaveBeenCalledWith(
        ['/app/search/home'], expect.objectContaining({ queryParams: expect.objectContaining({ q: 'default' }) }),
      )
    })
  })

  describe('searchWithFilter', () => {
    it('should build a contentType filter', () => {
      build()
      component.searchWithFilter({ contentType: 'Course' })
      expect(router.navigate).toHaveBeenCalled()
    })

    it('should build a resourceType filter', () => {
      build()
      component.searchWithFilter({ resourceType: 'video' })
      expect(router.navigate).toHaveBeenCalled()
    })

    it('should build a learningContent combinedType filter', () => {
      build()
      component.searchWithFilter({ combinedType: 'learningContent' })
      expect(router.navigate).toHaveBeenCalled()
    })

    it('should default to an empty filter otherwise', () => {
      build()
      component.searchWithFilter({})
      expect(router.navigate).toHaveBeenCalled()
    })
  })

  describe('getActivateLocale', () => {
    it('should default to en when there is no active locale', () => {
      build({ activeLocale: undefined })
      expect(component.getActivateLocale()).toBe('en')
    })

    it('should use the first configured locale', () => {
      build({ activeLocale: { locals: ['fr'] } })
      expect(component.getActivateLocale()).toBe('fr')
    })
  })

  describe('preferredLanguages', () => {
    it('should return null without a userPreference', () => {
      build({ userPreference: undefined })
      expect(component.preferredLanguages).toBeNull()
    })

    it('should join mapped preferred languages', () => {
      build({ userPreference: { selectedLangGroup: 'en,fr' } })
      expect(component.preferredLanguages).toBe('en,fr')
    })
  })

  it('swapRemove should move an element from one index to another', () => {
    build()
    const arr = ['a', 'b', 'c']
    component.swapRemove(arr, 2, 0)
    expect(arr).toEqual(['c', 'a', 'b'])
  })

  describe('getAutoCompleteResults', () => {
    it('should populate autoCompleteResults on success', async () => {
      build()
      searchSvc.searchAutoComplete.mockResolvedValue([{ _source: { searchTerm: 'x' } }])
      component.getAutoCompleteResults()
      await Promise.resolve()
      expect(component.autoCompleteResults).toEqual([{ _source: { searchTerm: 'x' } }])
    })

    it('should swallow errors', async () => {
      build()
      searchSvc.searchAutoComplete.mockRejectedValue(new Error('boom'))
      expect(() => component.getAutoCompleteResults()).not.toThrow()
      await Promise.resolve()
    })
  })

  it('searchLanguage should navigate with merged query params then refresh auto-complete', () => {
    build({ parent: {} })
    component.searchLanguage('fr')
    expect(router.navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParamsHandling: 'merge' }))
  })

  describe('ngOnInit', () => {
    it('should seed the search query from queryParamMap when present', () => {
      build()
      queryParamMap$.next({ has: (k: string) => k === 'q', get: () => 'term' })
      expect(component.searchQuery.q).toBe('term')
    })

    it('should default the query to empty when absent', () => {
      build()
      queryParamMap$.next({ has: () => false, get: () => null })
      expect(component.searchQuery.q).toBe('')
    })

    it('should seed the language from queryParamMap when present', () => {
      build()
      queryParamMap$.next({ has: (k: string) => k === 'lang', get: () => 'fr' })
      expect(component.searchQuery.l).toBe('fr')
    })

    it('should splice in preferredLanguages when there is more than one', () => {
      build({ userPreference: { selectedLangGroup: 'en,fr' }, languageSearch: ['all', 'en', 'fr'] })
      queryParamMap$.next({ has: () => false, get: () => null })
      expect(component.languageSearch).toContain('en,fr')
    })

    it('should populate suggestedFilters from the search config', async () => {
      build()
      // ngOnInit already fired during build()'s detectChanges and called
      // getSearchConfig() once; re-set the mock and call ngOnInit again to
      // observe the new resolved value.
      searchSvc.getSearchConfig.mockResolvedValue({ search: { suggestedFilters: [{ name: 'f1' }] } })
      component.ngOnInit()
      queryParamMap$.next({ has: () => false, get: () => null })
      await Promise.resolve()
      expect(component.suggestedFilters).toEqual([{ name: 'f1' }])
    })
  })

  it('ngOnDestroy should complete the destroy subject', () => {
    build()
    const completeSpy = jest.spyOn((component as any).destroy$, 'complete')
    component.ngOnDestroy()
    expect(completeSpy).toHaveBeenCalled()
  })
})
