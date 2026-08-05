import { of } from 'rxjs'
import { WelcomeComponent } from './welcome.component'

describe('WelcomeComponent', () => {
  let component: WelcomeComponent
  let documentMock: any
  let homeResolverMock: any
  let linkMock: any

  const setup = (userDetails: any = {}) => {
    linkMock = {
      target: '',
      href: '',
      click: jest.fn(),
      remove: jest.fn(),
    }
    documentMock = {
      createElement: jest.fn().mockReturnValue(linkMock),
    }
    homeResolverMock = {
      getUserDetails: jest.fn().mockReturnValue(of(userDetails)),
    }
    component = new WelcomeComponent(documentMock, homeResolverMock)
  }

  describe('filterR', () => {
    it('should set resolutionFilter', () => {
      setup()
      component.filterR('month')
      expect(component.resolutionFilter).toBe('month')
    })
  })

  describe('filterComp', () => {
    it('should set compFilter', () => {
      setup()
      component.filterComp('chart')
      expect(component.compFilter).toBe('chart')
    })
  })

  describe('ngOnDestroy', () => {
    it('should not throw', () => {
      setup()
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })

  describe('ngAfterViewInit', () => {
    it('should not throw', () => {
      setup()
      expect(() => component.ngAfterViewInit()).not.toThrow()
    })
  })

  describe('selectDashbord', () => {
    it('should set selectedDashboardId and push dashboardOne when selectedDashboardId is empty', () => {
      setup()
      component.selectedDashboardId = ''
      component.currentDashboard = []
      component.selectDashbord()
      expect(component.selectedDashboardId).toBe(component.dashboardList[0].responseData[0].id)
      expect(component.currentDashboard.length).toBe(1)
      expect(component.currentDashboard[0]).toBe(component.dashboardOne)
    })

    it('should not push dashboardOne again when selectedDashboardId is already set', () => {
      setup()
      component.selectedDashboardId = 'already-set'
      component.currentDashboard = []
      component.selectDashbord()
      expect(component.selectedDashboardId).toBe('already-set')
      expect(component.currentDashboard.length).toBe(0)
    })
  })

  describe('getUserDetails', () => {
    it('should set showCBPLink true for CONTENT_CREATOR role', () => {
      setup({ roles: ['CONTENT_CREATOR'] })
      component.getUserDetails()
      expect(homeResolverMock.getUserDetails).toHaveBeenCalled()
      expect(component.showCBPLink).toBe(true)
      expect(component.showKarmayogiLink).toBe(false)
    })

    it('should set showCBPLink true for EDITOR role', () => {
      setup({ roles: ['EDITOR'] })
      component.getUserDetails()
      expect(component.showCBPLink).toBe(true)
    })

    it('should set showCBPLink true for PUBLISHER role', () => {
      setup({ roles: ['PUBLISHER'] })
      component.getUserDetails()
      expect(component.showCBPLink).toBe(true)
    })

    it('should set showCBPLink true for REVIEWER role', () => {
      setup({ roles: ['REVIEWER'] })
      component.getUserDetails()
      expect(component.showCBPLink).toBe(true)
    })

    it('should set showKarmayogiLink true for Member role', () => {
      setup({ roles: ['Member'] })
      component.getUserDetails()
      expect(component.showKarmayogiLink).toBe(true)
      expect(component.showCBPLink).toBe(false)
    })

    it('should not set any flags for unrelated roles', () => {
      setup({ roles: ['SOME_OTHER_ROLE'] })
      component.getUserDetails()
      expect(component.showCBPLink).toBe(false)
      expect(component.showKarmayogiLink).toBe(false)
    })

    it('should not throw and not set flags when roles is empty array', () => {
      setup({ roles: [] })
      expect(() => component.getUserDetails()).not.toThrow()
      expect(component.showCBPLink).toBe(false)
      expect(component.showKarmayogiLink).toBe(false)
    })

    it('should not throw and not set flags when roles is missing', () => {
      setup({})
      expect(() => component.getUserDetails()).not.toThrow()
      expect(component.showCBPLink).toBe(false)
      expect(component.showKarmayogiLink).toBe(false)
    })
  })

  describe('ngOnInit', () => {
    it('should call getUserDetails and selectDashbord', () => {
      setup({ roles: ['Member'] })
      const getUserDetailsSpy = jest.spyOn(component, 'getUserDetails')
      const selectDashbordSpy = jest.spyOn(component, 'selectDashbord')
      component.ngOnInit()
      expect(getUserDetailsSpy).toHaveBeenCalled()
      expect(selectDashbordSpy).toHaveBeenCalled()
      expect(component.showKarmayogiLink).toBe(true)
    })
  })

  describe('openky / openNewWindow', () => {
    it('should create an anchor, set target/href, click and remove it', () => {
      setup()
      component.openky()
      expect(documentMock.createElement).toHaveBeenCalledWith('a')
      expect(linkMock.target).toBe('_blank')
      expect(linkMock.click).toHaveBeenCalled()
      expect(linkMock.remove).toHaveBeenCalled()
    })
  })

  describe('openCBP / openNewWindowCBP', () => {
    it('should create an anchor, set target/href, click and remove it', () => {
      setup()
      component.openCBP()
      expect(documentMock.createElement).toHaveBeenCalledWith('a')
      expect(linkMock.target).toBe('_blank')
      expect(linkMock.click).toHaveBeenCalled()
      expect(linkMock.remove).toHaveBeenCalled()
    })
  })
})
