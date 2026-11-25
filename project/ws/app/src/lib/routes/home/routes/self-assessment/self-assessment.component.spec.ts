import { of } from 'rxjs'
import { SelfAssessmentComponent } from './self-assessment.component'

describe('SelfAssessmentComponent', () => {
  let component: SelfAssessmentComponent
  let routeMock: any
  let usersServiceMock: any
  let utilityServiceMock: any

  beforeEach(() => {
    routeMock = {
      snapshot: {
        parent: {
          data: {
            configService: {
              unMappedUser: {
                rootOrg: { rootOrgId: 'root1' },
              },
            },
          },
        },
      },
    }
    usersServiceMock = {
      getAllKongUsers: jest.fn().mockReturnValue(of({ result: { response: [{ id: 1 }] } })),
    }
    utilityServiceMock = {
      getFormatedRequest: jest.fn().mockReturnValue([{ id: 1, formatted: true }]),
    }
    component = new SelfAssessmentComponent(routeMock, usersServiceMock, utilityServiceMock)
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should call initialization', () => {
      const spy = jest.spyOn(component, 'initialization')
      component.ngOnInit()
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('ngOnDestroy', () => {
    it('should not throw', () => {
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })

  describe('initialization', () => {
    it('should set topBarConfig, tableData and call getAllUserSelfAssessment', () => {
      const spy = jest.spyOn(component, 'getAllUserSelfAssessment')
      component.initialization()
      expect(component.topBarConfig.right.length).toBe(2)
      expect(component.tableData.columns.length).toBe(7)
      expect(component.tableData.needCheckBox).toBe(true)
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('getAllUserSelfAssessment', () => {
    it('should fetch users and set usersData using formatted response', () => {
      component.getAllUserSelfAssessment()
      expect(usersServiceMock.getAllKongUsers).toHaveBeenCalledWith('root1')
      expect(utilityServiceMock.getFormatedRequest).toHaveBeenCalledWith([{ id: 1 }])
      expect(component.usersData).toEqual([{ id: 1, formatted: true }])
    })

    it('should handle missing rootOrgId gracefully', () => {
      routeMock.snapshot.parent = null
      expect(() => component.getAllUserSelfAssessment()).not.toThrow()
      expect(usersServiceMock.getAllKongUsers).toHaveBeenCalledWith(undefined)
    })
  })

  describe('searchByEnterKey', () => {
    it('should call getAllUserSelfAssessment when event is empty', () => {
      const spy = jest.spyOn(component, 'getAllUserSelfAssessment').mockImplementation(() => undefined)
      component.searchByEnterKey('')
      expect(spy).toHaveBeenCalled()
    })

    it('should call getAllUserSelfAssessment when event is null', () => {
      const spy = jest.spyOn(component, 'getAllUserSelfAssessment').mockImplementation(() => undefined)
      component.searchByEnterKey(null)
      expect(spy).toHaveBeenCalled()
    })

    it('should not call getAllUserSelfAssessment when event is non-empty', () => {
      const spy = jest.spyOn(component, 'getAllUserSelfAssessment').mockImplementation(() => undefined)
      component.searchByEnterKey('search text')
      expect(spy).not.toHaveBeenCalled()
    })
  })
})
