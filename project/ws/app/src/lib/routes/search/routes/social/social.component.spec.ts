import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { provideNoopAnimations } from '@angular/platform-browser/animations'
import { of } from 'rxjs'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { KeycloakService } from 'keycloak-angular'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'
import { ValueService } from '@sunbird-cb/utils'
import { SearchApiService } from '../../apis/search-api.service'
import { SearchServService } from '../../services/search-serv.service'
import { SocialComponent } from './social.component'

const mockSearchApiService = {
  userId: 'user-1',
}

const mockValueService = {
  isLtMedium$: of(false),
}

const mockSearchServService = {
  updateSelectedFiltersSet: jest.fn().mockReturnValue({ filterSet: new Set(), filterReset: false }),
  fetchSocialSearchUsers: jest.fn().mockReturnValue(of({ total: 0, result: [], filters: [] })),
  handleFilters: jest.fn().mockReturnValue({ filtersRes: [] }),
}

describe('SocialComponent', () => {
  let component: SocialComponent
  let fixture: ComponentFixture<SocialComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SocialComponent],
    imports: [HttpClientTestingModule, MatMenuModule],
    providers: [
        { provide: 'environment', useValue: {} },
        { provide: KeycloakService, useValue: createSpyObj('KeycloakService', ['getKeycloakInstance']) },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ pageData: { data: {} }, eventdata: { data: {} } }),
            paramMap: of({ get: () => null }),
            queryParamMap: of({ has: () => false, get: () => null }),
            params: of({}),
            snapshot: { paramMap: { get: () => null }, queryParamMap: { get: () => null }, data: {}, params: {} },
            parent: { data: of({ eventdata: { data: {} } }), params: of({}) },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(SocialComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  function buildComponent(queryParamMapConfig: {
    has: (key: string) => boolean
    get: (key: string) => string | null
  } | Array<{ has: (key: string) => boolean; get: (key: string) => string | null }>,
    searchServOverrides?: Partial<typeof mockSearchServService>) {
    TestBed.resetTestingModule()
    const searchServ = { ...mockSearchServService, ...searchServOverrides }
    const routerMock = { navigate: jest.fn().mockResolvedValue(true), navigateByUrl: jest.fn(), events: of() }
    TestBed.configureTestingModule({
      declarations: [SocialComponent],
      imports: [ReactiveFormsModule, MatMenuModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideNoopAnimations(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParams: {}, data: {}, params: {} },
            queryParamMap: Array.isArray(queryParamMapConfig)
              ? of(...queryParamMapConfig)
              : of(queryParamMapConfig),
            parent: null,
          },
        },
        { provide: Router, useValue: routerMock },
        { provide: SearchApiService, useValue: mockSearchApiService },
        { provide: SearchServService, useValue: searchServ },
        { provide: ValueService, useValue: mockValueService },
      ],
    }).compileComponents()
    const f = TestBed.createComponent(SocialComponent)
    f.detectChanges()
    return { fixture: f, component: f.componentInstance, router: routerMock, searchServ }
  }

  it('should parse query, filters, Latest sort, and social=Blog on init', () => {
    const params: any = { q: 'hello', f: '{"a":["1"]}', sort: 'Latest', social: 'Blog' }
    const { component: c } = buildComponent({
      has: (key: string) => key in params,
      get: (key: string) => params[key],
    })
    expect(c.searchRequestObject.query).toBe('hello')
    expect(c.searchRequest.filters).toEqual({ a: ['1'] })
    expect(c.searchRequestObject.sort).toEqual([{ dtLastModified: 'desc' }])
    expect(c.query).toBe(false)
    expect(c.searchRequestObject.postKind).toBe('Blog')
  })

  it('should set Trending sort based on this.query (Query kind -> upVoteCount)', () => {
    const params: any = { sort: 'Trending', social: 'Query' }
    const { component: c } = buildComponent({
      has: (key: string) => key in params,
      get: (key: string) => params[key],
    })
    expect(c.searchRequestObject.sort).toEqual([{ upVoteCount: 'desc' }])
  })

  it('should set Trending sort to likeCount when query is false', () => {
    const socialParams: any = { social: 'Blog' }
    const trendingParams: any = { sort: 'Trending' }
    const { component: c } = buildComponent([
      { has: (key: string) => key in socialParams, get: (key: string) => socialParams[key] },
      { has: (key: string) => key in trendingParams, get: (key: string) => trendingParams[key] },
    ])
    expect(c.query).toBe(false)
    expect(c.searchRequestObject.sort).toEqual([{ likeCount: 'desc' }])
  })

  it('should set empty sort array for unrecognized sort value', () => {
    const params: any = { sort: 'Other' }
    const { component: c } = buildComponent({
      has: (key: string) => key in params,
      get: (key: string) => params[key],
    })
    expect(c.searchRequestObject.sort).toEqual([])
  })

  it('should default sort to Relevance when no sort query param', () => {
    const { component: c } = buildComponent({ has: () => false, get: () => null })
    expect(c.searchRequest.sort).toBe('Relevance')
  })

  it('should delete filters key when filters object is empty', () => {
    const { component: c } = buildComponent({ has: () => false, get: () => null })
    expect(c.searchRequestObject.filters).toBeUndefined()
  })

  it('should set noContent true when total is 0', () => {
    const { component: c } = buildComponent({ has: () => false, get: () => null })
    expect(c.noContent).toBe(true)
  })

  it('should set searchRequestStatus to hasMore when results are fewer than total', () => {
    const { component: c } = buildComponent({ has: () => false, get: () => null }, {
      fetchSocialSearchUsers: jest.fn().mockReturnValue(of({ total: 5, result: [{}], filters: [] })),
    })
    expect(c.searchRequestStatus).toBe('hasMore')
    expect(c.noContent).toBe(false)
  })

  it('should handle error in getResults', () => {
    const { component: c } = buildComponent({ has: () => false, get: () => null }, {
      fetchSocialSearchUsers: jest.fn().mockReturnValue(
        new (require('rxjs').Observable)((subscriber: any) => subscriber.error('boom')),
      ),
    })
    expect(c.error.load).toBe(true)
    expect(c.error.message).toBe('boom')
    expect(c.searchRequestStatus).toBe('done')
  })

  it('should unsubscribe existing searchResultsSubscription in getResults when called again', () => {
    const { component: c } = buildComponent({ has: () => false, get: () => null })
    const sub = c.searchResultsSubscription
    const unsubscribeSpy = jest.spyOn(sub as any, 'unsubscribe')
    c.getResults()
    expect(unsubscribeSpy).toHaveBeenCalled()
  })

  it('should navigate with null filter on removeFilters', () => {
    const { component: c, router } = buildComponent({ has: () => false, get: () => null })
    c.removeFilters()
    expect(router.navigate).toHaveBeenCalledWith([], {
      queryParams: { f: null },
      queryParamsHandling: 'merge',
      relativeTo: null,
    })
  })

  it('should toggle best results and navigate', () => {
    const { component: c, router } = buildComponent({ has: () => false, get: () => null })
    const initialQuery = c.query
    c.toggleBestResults()
    expect(c.query).toBe(!initialQuery)
    expect(c.searchRequestObject.pageNo).toBe(0)
    expect(router.navigate).toHaveBeenCalled()
  })

  it('should sortOrder navigate with given type', () => {
    const { component: c, router } = buildComponent({ has: () => false, get: () => null })
    c.sortOrder('Latest')
    expect(router.navigate).toHaveBeenCalledWith([], {
      queryParams: { sort: 'Latest' },
      queryParamsHandling: 'merge',
      relativeTo: null,
    })
  })

  it('should closeFilter set sideNavBarOpened', () => {
    const { component: c } = buildComponent({ has: () => false, get: () => null })
    c.closeFilter(false)
    expect(c.sideNavBarOpened).toBe(false)
  })

  it('should return identifier via contentTrackBy', () => {
    const { component: c } = buildComponent({ has: () => false, get: () => null })
    expect(c.contentTrackBy({ identifier: 'id1' } as any)).toBe('id1')
  })

  it('should unsubscribe subscriptions on destroy', () => {
    const { component: c } = buildComponent({ has: () => false, get: () => null })
    const sub1Spy = jest.spyOn(c.searchResultsSubscription as any, 'unsubscribe')
    const sub2Spy = jest.spyOn(c.defaultSideNavBarOpenedSubscription as any, 'unsubscribe')
    c.ngOnDestroy()
    expect(sub1Spy).toHaveBeenCalled()
    expect(sub2Spy).toHaveBeenCalled()
  })

  it('should not throw ngOnDestroy when subscriptions are undefined', () => {
    const { component: c } = buildComponent({ has: () => false, get: () => null })
    c.searchResultsSubscription = undefined
    c.defaultSideNavBarOpenedSubscription = null
    expect(() => c.ngOnDestroy()).not.toThrow()
  })
})
