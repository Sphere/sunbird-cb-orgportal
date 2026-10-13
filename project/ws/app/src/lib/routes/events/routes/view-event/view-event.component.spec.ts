import { of, Subject } from 'rxjs'
import { NavigationEnd } from '@angular/router'
import { ViewEventComponent } from './view-event.component'

describe('ViewEventComponent', () => {
  let component: ViewEventComponent
  let routerEvents$: Subject<any>
  let activeRouteMock: any
  let routerMock: any

  const buildActiveRoute = (profileData: any, workflowHistoryData: any, dataObs: any) => ({
    snapshot: {
      data: {
        profileData: { data: { result: { UserProfile: [profileData] } } },
        workflowHistoryData: { data: { result: { data: workflowHistoryData } } },
      },
    },
    data: dataObs,
  })

  const basicProfile = {
    personalDetails: { firstname: 'John', surname: 'Doe' },
    academics: [],
    professionalDetails: [{ name: 'Acme' }],
    employmentDetails: {},
    skills: {},
    interests: {},
  }

  const setup = (
    profileData: any = basicProfile,
    workflowHistoryData: any = {},
    dataObs: any = of({ pageData: { data: { profileData: [{ key: 'k1', name: 'Field1' }], profileDataKey: [{ key: 'fk1', name: 'FK1' }] } } }),
  ) => {
    routerEvents$ = new Subject()
    activeRouteMock = buildActiveRoute(profileData, workflowHistoryData, dataObs)
    routerMock = {
      events: routerEvents$.asObservable(),
    }

    component = new ViewEventComponent(activeRouteMock, routerMock)
  }

  describe('constructor', () => {
    it('should populate basic profile fields on NavigationEnd', () => {
      setup()
      routerEvents$.next(new NavigationEnd(1, '/a', '/a'))
      expect(component.fullname).toBe('John Doe')
      expect(component.basicInfo.firstname).toBe('John')
      expect(component.professionalDetails.name).toBe('Acme')
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
      setup(basicProfile, wfHistoryData)
      routerEvents$.next(new NavigationEnd(1, '/a', '/a'))

      expect(component.wfHistory.length).toBe(1)
      expect(component.wfHistory[0].toValue).toBe('newval')
      expect(component.wfHistory[0].fromValue).toBe('oldval')
      expect(component.wfHistory[0].comment).toBe('a comment')
      expect(component.wfHistory[0].action).toBe('APPROVE')
    })

    it('should skip entries that are inWorkflow', () => {
      const wfHistoryData = {
        group1: [{ inWorkflow: true, createdOn: Date.now(), updateFieldValues: '{}' }],
      }
      setup(basicProfile, wfHistoryData)
      routerEvents$.next(new NavigationEnd(1, '/a', '/a'))
      expect(component.wfHistory.length).toBe(0)
    })

    it('should populate profileData and profileDataKeys from activeRoute.data', () => {
      setup()
      routerEvents$.next(new NavigationEnd(1, '/a', '/a'))
      expect(component.profileData.length).toBe(1)
      expect(component.profileDataKeys.length).toBe(1)
    })
  })

  describe('ngOnInit', () => {
    it('should populate tabsData with 4 tabs', () => {
      setup()
      component.ngOnInit()
      expect(component.tabsData.length).toBe(4)
      expect(component.tabsData[0].key).toBe('personalInfo')
    })
  })

  describe('ngAfterViewInit', () => {
    it('should set elementPosition from menuElement', () => {
      setup()
      component.menuElement = {
        nativeElement: { parentElement: { offsetTop: 88 } },
      } as any
      component.ngAfterViewInit()
      expect(component.elementPosition).toBe(88)
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
      expect(component.currentTab).toBe('skills')
    })
  })

  describe('changeToDefaultImg', () => {
    it('should set the default image src', () => {
      setup()
      const event = { target: { src: 'old.png' } }
      component.changeToDefaultImg(event)
      expect(event.target.src).toBe('/assets/instances/eagle/app_logos/aastar-logo.svg')
    })
  })

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      setup()
      const nextSpy = jest.spyOn((component as any).destroy$, 'next')
      const completeSpy = jest.spyOn((component as any).destroy$, 'complete')
      component.ngOnDestroy()
      expect(nextSpy).toHaveBeenCalled()
      expect(completeSpy).toHaveBeenCalled()
    })
  })

  describe('constructor edge cases', () => {
    it('should skip wfHistory push when updateFieldValues is not a string', () => {
      const wfHistoryData = {
        group1: [{ inWorkflow: false, createdOn: Date.now(), updateFieldValues: { already: 'object' } }],
      }
      setup(basicProfile, wfHistoryData)
      routerEvents$.next(new NavigationEnd(1, '/a', '/a'))
      expect(component.wfHistory.length).toBe(0)
    })

    it('should ignore non-NavigationEnd router events', () => {
      setup()
      expect(() => routerEvents$.next({ type: 'other' } as any)).not.toThrow()
      expect(component.fullname).toBe('')
    })
  })
})
