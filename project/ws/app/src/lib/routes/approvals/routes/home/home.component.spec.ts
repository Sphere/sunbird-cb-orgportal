import { of, Subject } from 'rxjs'
import { NavigationEnd } from '@angular/router'
import { HomeComponent } from './home.component'

describe('HomeComponent (approvals)', () => {
  let component: HomeComponent
  let routerEvents$: Subject<any>
  let activeRouteMock: any
  let routerMock: any

  const buildActiveRoute = (workflowData: any, workflowHistoryData: any, dataObs: any) => ({
    snapshot: {
      data: {
        workflowData: { data: { result: { data: workflowData } } },
        workflowHistoryData: { data: { result: { data: workflowHistoryData } } },
      },
    },
    data: dataObs,
  })

  const setup = (
    workflowData: any = [{ userInfo: { first_name: 'Jane', last_name: 'Roe' } }],
    workflowHistoryData: any = {},
    dataObs: any = of({ pageData: { data: { profileData: [{ key: 'k1', name: 'Field1' }], profileDataKey: [{ key: 'fk1', name: 'FK1' }] } } }),
  ) => {
    routerEvents$ = new Subject()
    activeRouteMock = buildActiveRoute(workflowData, workflowHistoryData, dataObs)
    routerMock = {
      events: routerEvents$.asObservable(),
    }

    component = new HomeComponent(activeRouteMock, routerMock)
  }

  describe('constructor', () => {
    it('should set fullname from workflowData userInfo on NavigationEnd', () => {
      setup()
      routerEvents$.next(new NavigationEnd(1, '/a', '/a'))
      expect(component.fullname).toBe('Jane Roe')
    })

    it('should set fullname to empty string when workflowData is absent', () => {
      setup([])
      routerEvents$.next(new NavigationEnd(1, '/a', '/a'))
      expect(component.fullname).toBe('')
    })

    it('should build wfHistory from string updateFieldValues', () => {
      const wfHistoryData = {
        group1: [
          {
            inWorkflow: false,
            createdOn: Date.now(),
            updateFieldValues: JSON.stringify([
              { toValue: { k1: 'newval' }, fromValue: { k1: 'oldval' }, fieldKey: 'fk1' },
            ]),
            comment: 'a comment',
            action: 'APPROVE',
          },
        ],
      }
      setup(undefined, wfHistoryData)
      routerEvents$.next(new NavigationEnd(1, '/a', '/a'))

      expect(component.wfHistory.length).toBe(1)
      expect(component.wfHistory[0].toValue).toBe('newval')
      expect(component.wfHistory[0].fromValue).toBe('oldval')
    })

    it('should skip entries that are inWorkflow', () => {
      const wfHistoryData = { g: [{ inWorkflow: true, createdOn: Date.now(), updateFieldValues: '{}' }] }
      setup(undefined, wfHistoryData)
      routerEvents$.next(new NavigationEnd(1, '/a', '/a'))
      expect(component.wfHistory.length).toBe(0)
    })

    it('should populate profileData and profileDataKeys from activeRoute.data', () => {
      setup()
      routerEvents$.next(new NavigationEnd(1, '/a', '/a'))
      expect(component.profileData.length).toBe(1)
      expect(component.profileDataKeys.length).toBe(1)
    })

    it('should not push into wfHistory when fields array is empty', () => {
      const wfHistoryData = {
        g: [{ inWorkflow: false, createdOn: Date.now(), updateFieldValues: JSON.stringify([]) }],
      }
      setup(undefined, wfHistoryData)
      routerEvents$.next(new NavigationEnd(1, '/a', '/a'))
      expect(component.wfHistory.length).toBe(0)
    })

    it('should skip entries where updateFieldValues is not a string', () => {
      const wfHistoryData = {
        g: [{ inWorkflow: false, createdOn: Date.now(), updateFieldValues: { already: 'object' } }],
      }
      setup(undefined, wfHistoryData)
      routerEvents$.next(new NavigationEnd(1, '/a', '/a'))
      expect(component.wfHistory.length).toBe(0)
    })

    it('should default fromValue, comment and action to null when absent', () => {
      const wfHistoryData = {
        g: [
          {
            inWorkflow: false,
            createdOn: Date.now(),
            updateFieldValues: JSON.stringify([
              { fieldKey: 'fk1', toValue: { k1: 'v' } },
            ]),
          },
        ],
      }
      setup(undefined, wfHistoryData)
      routerEvents$.next(new NavigationEnd(1, '/a', '/a'))
      expect(component.wfHistory.length).toBe(1)
      expect(component.wfHistory[0].fromValue).toBeNull()
      expect(component.wfHistory[0].comment).toBeNull()
      expect(component.wfHistory[0].action).toBeNull()
    })

    it('should set fieldName and fieldKey to null when no matching profileData/profileDataKeys entry is found', () => {
      const wfHistoryData = {
        g: [
          {
            inWorkflow: false,
            createdOn: Date.now(),
            updateFieldValues: JSON.stringify([
              { fieldKey: 'unknown-key', toValue: { unknownLabel: 'v' }, fromValue: { unknownLabel: 'o' } },
            ]),
          },
        ],
      }
      setup(undefined, wfHistoryData)
      routerEvents$.next(new NavigationEnd(1, '/a', '/a'))
      expect(component.wfHistory.length).toBe(1)
      expect(component.wfHistory[0].fieldName).toBeNull()
      expect(component.wfHistory[0].fieldKey).toBeNull()
    })

    it('should fall back to {} for feildNameObj/feildKeyObj when profileData/profileDataKeys are falsy', () => {
      const wfHistoryData = {
        g: [
          {
            inWorkflow: false,
            createdOn: Date.now(),
            updateFieldValues: JSON.stringify([
              { fieldKey: 'fk1', toValue: { k1: 'v' }, fromValue: { k1: 'o' } },
            ]),
          },
        ],
      }
      setup(undefined, wfHistoryData, of({ pageData: { data: { profileData: null, profileDataKey: null } } }))
      routerEvents$.next(new NavigationEnd(1, '/a', '/a'))
      expect(component.wfHistory.length).toBe(1)
      expect(component.wfHistory[0].fieldName).toBeUndefined()
      expect(component.wfHistory[0].fieldKey).toBeUndefined()
    })

    it('should default workflowData to {} when result.data is falsy, yielding empty fullname', () => {
      activeRouteMock = {
        snapshot: {
          data: {
            workflowData: { data: { result: { data: null } } },
            workflowHistoryData: { data: { result: { data: {} } } },
          },
        },
        data: of({ pageData: { data: { profileData: [], profileDataKey: [] } } }),
      }
      routerEvents$ = new Subject()
      routerMock = { events: routerEvents$.asObservable() }
      component = new HomeComponent(activeRouteMock, routerMock)
      routerEvents$.next(new NavigationEnd(1, '/a', '/a'))
      expect(component.fullname).toBe('')
    })

    it('should default wfHistoryDatas to {} when workflowHistoryData.data.result.data is falsy', () => {
      activeRouteMock = {
        snapshot: {
          data: {
            workflowData: { data: { result: { data: [{ userInfo: { first_name: 'A', last_name: 'B' } }] } } },
            workflowHistoryData: { data: { result: { data: null } } },
          },
        },
        data: of({ pageData: { data: { profileData: [], profileDataKey: [] } } }),
      }
      routerEvents$ = new Subject()
      routerMock = { events: routerEvents$.asObservable() }
      component = new HomeComponent(activeRouteMock, routerMock)
      expect(() => routerEvents$.next(new NavigationEnd(1, '/a', '/a'))).not.toThrow()
      expect(component.wfHistory.length).toBe(0)
    })

    it('should ignore non-NavigationEnd router events', () => {
      setup()
      const initialFullname = component.fullname
      expect(() => routerEvents$.next({ type: 'other' } as any)).not.toThrow()
      expect(component.fullname).toBe(initialFullname)
    })
  })

  describe('ngOnInit', () => {
    it('should populate tabsData with 5 tabs', () => {
      setup()
      component.ngOnInit()
      expect(component.tabsData.length).toBe(5)
      expect(component.tabsData[0].key).toBe('needsapproval')
    })
  })

  describe('ngAfterViewInit', () => {
    it('should set elementPosition from menuElement', () => {
      setup()
      component.menuElement = {
        nativeElement: { parentElement: { offsetTop: 77 } },
      } as any
      component.ngAfterViewInit()
      expect(component.elementPosition).toBe(77)
    })
  })

  describe('handleScroll', () => {
    it('should set sticky true when scroll exceeds elementPosition', () => {
      setup()
      component.elementPosition = 100
      Object.defineProperty(window, 'pageYOffset', { value: 200, configurable: true })
      component.handleScroll()
      expect(component.sticky).toBe(true)
    })

    it('should set sticky false when scroll below elementPosition', () => {
      setup()
      component.elementPosition = 500
      Object.defineProperty(window, 'pageYOffset', { value: 10, configurable: true })
      component.handleScroll()
      expect(component.sticky).toBe(false)
    })
  })

  describe('onSideNavTabClick', () => {
    it('should set currentTab and scroll into view if element exists', () => {
      setup()
      const scrollIntoViewMock = jest.fn()
      jest.spyOn(document, 'getElementById').mockReturnValue({ scrollIntoView: scrollIntoViewMock } as any)
      component.onSideNavTabClick('academics')
      expect(component.currentTab).toBe('academics')
      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start', inline: 'start' })
    })

    it('should not throw when element is not found', () => {
      setup()
      jest.spyOn(document, 'getElementById').mockReturnValue(null)
      expect(() => component.onSideNavTabClick('skills')).not.toThrow()
    })
  })

  describe('ngOnDestroy', () => {
    it('should not throw', () => {
      setup()
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })
})
