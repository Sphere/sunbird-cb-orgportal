import { of } from 'rxjs'
import { ApprovalsComponent } from './approvals.component'

describe('ApprovalsComponent', () => {
  let component: ApprovalsComponent
  let routerMock: any
  let apprServiceMock: any
  let activeRouterMock: any
  let snackbarMock: any

  const setup = (deptChannel: string | undefined, approvalsResponse: any = { result: { data: [] } }) => {
    routerMock = { navigate: jest.fn() }
    apprServiceMock = {
      getApprovals: jest.fn().mockReturnValue(of(approvalsResponse)),
    }
    activeRouterMock = {
      parent: deptChannel !== undefined
        ? {
          snapshot: {
            data: {
              configService: {
                unMappedUser: { channel: deptChannel },
              },
            },
          },
        }
        : null,
    }
    snackbarMock = { open: jest.fn() }
    component = new ApprovalsComponent(routerMock, apprServiceMock, activeRouterMock, snackbarMock)
  }

  describe('constructor / fetchApprovals', () => {
    it('should set departName when parent data has channel and fetch approvals', () => {
      setup('DeptA')
      expect(component.departName).toBe('DeptA')
      expect(apprServiceMock.getApprovals).toHaveBeenCalled()
    })

    it('should not set departName when parent is missing', () => {
      setup(undefined)
      expect(component.departName).toBe('')
      expect(snackbarMock.open).toHaveBeenCalledWith('Please connect to your SPV admin, to update MDO name.')
    })

    it('should not set departName when channel is empty string', () => {
      setup('')
      expect(component.departName).toBe('')
      expect(snackbarMock.open).toHaveBeenCalled()
    })

    it('should push data with userInfo full name when approval has userInfo', () => {
      const approvalsResponse = {
        result: {
          data: [
            {
              userInfo: { first_name: 'John', last_name: 'Doe' },
              wfInfo: [
                {
                  createdOn: '2023-01-01T00:00:00Z',
                  updateFieldValues: JSON.stringify([{ fromValue: { fieldA: 'x' } }]),
                },
              ],
            },
          ],
        },
      }
      setup('DeptA', approvalsResponse)
      expect(component.data.length).toBe(1)
      expect(component.data[0].fullname).toBe('John Doe')
      expect(component.data[0].fields).toBe('fieldA,')
    })

    it('should push data with "--" fullname when userInfo missing', () => {
      const approvalsResponse = {
        result: {
          data: [
            {
              wfInfo: [
                { createdOn: '2023-01-01T00:00:00Z', updateFieldValues: JSON.stringify([]) },
              ],
            },
          ],
        },
      }
      setup('DeptA', approvalsResponse)
      expect(component.data[0].fullname).toBe('--')
      expect(component.data[0].fields).toBe('')
    })

    it('should skip parsing updateFieldValues when not a string', () => {
      const approvalsResponse = {
        result: {
          data: [
            {
              userInfo: { first_name: 'Jane', last_name: 'Roe' },
              wfInfo: [
                { createdOn: '2023-01-01T00:00:00Z', updateFieldValues: { already: 'object' } },
              ],
            },
          ],
        },
      }
      setup('DeptA', approvalsResponse)
      expect(component.data[0].fields).toBe('')
    })

    it('should skip fields.forEach when parsed fields array is empty', () => {
      const approvalsResponse = {
        result: {
          data: [
            {
              userInfo: { first_name: 'Jane', last_name: 'Roe' },
              wfInfo: [
                { createdOn: '2023-01-01T00:00:00Z', updateFieldValues: JSON.stringify([]) },
              ],
            },
          ],
        },
      }
      setup('DeptA', approvalsResponse)
      expect(component.data[0].fields).toBe('')
    })
  })

  describe('ngOnInit', () => {
    it('should not throw', () => {
      setup('DeptA')
      expect(() => component.ngOnInit()).not.toThrow()
    })
  })

  describe('filter', () => {
    it('should call fetchApprovals for toapprove key', () => {
      setup('DeptA')
      const fetchSpy = jest.spyOn(component, 'fetchApprovals')
      component.filter('toapprove')
      expect(component.currentFilter).toBe('toapprove')
      expect(fetchSpy).toHaveBeenCalled()
    })

    it('should set data for userflags key', () => {
      setup('DeptA')
      component.filter('userflags')
      expect(component.currentFilter).toBe('userflags')
      expect(component.data.length).toBe(1)
      expect(component.data[0].fullname).toBe('Nancy Jimenez')
    })

    it('should hit default case for unknown key without changing data', () => {
      setup('DeptA')
      component.data = []
      component.filter('someOtherKey')
      expect(component.currentFilter).toBe('someOtherKey')
      expect(component.data).toEqual([])
    })

    it('should do nothing when key is falsy', () => {
      setup('DeptA')
      const prevFilter = component.currentFilter
      component.filter('')
      expect(component.currentFilter).toBe(prevFilter)
    })
  })

  describe('onApprovalClick', () => {
    it('should navigate when approval has userWorkflow.userInfo', () => {
      setup('DeptA')
      component.onApprovalClick({ userWorkflow: { userInfo: { wid: 'w123' } } })
      expect(routerMock.navigate).toHaveBeenCalledWith(['/app/approvals/w123/to-approve'])
    })

    it('should not navigate when approval is falsy', () => {
      setup('DeptA')
      component.onApprovalClick(null)
      expect(routerMock.navigate).not.toHaveBeenCalled()
    })

    it('should not navigate when userWorkflow.userInfo is missing', () => {
      setup('DeptA')
      component.onApprovalClick({ userWorkflow: {} })
      expect(routerMock.navigate).not.toHaveBeenCalled()
    })
  })

  describe('getTableData', () => {
    it('should return data array', () => {
      setup('DeptA')
      component.data = [{ a: 1 }]
      expect(component.getTableData).toEqual([{ a: 1 }])
    })
  })

  describe('ngOnDestroy', () => {
    it('should not throw', () => {
      setup('DeptA')
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })
})
