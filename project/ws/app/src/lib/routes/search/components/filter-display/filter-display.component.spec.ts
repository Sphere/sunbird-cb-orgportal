import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'

import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { of } from 'rxjs'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { KeycloakService } from 'keycloak-angular'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { FilterDisplayComponent } from './filter-display.component'
import { SearchServService } from '../../services/search-serv.service'

describe('FilterDisplayComponent', () => {
  let component: FilterDisplayComponent
  let fixture: ComponentFixture<FilterDisplayComponent>
  let mockSearchServService: jest.Mocked<SearchServService>
  let mockRouter: jest.Mocked<Router>
  let mockActivatedRoute: any

  beforeEach(waitForAsync(() => {
    mockSearchServService = createSpyObj('SearchServService', ['translateSearchFilters'])
    mockSearchServService.translateSearchFilters.mockResolvedValue({})

    mockRouter = createSpyObj('Router', ['navigate'])

    mockActivatedRoute = {
      data: of({ pageData: { data: {} }, eventdata: { data: {} } }),
      paramMap: of({ get: () => null }),
      queryParamMap: of({ has: () => false, get: () => null }),
      params: of({}),
      snapshot: { paramMap: { get: () => null }, queryParamMap: { get: () => null }, data: {}, params: {} },
      parent: {
        data: of({ eventdata: { data: {} } }),
        params: of({}),
        snapshot: { data: { searchPageData: { data: { search: { tabs: [] } } } } },
      },
    }

    TestBed.configureTestingModule({
      declarations: [FilterDisplayComponent],
    imports: [HttpClientTestingModule],
    providers: [
        { provide: 'environment', useValue: {} },
        { provide: KeycloakService, useValue: createSpyObj('KeycloakService', ['getKeycloakInstance']) },
        { provide: Router, useValue: mockRouter },
        { provide: SearchServService, useValue: mockSearchServService },
        { provide: ConfigurationsService, useValue: { userPreference: null } },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
      schemas: [NO_ERRORS_SCHEMA],
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

  describe('ngOnInit', () => {
    it('should use selectedLocale when userPreference is set', () => {
      (component as any).configSvc.userPreference = { selectedLocale: 'fr' }
      component.ngOnInit()
      expect(mockSearchServService.translateSearchFilters).toHaveBeenCalledWith('fr')
    })

    it('should default to en when userPreference is not set', () => {
      (component as any).configSvc.userPreference = null
      component.ngOnInit()
      expect(mockSearchServService.translateSearchFilters).toHaveBeenCalledWith('en')
    })

    it('should call lowerCaseFilter and set translatedFilters on resolve', async () => {
      mockSearchServService.translateSearchFilters.mockResolvedValueOnce({ Foo: { value: {} } })
      component.ngOnInit()
      await Promise.resolve()
      await Promise.resolve()
      expect(component.translatedFilters.Foo).toEqual({ value: {} })
    })

    it('should set advancedFilters when routeComp matches titleKey and advancedFilters exist', () => {
      component.routeComp = 'tab1'
      const localRoute: any = {
        ...mockActivatedRoute,
        parent: {
          snapshot: {
            data: {
              searchPageData: {
                data: {
                  search: {
                    tabs: [
                      {
                        titleKey: 'tab1',
                        searchQuery: {
                          advancedFilters: [{ id: 'af1' }],
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        queryParamMap: of({ has: () => false, get: () => null }),
      };
      (component as any).activated = localRoute
      component.ngOnInit()
      expect(component.advancedFilters).toEqual([{ id: 'af1' }])
    })

    it('should not set advancedFilters when titleKey does not match', () => {
      component.routeComp = 'other'
      const localRoute: any = {
        ...mockActivatedRoute,
        parent: {
          snapshot: {
            data: {
              searchPageData: {
                data: {
                  search: {
                    tabs: [
                      {
                        titleKey: 'tab1',
                        searchQuery: {
                          advancedFilters: [{ id: 'af1' }],
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        queryParamMap: of({ has: () => false, get: () => null }),
      };
      (component as any).activated = localRoute
      component.ngOnInit()
      expect(component.advancedFilters).toEqual([])
    })

    it('should not set advancedFilters when cur.searchQuery is missing', () => {
      component.routeComp = 'tab1'
      const localRoute: any = {
        ...mockActivatedRoute,
        parent: {
          snapshot: {
            data: {
              searchPageData: {
                data: {
                  search: {
                    tabs: [
                      { titleKey: 'tab1' },
                    ],
                  },
                },
              },
            },
          },
        },
        queryParamMap: of({ has: () => false, get: () => null }),
      };
      (component as any).activated = localRoute
      component.ngOnInit()
      expect(component.advancedFilters).toEqual([])
    })

    it('should skip block when activated.parent is missing', () => {
      const localRoute: any = {
        parent: null,
        queryParamMap: of({ has: () => false, get: () => null }),
      };
      (component as any).activated = localRoute
      expect(() => component.ngOnInit()).not.toThrow()
    })

    it('should skip block when searchPageData.data.search.tabs is missing', () => {
      const localRoute: any = {
        parent: {
          snapshot: {
            data: {
              searchPageData: {
                data: {
                  search: {},
                },
              },
            },
          },
        },
        queryParamMap: of({ has: () => false, get: () => null }),
      };
      (component as any).activated = localRoute
      expect(() => component.ngOnInit()).not.toThrow()
    })

    it('should parse filters from query params when "f" is present', () => {
      const localRoute: any = {
        ...mockActivatedRoute,
        queryParamMap: of({
          has: (key: string) => key === 'f',
          get: () => JSON.stringify({ type: ['a'] }),
        }),
      };
      (component as any).activated = localRoute
      component.ngOnInit()
      expect(component.searchRequest.filters).toEqual({ type: ['a'] })
    })

    it('should default to empty object when f query param is null', () => {
      const localRoute: any = {
        ...mockActivatedRoute,
        queryParamMap: of({
          has: (key: string) => key === 'f',
          get: () => null,
        }),
      };
      (component as any).activated = localRoute
      component.ngOnInit()
      expect(component.searchRequest.filters).toEqual({})
    })

    it('should not touch filters when "f" is absent', () => {
      const localRoute: any = {
        ...mockActivatedRoute,
        queryParamMap: of({
          has: () => false,
          get: () => null,
        }),
      };
      (component as any).activated = localRoute
      component.ngOnInit()
      expect(component.searchRequest.filters).toEqual({})
    })
  })

  describe('advancedFilterClick', () => {
    it('should navigate with filter query params', () => {
      const navigateSpy = (component as any).router.navigate
      component.advancedFilterClick({ filters: { a: ['1'] } } as any)
      expect(navigateSpy).toHaveBeenCalledWith([], {
        queryParams: { f: JSON.stringify({ a: ['1'] }) },
        relativeTo: (component as any).activated.parent,
        queryParamsHandling: 'merge',
      })
    })
  })

  describe('trackBy functions', () => {
    it('filterUnitResponseTrackBy should return filter id', () => {
      expect(component.filterUnitResponseTrackBy({ id: 'x1' } as any)).toBe('x1')
    })
    it('filterUnitTrackBy should return filter id', () => {
      expect(component.filterUnitTrackBy({ id: 'y1' } as any)).toBe('y1')
    })
  })

  describe('applyFilters', () => {
    it('should call addFilter when filter is not already present', () => {
      component.searchRequest.filters = {}
      const addSpy = jest.spyOn(component, 'addFilter')
      component.applyFilters({ unitFilter: { type: 'val1', id: 'i1' } as any, filterType: 'cat' })
      expect(addSpy).toHaveBeenCalledWith({ key: 'cat', value: 'val1' })
    })

    it('should call removeFilter when filter already present', () => {
      component.searchRequest.filters = { cat: ['val1'] }
      const removeSpy = jest.spyOn(component, 'removeFilter')
      component.applyFilters({ unitFilter: { type: 'val1', id: 'i1' } as any, filterType: 'cat' })
      expect(removeSpy).toHaveBeenCalledWith({ key: 'cat', value: 'val1' })
    })

    it('should handle unitFilter.type missing (defaults to empty string)', () => {
      component.searchRequest.filters = {}
      const addSpy = jest.spyOn(component, 'addFilter')
      component.applyFilters({ unitFilter: { id: 'i1' } as any, filterType: 'cat' })
      expect(addSpy).toHaveBeenCalledWith({ key: 'cat', value: '' })
    })

    it('should treat requestFilters falsy path (no requestFilters) as add', () => {
      (component as any).searchRequest = { filters: null }
      const addSpy = jest.spyOn(component, 'addFilter')
      component.applyFilters({ unitFilter: { type: 'val1', id: 'i1' } as any, filterType: 'cat' })
      expect(addSpy).toHaveBeenCalled()
    })
  })

  describe('addFilter', () => {
    it('should append value to existing key', () => {
      component.searchRequest.filters = { cat: ['old'] }
      const navigateSpy = (component as any).router.navigate
      component.addFilter({ key: 'cat', value: 'new' })
      expect(navigateSpy).toHaveBeenCalledWith([], {
        queryParams: { f: JSON.stringify({ cat: ['old', 'new'] }) },
        relativeTo: (component as any).activated.parent,
        queryParamsHandling: 'merge',
      })
    })

    it('should create new key when not present', () => {
      component.searchRequest.filters = {}
      const navigateSpy = (component as any).router.navigate
      component.addFilter({ key: 'newcat', value: 'v1' })
      expect(navigateSpy).toHaveBeenCalledWith([], {
        queryParams: { f: JSON.stringify({ newcat: ['v1'] }) },
        relativeTo: (component as any).activated.parent,
        queryParamsHandling: 'merge',
      })
    })
  })

  describe('removeFilter', () => {
    it('should remove value and delete empty key, then navigate', () => {
      component.searchRequest.filters = { cat: ['val1'] }
      const navigateSpy = (component as any).router.navigate
      component.removeFilter({ key: 'cat', value: 'val1' })
      expect(navigateSpy).toHaveBeenCalledWith([], {
        queryParams: { f: JSON.stringify({}) },
        relativeTo: (component as any).activated.parent,
        queryParamsHandling: 'merge',
      })
    })

    it('should remove single value but keep key when others remain', () => {
      component.searchRequest.filters = { cat: ['val1', 'val2'] }
      const navigateSpy = (component as any).router.navigate
      component.removeFilter({ key: 'cat', value: 'val1' })
      expect(navigateSpy).toHaveBeenCalledWith([], {
        queryParams: { f: JSON.stringify({ cat: ['val2'] }) },
        relativeTo: (component as any).activated.parent,
        queryParamsHandling: 'merge',
      })
    })
  })

  describe('removeFilters', () => {
    it('should navigate with null f param', () => {
      const navigateSpy = (component as any).router.navigate
      component.removeFilters()
      expect(navigateSpy).toHaveBeenCalledWith([], {
        queryParams: { f: null },
        queryParamsHandling: 'merge',
        relativeTo: (component as any).activated.parent,
      })
    })
  })

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const destroy$ = (component as any).destroy$
      const nextSpy = jest.spyOn(destroy$, 'next')
      const completeSpy = jest.spyOn(destroy$, 'complete')
      component.ngOnDestroy()
      expect(nextSpy).toHaveBeenCalled()
      expect(completeSpy).toHaveBeenCalled()
    })
  })

  describe('lowerCaseFilter', () => {
    it('should lowercase top-level keys and recurse into nested value objects', () => {
      const filterObj: any = {
        Category: { value: { SubKey: { value: {} } } },
      }
      component.lowerCaseFilter(filterObj, Object.keys(filterObj))
      expect(filterObj.category).toBeDefined()
      expect(filterObj.category.value.subkey).toBeDefined()
    })

    it('should not recurse when value has no keys', () => {
      const filterObj: any = {
        Category: { value: {} },
      }
      expect(() => component.lowerCaseFilter(filterObj, Object.keys(filterObj))).not.toThrow()
    })

    it('should not recurse when value property is missing', () => {
      const filterObj: any = {
        Category: {},
      }
      expect(() => component.lowerCaseFilter(filterObj, Object.keys(filterObj))).not.toThrow()
    })
  })
})
