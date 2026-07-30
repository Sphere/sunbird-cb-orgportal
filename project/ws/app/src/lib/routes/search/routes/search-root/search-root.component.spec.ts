import { HttpClientTestingModule } from '@angular/common/http/testing'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { of } from 'rxjs'

import { SearchRootComponent } from './search-root.component'

describe('SearchRootComponent', () => {
  let component: SearchRootComponent
  let fixture: ComponentFixture<SearchRootComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [SearchRootComponent],
      providers: [
        {
          provide: Router,
          useValue: {
            url: '/app/search/learning',
            parseUrl: () => ({
              root: {
                children: {
                  primary: {
                    segments: [{ path: 'learning' }],
                  },
                },
              },
            }),
            navigateByUrl: jest.fn(),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                searchPageData: {
                  data: {
                    search: {
                      tabs: [],
                      routeValue: ['learning'],
                      placeHolder: {},
                      social: {},
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
    })
    .compileComponents()
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
