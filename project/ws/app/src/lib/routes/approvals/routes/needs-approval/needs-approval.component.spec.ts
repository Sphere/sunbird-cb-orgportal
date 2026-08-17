import { NeedsApprovalComponent } from './needs-approval.component'
import { of, Subject } from 'rxjs'
import { NavigationEnd } from '@angular/router'

describe('NeedsApprovalComponent', () => {
  let component: NeedsApprovalComponent
  let needApprService: any
  let activeRoute: any
  let router: any
  let dialog: any
  let matSnackBar: any
  let routerEvents$: Subject<any>

  const wfInfo = [
    {
      wfId: 'wf1',
      userId: 'u1',
      applicationId: 'app1',
      updateFieldValues: JSON.stringify([
        { toValue: { k1: 'newval' }, fieldKey: 'fk1' },
      ]),
    },
  ]

  const createComponent = (
    profileData: any[] = [{ key: 'k1', name: 'Field1' }],
    workflowData: any = { userInfo: { wid: 'wid1' }, wfInfo },
  ) => {
    routerEvents$ = new Subject<any>()
    needApprService = { handleWorkflow: jest.fn(() => of({ result: { data: { wfIds: ['wf1'] } } })) }
    activeRoute = {
      data: of({ pageData: { data: { profileData } } }),
      snapshot: { data: { workflowData: { data: { result: { data: [workflowData] } } } } },
    }
    router = { events: routerEvents$.asObservable() }
    dialog = { open: jest.fn(() => ({ afterClosed: () => of(true) })) }
    matSnackBar = { open: jest.fn() }
    component = new NeedsApprovalComponent(needApprService, activeRoute, router, dialog, matSnackBar)
    return component
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create', () => {
    createComponent()
    expect(component).toBeTruthy()
  })

  it('should build needApprovalList from wfInfo on NavigationEnd', () => {
    createComponent()
    routerEvents$.next(new NavigationEnd(1, '/a', '/a'))
    expect(component.needApprovalList.length).toBe(1)
    expect(component.needApprovalList[0].label).toBe('Field1')
    expect(component.needApprovalList[0].value).toBe('newval')
  })

  it('should not throw when userwfData has no wfInfo', () => {
    createComponent([], { userInfo: { wid: 'wid1' } })
    expect(() => routerEvents$.next(new NavigationEnd(1, '/a', '/a'))).not.toThrow()
    expect(component.needApprovalList.length).toBe(0)
  })

  it('ngOnInit should not throw', () => {
    createComponent()
    expect(() => component.ngOnInit()).not.toThrow()
  })

  it('ngOnDestroy should not throw', () => {
    createComponent()
    expect(() => component.ngOnDestroy()).not.toThrow()
  })

  it('onClickHandleWorkflow APPROVE should open approveDialog and call onApproveOrRejectClick when result truthy', () => {
    createComponent()
    routerEvents$.next(new NavigationEnd(1, '/a', '/a'))
    const afterClosed$ = new Subject<any>()
    dialog.open = jest.fn(() => ({ afterClosed: () => afterClosed$.asObservable() }))
    const spy = jest.spyOn(component, 'onApproveOrRejectClick').mockImplementation()
    component.onClickHandleWorkflow(component.needApprovalList[0], 'APPROVE')
    afterClosed$.next(true)
    expect(dialog.open).toHaveBeenCalled()
    expect(spy).toHaveBeenCalled()
  })

  it('onClickHandleWorkflow REJECT should open rejectDialog and close when result falsy', () => {
    createComponent()
    routerEvents$.next(new NavigationEnd(1, '/a', '/a'))
    const dialogRef = { afterClosed: () => of(false), close: jest.fn() }
    dialog.open = jest.fn(() => dialogRef)
    component.onClickHandleWorkflow(component.needApprovalList[0], 'REJECT')
    expect(dialog.open).toHaveBeenCalled()
    expect(dialogRef.close).toHaveBeenCalled()
  })

  it('onApproveOrRejectClick should update list and open snackbar on success', () => {
    createComponent()
    component.needApprovalList = [{ wfId: 'wf1' }, { wfId: 'wf2' }]
    component.onApproveOrRejectClick({ wf: {} })
    expect(needApprService.handleWorkflow).toHaveBeenCalled()
    expect(matSnackBar.open).toHaveBeenCalledWith('Request Approved')
    expect(component.needApprovalList.length).toBe(1)
    expect(component.needApprovalList[0].wfId).toBe('wf2')
  })

  it('onApproveOrRejectClick should not update list when result data is falsy', () => {
    createComponent()
    needApprService.handleWorkflow = jest.fn(() => of({ result: { data: null } }))
    component.needApprovalList = [{ wfId: 'wf1' }]
    component.onApproveOrRejectClick({ wf: {} })
    expect(matSnackBar.open).not.toHaveBeenCalled()
    expect(component.needApprovalList.length).toBe(1)
  })
})
