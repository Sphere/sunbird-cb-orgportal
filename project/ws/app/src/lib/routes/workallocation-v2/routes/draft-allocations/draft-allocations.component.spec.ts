import { DraftAllocationsComponent } from './draft-allocations.component'
import { of, Subject } from 'rxjs'

describe('DraftAllocationsComponent', () => {
  let component: DraftAllocationsComponent
  let activated: any
  let router: any
  let uploadService: any
  let dialog: any
  let allocateSrvc: any
  let queryParamMap$: Subject<any>
  let params$: Subject<any>

  const createComponent = () => {
    queryParamMap$ = new Subject<any>()
    params$ = new Subject<any>()
    activated = {
      queryParamMap: queryParamMap$.asObservable(),
      params: params$.asObservable(),
    }
    router = { navigate: jest.fn() }
    uploadService = { getDraftPDF: jest.fn(() => of(new Blob())) }
    dialog = { open: jest.fn() }
    allocateSrvc = {
      getAllocatedUsers: jest.fn(() =>
        of({ result: { data: { name: 'WO1', users: [{ userName: 'Alice' }, { userName: 'Bob' }] } } }),
      ),
    }
    component = new DraftAllocationsComponent(activated, router, uploadService, dialog, allocateSrvc)
    return component
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create', () => {
    createComponent()
    expect(component).toBeTruthy()
  })

  it('should set queryParams from status query param', () => {
    createComponent()
    queryParamMap$.next({ has: (key: string) => key === 'status', get: () => 'active' })
    expect(component.queryParams).toBe('active')
  })

  it('should set workorderID and load allocated users on param change', () => {
    createComponent()
    params$.next({ workorder: 'wo-1' })
    expect(component.workorderID).toBe('wo-1')
    expect(allocateSrvc.getAllocatedUsers).toHaveBeenCalledWith('wo-1')
    expect(component.workorderData.name).toBe('WO1')
    expect(component.data.length).toBe(2)
    expect(component.bdtitles.length).toBe(3)
  })

  it('ngOnInit should do nothing harmful', () => {
    createComponent()
    expect(() => component.ngOnInit()).not.toThrow()
  })

  it('should download draft pdf and open window', () => {
    createComponent()
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
    ;(URL as any).createObjectURL = jest.fn(() => 'blob:url')
    component.printDraft()
    expect(uploadService.getDraftPDF).toHaveBeenCalled()
    expect(openSpy).toHaveBeenCalledWith('blob:url')
  })

  it('ngOnChanges should update data and length and reset paginator', () => {
    createComponent()
    component.paginator = { firstPage: jest.fn() } as any
    component.ngOnChanges({ data: { currentValue: [1, 2, 3] } } as any)
    expect(component.data).toEqual([1, 2, 3])
    expect(component.length).toBe(3)
    expect(component.paginator.firstPage).toHaveBeenCalled()
  })

  it('onNewAllocationClick should navigate to create route', () => {
    createComponent()
    component.workorderID = 'wo-1'
    component.onNewAllocationClick()
    expect(router.navigate).toHaveBeenCalledWith(['/app/workallocation/create', 'wo-1'])
  })

  it('publishWorkOrder should open dialog', () => {
    createComponent()
    component.workorderData = { name: 'WO1' }
    component.publishWorkOrder()
    expect(dialog.open).toHaveBeenCalled()
  })

  it('filteredData should return all data when no term', () => {
    createComponent()
    component.data = [{ userName: 'Alice' }]
    component.term = null
    expect(component.filteredData).toEqual([{ userName: 'Alice' }])
  })

  it('filteredData should filter by term', () => {
    createComponent()
    component.data = [{ userName: 'Alice' }, { userName: 'Bob' }]
    component.term = 'ali'
    expect(component.filteredData).toEqual([{ userName: 'Alice' }])
  })

  it('edit should navigate to update route', () => {
    createComponent()
    component.workorderID = 'wo-1'
    component.edit('user-1')
    expect(router.navigate).toHaveBeenCalledWith(['/app/workallocation/update/', 'wo-1', 'user-1'])
  })

  it('ngOnDestroy should complete destroy subject without throwing', () => {
    createComponent()
    expect(() => component.ngOnDestroy()).not.toThrow()
  })
})
