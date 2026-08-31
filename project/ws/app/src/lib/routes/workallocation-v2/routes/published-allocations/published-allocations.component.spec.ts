// ngx-export-as pulls in html2pdf.js, whose CJS bundle statically imports ESM jspdf
// internals that Jest can't parse. Mock it out before the component (which imports
// ExportAsService directly) gets loaded.
jest.mock('ngx-export-as', () => ({ ExportAsService: jest.fn() }))

import { of, Subject } from 'rxjs'
import { PublishedAllocationsComponent } from './published-allocations.component'

describe('PublishedAllocationsComponent', () => {
  let component: PublishedAllocationsComponent
  let activated: any
  let exportAsService: any
  let allocateSrvc: any
  let params$: Subject<any>

  const createComponent = () => {
    params$ = new Subject<any>()
    activated = { params: params$.asObservable() }
    exportAsService = { save: jest.fn(() => of(null)) }
    allocateSrvc = {
      getAllocatedUsers: jest.fn(() =>
        of({ result: { data: { name: 'WO1', users: [{ userName: 'Alice' }, { userName: 'Bob' }] } } }),
      ),
    }
    component = new PublishedAllocationsComponent(activated, exportAsService, allocateSrvc)
    return component
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create', () => {
    createComponent()
    expect(component).toBeTruthy()
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

  it('should default workorderID to empty string when param missing', () => {
    createComponent()
    params$.next({})
    expect(component.workorderID).toBe('')
  })

  it('ngOnInit should do nothing harmful', () => {
    createComponent()
    expect(() => component.ngOnInit()).not.toThrow()
  })

  it('ngOnDestroy should complete destroy subject without throwing', () => {
    createComponent()
    expect(() => component.ngOnDestroy()).not.toThrow()
  })

  describe('viewscanned', () => {
    it('opens window with signedPdfLink', () => {
      createComponent()
      component.workorderData = { signedPdfLink: 'http://signed.pdf' }
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
      component.viewscanned()
      expect(openSpy).toHaveBeenCalledWith('http://signed.pdf')
    })
  })

  describe('print', () => {
    it('opens window with publishedPdfLink', () => {
      createComponent()
      component.workorderData = { publishedPdfLink: 'http://published.pdf' }
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
      component.print()
      expect(openSpy).toHaveBeenCalledWith('http://published.pdf')
    })
  })

  describe('ngOnChanges', () => {
    it('updates data and length and resets paginator', () => {
      createComponent()
      component.paginator = { firstPage: jest.fn() } as any
      component.ngOnChanges({ data: { currentValue: [1, 2, 3] } } as any)
      expect(component.data).toEqual([1, 2, 3])
      expect(component.length).toBe(3)
      expect(component.paginator.firstPage).toHaveBeenCalled()
    })
  })

  describe('buttonClick', () => {
    it('handles Download action: pushes row and calls exportAsService.save', () => {
      createComponent()
      const row = { id: 1 }
      component.buttonClick('Download', row)
      expect(component.downloaddata).toEqual([row])
      expect(exportAsService.save).toHaveBeenCalledWith(component.config, 'WorkAllocation')
    })

    it('handles Archive action without throwing', () => {
      createComponent()
      expect(() => component.buttonClick('Archive', { id: 2 })).not.toThrow()
      expect(component.downloaddata).toEqual([])
    })

    it('handles unknown action without throwing', () => {
      createComponent()
      expect(() => component.buttonClick('Unknown', { id: 3 })).not.toThrow()
    })
  })

  describe('getAllocatedUsers', () => {
    it('sets workorderData, appends bdtitle, and sets data from users', () => {
      createComponent()
      const initialBdtitleLength = component.bdtitles.length
      component.getAllocatedUsers('wo-99')
      expect(allocateSrvc.getAllocatedUsers).toHaveBeenCalledWith('wo-99')
      expect(component.workorderData.name).toBe('WO1')
      expect(component.bdtitles.length).toBe(initialBdtitleLength + 1)
      expect(component.data).toEqual([{ userName: 'Alice' }, { userName: 'Bob' }])
    })
  })
})
