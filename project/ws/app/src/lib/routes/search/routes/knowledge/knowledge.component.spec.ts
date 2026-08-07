import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { ValueService } from '@sunbird-cb/utils'
import { Subject, of } from 'rxjs'
import { KeycloakService } from 'keycloak-angular'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'

import { KnowledgeComponent } from './knowledge.component'
import { SearchServService } from '../../services/search-serv.service'

describe('KnowledgeComponent', () => {
  let component: KnowledgeComponent
  let fixture: ComponentFixture<KnowledgeComponent>
  let queryParamMap$: Subject<any>
  let router: ReturnType<typeof createSpyObj>
  let searchServ: ReturnType<typeof createSpyObj>

  const build = () => {
    queryParamMap$ = new Subject<any>()
    router = createSpyObj('Router', ['navigate'])
    router.navigate.mockReturnValue(Promise.resolve(true))
    searchServ = createSpyObj('SearchServService', ['formatFilterForSearch', 'updateSelectedFiltersSet'])
    searchServ.formatFilterForSearch.mockReturnValue('formatted')
    searchServ.updateSelectedFiltersSet.mockReturnValue({ filterSet: new Set(['a']), filterReset: true })

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatMenuModule],
      declarations: [KnowledgeComponent],
      providers: [
        { provide: 'environment', useValue: {} },
        { provide: KeycloakService, useValue: createSpyObj('KeycloakService', ['getKeycloakInstance']) },
        { provide: Router, useValue: router },
        { provide: SearchServService, useValue: searchServ },
        { provide: ValueService, useValue: { isLtMedium$: of(false) } },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: queryParamMap$.asObservable(), parent: {} },
        },
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(KnowledgeComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  afterEach(() => TestBed.resetTestingModule())

  it('should create', () => {
    build()
    expect(component).toBeTruthy()
  })

  it('should set sideNavBarOpened based on isLtMedium$', () => {
    build()
    expect(component.screenSizeIsLtMedium).toBe(false)
    expect(component.sideNavBarOpened).toBe(true)
  })

  describe('queryParamMap subscription', () => {
    it('should reset state and seed query/filters/sort when all params are present', () => {
      build()
      queryParamMap$.next({
        has: (k: string) => ['q', 'f', 'sort'].includes(k),
        get: (k: string) => (k === 'q' ? 'term' : k === 'f' ? '{"a":["b"]}' : 'asc'),
      })
      expect(component.searchRequest.query).toBe('term')
      expect(component.searchObj.searchQuery).toBe('term')
      expect(component.searchRequest.filters).toEqual({ a: ['b'] })
      expect(component.searchObj.filter).toBe('formatted')
      expect(component.searchRequest.sort).toBe('asc')
      expect(component.selectedFilterSet).toEqual(new Set(['a']))
      expect(component.filtersResetAble).toBe(true)
    })

    it('should default query/filters/sort when absent', () => {
      build()
      queryParamMap$.next({ has: () => false, get: () => null })
      expect(component.searchRequest.query).toBe('')
      expect(component.searchRequest.filters).toEqual({})
      expect(component.searchRequest.sort).toBeUndefined()
    })
  })

  it('ngOnDestroy should unsubscribe both subscriptions when present', () => {
    build()
    queryParamMap$.next({ has: () => false, get: () => null })
    ;(component as any).searchResultsSubscription = { unsubscribe: jest.fn() }
    const searchUnsub = (component as any).searchResultsSubscription.unsubscribe
    const navUnsub = jest.spyOn(component.defaultSideNavBarOpenedSubscription as any, 'unsubscribe')
    component.ngOnDestroy()
    expect(searchUnsub).toHaveBeenCalled()
    expect(navUnsub).toHaveBeenCalled()
  })

  it('ngOnDestroy should not throw when there are no subscriptions', () => {
    build()
    ;(component as any).searchResultsSubscription = undefined
    component.defaultSideNavBarOpenedSubscription = null
    expect(() => component.ngOnDestroy()).not.toThrow()
  })

  it('removeFilters should navigate clearing the f query param', () => {
    build()
    component.removeFilters()
    expect(router.navigate).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: { f: null }, queryParamsHandling: 'merge',
    }))
  })

  it('sortOrder should navigate with the given sort type', () => {
    build()
    component.sortOrder('asc')
    expect(router.navigate).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: { sort: 'asc' },
    }))
  })

  it('closeFilter should set sideNavBarOpened', () => {
    build()
    component.closeFilter(false)
    expect(component.sideNavBarOpened).toBe(false)
  })
})
