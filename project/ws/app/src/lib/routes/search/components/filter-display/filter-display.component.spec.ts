import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { of } from 'rxjs'

import { FilterDisplayComponent } from './filter-display.component'
import { SearchServService } from '../../services/search-serv.service'
import { ConfigurationsService } from '@sunbird-cb/utils'

describe('FilterDisplayComponent', () => {
  let component: FilterDisplayComponent
  let fixture: ComponentFixture<FilterDisplayComponent>

  const mockActivatedRoute = {
    queryParamMap: of({ has: () => false, get: () => null }),
    parent: {
      snapshot: {
        data: {
          searchPageData: {
            data: {
              search: {
                tabs: [],
              },
            },
          },
        },
      },
    },
    snapshot: {
      params: {},
      queryParams: {},
      data: {},
    },
  }

  const mockSearchServService = {
    translateSearchFilters: jest.fn().mockResolvedValue({}),
    formatFilterForSearch: jest.fn().mockReturnValue(''),
    updateSelectedFiltersSet: jest.fn().mockReturnValue({ filterSet: new Set(), filterReset: false }),
    handleFilters: jest.fn().mockReturnValue({ filtersRes: [], concept: [] }),
    getLanguageSearchIndex: jest.fn().mockReturnValue('en'),
  }

  const mockConfigurationsService = {
    userPreference: null,
    activeLocale: null,
    pageNavBar: {},
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [FilterDisplayComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: { navigate: jest.fn(), navigateByUrl: jest.fn(), events: of() } },
        { provide: SearchServService, useValue: mockSearchServService },
        { provide: ConfigurationsService, useValue: mockConfigurationsService },
      ],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterDisplayComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
