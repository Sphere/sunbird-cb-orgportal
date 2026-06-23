import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { of, Subject } from 'rxjs'

import { LearningComponent } from './learning.component'
import { SearchServService } from '../../services/search-serv.service'
import { ConfigurationsService, ValueService, UtilityService } from '@sunbird-cb/utils'

describe('LearningComponent', () => {
  let component: LearningComponent
  let fixture: ComponentFixture<LearningComponent>

  const mockPageData = {
    data: {
      search: {
        tabs: [
          {
            titleKey: 'learning',
            phraseSearch: false,
            isStandAlone: false,
            acrossPreferredLang: false,
            searchQuery: {
              filters: {},
            },
          },
        ],
        visibleFilters: {},
        excludeSourceFields: [],
      },
    },
  }

  const mockActivatedRoute = {
    snapshot: {
      queryParams: {},
      queryParamMap: { has: () => false, get: () => null },
      data: { pageData: mockPageData, pageroute: 'learning' },
      params: {},
    },
    queryParamMap: of({ has: () => false, get: () => null }),
    parent: null,
  }

  const mockSearchServService = {
    searchConfig: null,
    translateSearchFilters: jest.fn().mockResolvedValue({}),
    formatFilterForSearch: jest.fn().mockReturnValue(''),
    updateSelectedFiltersSet: jest.fn().mockReturnValue({ filterSet: new Set(), filterReset: false }),
    handleFilters: jest.fn().mockReturnValue({ filtersRes: [], concept: [] }),
    getLanguageSearchIndex: jest.fn().mockReturnValue('en'),
    getLearning: jest.fn().mockReturnValue(of({ totalHits: 0, result: [], filters: [], filtersUsed: [], notVisibleFilters: [] })),
    raiseSearchEvent: jest.fn(),
    raiseSearchResponseEvent: jest.fn(),
  }

  const mockConfigurationsService = {
    activeLocale: { locals: ['en'] },
    userPreference: null,
    pageNavBar: {},
    isIntranetAllowed: true,
    restrictedFeatures: null,
    prefChangeNotifier: new Subject<void>(),
  }

  const mockValueService = {
    isLtMedium$: of(false),
  }

  const mockUtilityService = {
    isMobile: false,
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [LearningComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: { navigate: jest.fn(), navigateByUrl: jest.fn(), events: of() } },
        { provide: SearchServService, useValue: mockSearchServService },
        { provide: ConfigurationsService, useValue: mockConfigurationsService },
        { provide: ValueService, useValue: mockValueService },
        { provide: UtilityService, useValue: mockUtilityService },
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
