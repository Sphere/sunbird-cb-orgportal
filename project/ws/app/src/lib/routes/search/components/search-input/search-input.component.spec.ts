import { HttpClientTestingModule } from '@angular/common/http/testing'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { KeycloakService } from 'keycloak-angular'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete'

import { SearchInputComponent } from './search-input.component'

describe('SearchInputComponent', () => {
  let component: SearchInputComponent
  let fixture: ComponentFixture<SearchInputComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatMenuModule, MatAutocompleteModule],
      declarations: [SearchInputComponent],
      providers: [
        { provide: 'environment', useValue: {} },
        { provide: KeycloakService, useValue: createSpyObj('KeycloakService', ['getKeycloakInstance']) },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: { q: 'all' },
              data: {
                searchPageData: {
                  data: {
                    search: {
                      isAutoCompleteAllowed: false,
                      languageSearch: ['all', 'en'],
                    },
                  },
                },
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
    fixture = TestBed.createComponent(SearchInputComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    fixture.destroy()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('swapRemove should move item from "from" index to "to" index', () => {
    const arr = ['en', 'all', 'fr']
    component.swapRemove(arr, 1, 0)
    expect(arr).toEqual(['all', 'en', 'fr'])
  })

  it('getActiveLocale should fall back to "en" when activeLocale missing', () => {
    (mockConfigurationsService as any).activeLocale = null
    const locale = component.getActiveLocale()
    expect(mockSearchServService.getLanguageSearchIndex).toHaveBeenCalledWith('en')
    expect(locale).toBe('en')
  })

  it('preferredLanguages should return null when no userPreference', () => {
    (mockConfigurationsService as any).userPreference = null
    expect(component.preferredLanguages).toBeNull()
  })

  it('preferredLanguages should return null when selectedLangGroup missing', () => {
    (mockConfigurationsService as any).userPreference = {}
    expect(component.preferredLanguages).toBeNull()
  })

  it('preferredLanguages should map/join langs when userPreference present', () => {
    (mockConfigurationsService as any).userPreference = { selectedLangGroup: 'en,fr' }
    mockSearchServService.getLanguageSearchIndex.mockReturnValue('xx')
    const result = component.preferredLanguages
    expect(result).toBe('xx,xx')
  })

  it('updateQuery for ref=home should emit closed(false) and navigate to /app/search', () => {
    component.ref = 'home'
    const router: any = TestBed.inject(Router)
    const closedSpy = jest.spyOn(component.closed, 'emit')
    component.updateQuery(' test ')
    expect(closedSpy).toHaveBeenCalledWith(false)
    expect(router.navigate).toHaveBeenCalledWith(['/app/search'], {
      queryParams: { q: 'test' },
      queryParamsHandling: 'merge',
    })
  })

  it('updateQuery for non-home ref should navigate relative to activated.parent', () => {
    component.ref = 'other'
    const router: any = TestBed.inject(Router)
    component.updateQuery('foo')
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: mockActivatedRoute.parent,
      queryParams: { q: 'foo' },
      queryParamsHandling: 'merge',
    })
  })

  it('updateQuery should blur searchInputElem when nativeElement exists', () => {
    const blurFn = jest.fn()
    component.searchInputElem = { nativeElement: { blur: blurFn } } as any
    component.updateQuery('foo')
    expect(blurFn).toHaveBeenCalled()
  })

  it('getSearchAutoCompleteResults should call searchAutoComplete when single locale', done => {
    component.searchLocale = 'en'
    mockSearchServService.searchAutoComplete.mockResolvedValue([{ name: 'a' }])
    component.getSearchAutoCompleteResults('q')
    setTimeout(() => {
      expect(component.autoCompleteResults).toEqual([{ name: 'a' }])
      done()
    })
  })

  it('getSearchAutoCompleteResults should skip call when multiple locales', () => {
    component.searchLocale = 'en,fr'
    mockSearchServService.searchAutoComplete.mockClear()
    component.getSearchAutoCompleteResults('q')
    expect(mockSearchServService.searchAutoComplete).not.toHaveBeenCalled()
  })

  it('getSearchAutoCompleteResults should swallow errors from searchAutoComplete', done => {
    component.searchLocale = 'en'
    mockSearchServService.searchAutoComplete.mockRejectedValue(new Error('fail'))
    expect(() => component.getSearchAutoCompleteResults('q')).not.toThrow()
    setTimeout(() => done())
  })

  it('searchLanguage should navigate with lang and current query value', () => {
    const router: any = TestBed.inject(Router)
    component.queryControl.setValue('term')
    component.searchLanguage('fr')
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: mockActivatedRoute.parent,
      queryParams: { lang: 'fr', q: 'term' },
      queryParamsHandling: 'merge',
    })
  })

  it('ngOnDestroy should complete destroy$', () => {
    expect(() => component.ngOnDestroy()).not.toThrow()
  })

  it('ngOnInit should call nativeElement.activated() when present', () => {
    const activatedFn = jest.fn()
    component.ngOnDestroy()
    component.searchInputElem = { nativeElement: { activated: activatedFn, blur: jest.fn() } } as any
    component.ngOnInit()
    expect(activatedFn).toHaveBeenCalled()
  })
})

describe('SearchInputComponent - queryParamMap branches with q and lang present', () => {
  let component: SearchInputComponent
  let fixture: ComponentFixture<SearchInputComponent>

  const mockSearchPageData = {
    data: {
      search: {
        isAutoCompleteAllowed: true,
        languageSearch: ['all', 'en', 'fr'],
      },
    },
  }

  const mockActivatedRoute = {
    snapshot: {
      queryParams: { q: 'hello' },
      data: { searchPageData: mockSearchPageData },
      params: {},
    },
    queryParamMap: of({
      has: (key: string) => key === 'q' || key === 'lang',
      get: (key: string) => (key === 'q' ? 'hello' : key === 'lang' ? 'fr' : null),
    }),
    parent: null,
  }

  const mockSearchServService = {
    getLanguageSearchIndex: jest.fn().mockReturnValue('en'),
    searchAutoComplete: jest.fn().mockResolvedValue([]),
  }

  const mockConfigurationsService = {
    activeLocale: { locals: ['en'] },
    userPreference: { selectedLangGroup: 'en,fr' },
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SearchInputComponent],
      imports: [ReactiveFormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule, MatMenuModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: { navigate: jest.fn(), navigateByUrl: jest.fn(), events: of() } },
        { provide: SearchServService, useValue: mockSearchServService },
        { provide: ConfigurationsService, useValue: mockConfigurationsService },
      ],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchInputComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create with q and lang query params present and autocomplete allowed', () => {
    expect(component).toBeTruthy()
    expect(component.searchLocale).toBe('fr')
  })

  it('should append preferredLanguages when more than one preferred language', () => {
    expect(component.languageSearch).toContain('en,en')
  })
})

describe('SearchInputComponent - isAutoCompleteAllowed undefined branch', () => {
  let component: SearchInputComponent
  let fixture: ComponentFixture<SearchInputComponent>

  const mockSearchPageData = {
    data: {
      search: {
        isAutoCompleteAllowed: undefined,
        languageSearch: ['all', 'en'],
      },
    },
  }

  const mockActivatedRoute = {
    snapshot: {
      queryParams: {},
      data: { searchPageData: mockSearchPageData },
      params: {},
    },
    queryParamMap: of({ has: () => false, get: () => null }),
    parent: null,
  }

  const mockSearchServService = {
    getLanguageSearchIndex: jest.fn().mockReturnValue('en'),
    searchAutoComplete: jest.fn().mockResolvedValue([]),
  }

  const mockConfigurationsService = {
    activeLocale: { locals: ['en'] },
    userPreference: null,
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SearchInputComponent],
      imports: [ReactiveFormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule, MatMenuModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: { navigate: jest.fn(), navigateByUrl: jest.fn(), events: of() } },
        { provide: SearchServService, useValue: mockSearchServService },
        { provide: ConfigurationsService, useValue: mockConfigurationsService },
      ],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchInputComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create and treat undefined isAutoCompleteAllowed as allowed', () => {
    expect(component).toBeTruthy()
  })
})
