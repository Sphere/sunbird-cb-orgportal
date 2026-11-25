import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { of } from 'rxjs'

import { SearchRootComponent } from './search-root.component'
import { ConfigurationsService } from '@sunbird-cb/utils'

describe('SearchRootComponent', () => {
  let component: SearchRootComponent
  let fixture: ComponentFixture<SearchRootComponent>

  const mockSearchPageData = {
    data: {
      search: {
        tabs: [],
        routeValue: ['learning', 'social', 'knowledge'],
        placeHolder: {},
        social: {},
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

  const mockRouter = {
    navigate: jest.fn(),
    navigateByUrl: jest.fn(),
    events: of(),
    url: '/app/search/learning',
    parseUrl: jest.fn().mockReturnValue({
      root: {
        children: {
          primary: {
            segments: [
              { path: 'app' },
              { path: 'search' },
              { path: 'learning' },
            ],
          },
        },
      },
    }),
  }

  const mockConfigurationsService = {
    pageNavBar: {},
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SearchRootComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: ConfigurationsService, useValue: mockConfigurationsService },
      ],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchRootComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
