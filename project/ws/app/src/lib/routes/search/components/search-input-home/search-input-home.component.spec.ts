import { waitForAsync as async, ComponentFixture, TestBed } from '@angular/core/testing'

import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { of } from 'rxjs'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { KeycloakService } from 'keycloak-angular'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field'
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input'
import { provideNoopAnimations } from '@angular/platform-browser/animations'
import { SearchInputHomeComponent } from './search-input-home.component'
import { SearchServService } from '../../services/search-serv.service'

describe('SearchInputComponent', () => {
  let component: SearchInputHomeComponent
  let fixture: ComponentFixture<SearchInputHomeComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SearchInputHomeComponent],
    imports: [HttpClientTestingModule, MatAutocompleteModule, MatMenuModule],
    providers: [
        { provide: 'environment', useValue: {} },
        { provide: KeycloakService, useValue: createSpyObj('KeycloakService', ['getKeycloakInstance']) },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ pageData: { data: {} }, eventdata: { data: {} } }),
            paramMap: of({ get: () => null }),
            params: of({}),
            snapshot: { paramMap: { get: () => null }, queryParamMap: { get: () => null }, data: {}, params: {}, queryParams: {} },
            parent: { data: of({ eventdata: { data: {} } }), params: of({}) },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchInputHomeComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})

describe('SearchInputHomeComponent - additional coverage', () => {
  let component: SearchInputHomeComponent
  let fixture: ComponentFixture<SearchInputHomeComponent>
  let mockRouter: { navigate: jest.Mock; navigateByUrl: jest.Mock; events: any }
  let mockActivatedRoute: any
  let mockSearchServService: {
    getLanguageSearchIndex: jest.Mock
    searchAutoComplete: jest.Mock
    getSearchConfig: jest.Mock
  }
  let mockConfigurationsService: { activeLocale: any; userPreference: any }

  const buildTestBed = () => {
    TestBed.configureTestingModule({
      declarations: [SearchInputHomeComponent],
      imports: [ReactiveFormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule, MatMenuModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: SearchServService, useValue: mockSearchServService },
        { provide: ConfigurationsService, useValue: mockConfigurationsService },
      ],
    }).compileComponents()
    fixture = TestBed.createComponent(SearchInputHomeComponent)
    component = fixture.componentInstance
  }

  beforeEach(() => {
    mockRouter = { navigate: jest.fn(), navigateByUrl: jest.fn(), events: of() }
    mockActivatedRoute = {
      snapshot: {
        queryParams: { q: '' },
        data: {},
        params: {},
      },
      queryParamMap: of({ has: () => false, get: () => null }),
      parent: null,
    }
    mockSearchServService = {
      getLanguageSearchIndex: jest.fn().mockReturnValue('en'),
      searchAutoComplete: jest.fn().mockResolvedValue([{ name: 'sample' }]),
      getSearchConfig: jest.fn().mockResolvedValue({
        search: {
          isAutoCompleteAllowed: false,
          languageSearch: ['all', 'en'],
        },
      }),
    }
    mockConfigurationsService = {
      activeLocale: { locals: ['en'] },
      userPreference: null,
    }
  })

  it('autoFilter should do nothing when searchPageData is absent', () => {
    buildTestBed()
    component['route'].snapshot.data = {}
    expect(() => component.autoFilter()).not.toThrow()
  })

  it('autoFilter should subscribe to valueChanges when isAutoCompleteAllowed is true and invoke getSearchAutoCompleteResults', () => {
    jest.useFakeTimers()
    buildTestBed()
    component['route'].snapshot.data = {
      searchPageData: { data: { search: { isAutoCompleteAllowed: true, languageSearch: ['all', 'en'] } } },
    }
    const spy = jest.spyOn(component, 'getSearchAutoCompleteResults')
    component.autoFilter()
    component.queryControl.setValue('abc')
    jest.advanceTimersByTime(300)
    expect(spy).toHaveBeenCalledWith('abc')
    jest.useRealTimers()
  })

  it('autoFilter should subscribe when isAutoCompleteAllowed is undefined', () => {
    jest.useFakeTimers()
    buildTestBed()
    component['route'].snapshot.data = {
      searchPageData: { data: { search: { languageSearch: ['all', 'en'] } } },
    }
    const spy = jest.spyOn(component, 'getSearchAutoCompleteResults')
    component.autoFilter()
    component.queryControl.setValue('xyz')
    jest.advanceTimersByTime(300)
    expect(spy).toHaveBeenCalledWith('xyz')
    jest.useRealTimers()
  })

  it('autoFilter should not subscribe when isAutoCompleteAllowed is explicitly false', () => {
    buildTestBed()
    component['route'].snapshot.data = {
      searchPageData: { data: { search: { isAutoCompleteAllowed: false, languageSearch: ['all', 'en'] } } },
    }
    const spy = jest.spyOn(component, 'getSearchAutoCompleteResults')
    component.autoFilter()
    component.queryControl.setValue('nope')
    expect(spy).not.toHaveBeenCalledWith('nope')
  })

  it('init should focus native element when present and handle queryParamMap with q and lang', () => {
    const focusMock = jest.fn()
    mockActivatedRoute.queryParamMap = of({
      has: (key: string) => key === 'q' || key === 'lang',
      get: (key: string) => (key === 'q' ? 'search-term' : 'fr'),
    })
    buildTestBed()
    component.searchInputElem = { nativeElement: { focus: focusMock } } as any
    component['route'].snapshot.data = {
      searchPageData: { data: { search: { isAutoCompleteAllowed: true, languageSearch: ['all', 'en'] } } },
    }
    component.init()
    expect(focusMock).toHaveBeenCalled()
    expect(component.queryControl.value).toBe('search-term')
    expect(component.searchLocale).toBe('fr')
  })

  it('init should default queryControl to "all" when q is present but empty, and searchLocale to active locale when lang absent', () => {
    mockActivatedRoute.queryParamMap = of({
      has: (key: string) => key === 'q',
      get: () => '',
    })
    buildTestBed()
    component.searchInputElem = {} as any
    component['route'].snapshot.data = {
      searchPageData: { data: { search: { languageSearch: ['all', 'en'] } } },
    }
    component.init()
    expect(component.queryControl.value).toBe('all')
    expect(component.searchLocale).toBe(component.getActiveLocale())
  })

  it('init should not update queryControl/searchLocale when queryParamMap has neither q nor lang', () => {
    mockActivatedRoute.queryParamMap = of({ has: () => false, get: () => null })
    buildTestBed()
    component.searchInputElem = {} as any
    component['route'].snapshot.data = {
      searchPageData: { data: { search: { languageSearch: ['all', 'en'] } } },
    }
    const previousValue = component.queryControl.value
    component.init()
    expect(component.queryControl.value).toBe(previousValue)
  })

  it('init should splice preferredLanguages into languageSearch when user has multiple preferred languages', () => {
    mockConfigurationsService.userPreference = { selectedLangGroup: 'en,fr' }
    buildTestBed()
    component.searchInputElem = {} as any
    component['route'].snapshot.data = {
      searchPageData: { data: { search: { isAutoCompleteAllowed: false, languageSearch: ['all', 'en', 'fr'] } } },
    }
    component.init()
    expect(component.languageSearch.length).toBeGreaterThan(2)
  })

  it('getActiveLocale should fall back to "en" when activeLocale is not set', () => {
    mockConfigurationsService.activeLocale = null
    buildTestBed()
    expect(component.getActiveLocale()).toBe('en')
    expect(mockSearchServService.getLanguageSearchIndex).toHaveBeenCalledWith('en')
  })

  it('preferredLanguages getter should return null when userPreference is absent', () => {
    buildTestBed()
    expect(component.preferredLanguages).toBeNull()
  })

  it('preferredLanguages getter should build a joined language string when userPreference is present', () => {
    mockConfigurationsService.userPreference = { selectedLangGroup: 'en,fr' }
    buildTestBed()
    expect(component.preferredLanguages).toBe('en,en')
  })

  it('ngOnDestroy should complete the destroy$ subject without throwing', () => {
    buildTestBed()
    expect(() => component.ngOnDestroy()).not.toThrow()
  })

  it('updateQuery should blur input, emit closed and navigate to /app/search when ref is "home"', () => {
    buildTestBed()
    const blurMock = jest.fn()
    component.searchInputElem = { nativeElement: { blur: blurMock } } as any
    component.ref = 'home'
    const closedSpy = jest.spyOn(component.closed, 'emit')
    component.updateQuery('  hello  ')
    expect(blurMock).toHaveBeenCalled()
    expect(closedSpy).toHaveBeenCalledWith(false)
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/search'], {
      queryParams: { q: 'hello' },
      queryParamsHandling: 'merge',
    })
  })

  it('updateQuery should navigate relative to parent when ref is not "home"', () => {
    buildTestBed()
    component.searchInputElem = {} as any
    component.ref = 'other'
    component.updateQuery('term')
    expect(mockRouter.navigate).toHaveBeenCalledWith([], {
      relativeTo: component['activated'].parent,
      queryParams: { q: 'term' },
      queryParamsHandling: 'merge',
    })
  })

  it('updateQuery should not blur when searchInputElem has no nativeElement', () => {
    buildTestBed()
    component.searchInputElem = {} as any
    component.ref = 'other'
    expect(() => component.updateQuery('term')).not.toThrow()
  })

  it('getSearchAutoCompleteResults should set autoCompleteResults on success for a single-segment locale', async () => {
    buildTestBed()
    component.searchLocale = 'en'
    component.getSearchAutoCompleteResults('query')
    await fixture.whenStable()
    expect(mockSearchServService.searchAutoComplete).toHaveBeenCalledWith({ q: 'query', l: 'en' })
    expect(component.autoCompleteResults).toEqual([{ name: 'sample' }])
  })

  it('getSearchAutoCompleteResults should swallow errors from searchAutoComplete', async () => {
    mockSearchServService.searchAutoComplete = jest.fn().mockRejectedValue(new Error('boom'))
    buildTestBed()
    component.searchLocale = 'en'
    expect(() => component.getSearchAutoCompleteResults('query')).not.toThrow()
    await fixture.whenStable()
    expect(mockSearchServService.searchAutoComplete).toHaveBeenCalled()
  })

  it('getSearchAutoCompleteResults should skip the call when searchLocale has multiple segments', () => {
    buildTestBed()
    component.searchLocale = 'en,fr'
    component.getSearchAutoCompleteResults('query')
    expect(mockSearchServService.searchAutoComplete).not.toHaveBeenCalled()
  })

  it('searchLanguage should navigate with lang and current query value', () => {
    buildTestBed()
    component.queryControl.setValue('term')
    component.searchLanguage('fr')
    expect(mockRouter.navigate).toHaveBeenCalledWith([], {
      relativeTo: component['activated'].parent,
      queryParams: { lang: 'fr', q: 'term' },
      queryParamsHandling: 'merge',
    })
  })

  it('ngOnInit should populate searchPageData via getSearchConfig and invoke autoFilter/init', async () => {
    buildTestBed()
    const autoFilterSpy = jest.spyOn(component, 'autoFilter')
    const initSpy = jest.spyOn(component, 'init')
    fixture.detectChanges()
    await fixture.whenStable()
    expect(mockSearchServService.getSearchConfig).toHaveBeenCalled()
    expect(autoFilterSpy).toHaveBeenCalled()
    expect(initSpy).toHaveBeenCalled()
  })
})
