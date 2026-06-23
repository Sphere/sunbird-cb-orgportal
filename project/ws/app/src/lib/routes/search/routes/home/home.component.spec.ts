import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { of } from 'rxjs'
import { ReactiveFormsModule } from '@angular/forms'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatMenuModule } from '@angular/material/menu'
import { provideNoopAnimations } from '@angular/platform-browser/animations'

import { HomeComponent } from './home.component'
import { SearchServService } from '../../services/search-serv.service'
import { ConfigurationsService } from '@sunbird-cb/utils'

describe('HomeComponent', () => {
  let component: HomeComponent
  let fixture: ComponentFixture<HomeComponent>

  const mockPageData = {
    data: {
      search: {
        isAutoCompleteAllowed: false,
        languageSearch: ['all', 'en'],
        suggestedFilters: [],
      },
    },
  }

  const mockActivatedRoute = {
    snapshot: {
      queryParams: {},
      data: { pageData: mockPageData },
      params: {},
    },
    queryParamMap: of({ has: () => false, get: () => null }),
    parent: null,
  }

  const mockSearchServService = {
    getLanguageSearchIndex: jest.fn().mockReturnValue('en'),
    searchAutoComplete: jest.fn().mockResolvedValue([]),
    getSearchConfig: jest.fn().mockResolvedValue({ search: { suggestedFilters: [] } }),
  }

  const mockConfigurationsService = {
    activeLocale: { locals: ['en'] },
    userPreference: null,
    pageNavBar: {},
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HomeComponent],
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
    fixture = TestBed.createComponent(HomeComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
