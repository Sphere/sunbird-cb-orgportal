// ngx-export-as pulls in html2pdf.js, whose CJS bundle statically imports ESM jspdf
// internals that Jest can't parse. Mock it out before the component (which imports
// ExportAsService directly) gets loaded.
jest.mock('ngx-export-as', () => ({ ExportAsService: jest.fn() }))

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatMenuModule } from '@angular/material/menu'
import { Router, ActivatedRoute } from '@angular/router'
import { ExportAsService } from 'ngx-export-as'
import { of, throwError } from 'rxjs'
import { WorkallocationComponent } from './workallocation.component'
import { WorkallocationService } from '../../services/workallocation.service'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('WorkallocationComponent', () => {
  let component: WorkallocationComponent
  let fixture: ComponentFixture<WorkallocationComponent>
  let mockWorkallocationService: jest.Mocked<WorkallocationService>
  let mockRouter: jest.Mocked<Router>
  let mockDialog: jest.Mocked<MatDialog>
  let mockExportAsService: jest.Mocked<ExportAsService>
  let loaderEl: HTMLElement

  const setupActivatedRoute = (tab?: string) => ({
    snapshot: { params: { tab } },
  })

  const configureModule = async (tab?: string) => {
    mockWorkallocationService = createSpyObj('WorkallocationService', [
      'getAllUsers', 'getUsers', 'fetchWAT', 'fetchAllWATRequestBySearch', 'fetchUserByWID', 'getPDF', 'getTime',
    ])
    mockWorkallocationService.fetchWAT.mockReturnValue(of({ result: { data: [] } }) as any)
    mockWorkallocationService.fetchAllWATRequestBySearch.mockReturnValue(of({ result: { data: [] } }) as any)
    mockWorkallocationService.getTime.mockReturnValue('2020-01-01')

    mockRouter = createSpyObj('Router', ['navigate'])
    mockDialog = createSpyObj('MatDialog', ['open'])
    mockExportAsService = createSpyObj('ExportAsService', ['save'])

    await TestBed.configureTestingModule({
      declarations: [WorkallocationComponent],
      imports: [MatMenuModule],
      providers: [
        { provide: ExportAsService, useValue: mockExportAsService },
        { provide: Router, useValue: mockRouter },
        { provide: WorkallocationService, useValue: mockWorkallocationService },
        { provide: ActivatedRoute, useValue: setupActivatedRoute(tab) },
        { provide: MatDialog, useValue: mockDialog },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(WorkallocationComponent)
    component = fixture.componentInstance
  }

  beforeEach(() => {
    loaderEl = document.createElement('div')
    jest.spyOn(document, 'getElementById').mockReturnValue(loaderEl)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should default currentFilter to Draft when tab param is not Published', async () => {
      await configureModule('SomethingElse')
      expect(component.currentFilter).toBe('Draft')
    })

    it('should set currentFilter to Published when tab param is Published', async () => {
      await configureModule('Published')
      expect(component.currentFilter).toBe('Published')
    })
  })

  describe('ngOnInit', () => {
    beforeEach(async () => {
      await configureModule('SomethingElse')
    })

    it('should initialize tabledata config and trigger initial filter for Draft', () => {
      component.ngOnInit()
      expect(component.tabledata.columns[0]).toEqual({ displayName: 'Work order', key: 'workorders' })
      expect(mockWorkallocationService.fetchWAT).toHaveBeenCalledWith('Draft')
    })
  })

  describe('getTableData', () => {
    it('should return current data', async () => {
      await configureModule()
      component.data = ['x']
      expect(component.getTableData).toEqual(['x'])
    })
  })

  describe('export', () => {
    it('should open a PDF blob url from the export', async () => {
      await configureModule()
      mockWorkallocationService.getPDF.mockReturnValue(of(new Blob(['data'])) as any)
      if (!(URL as any).createObjectURL) {
        (URL as any).createObjectURL = jest.fn()
      }
      const createObjectURLSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null)

      component.selectedPDFid = 'id1'
      component.export()

      expect(mockWorkallocationService.getPDF).toHaveBeenCalledWith('id1')
      expect(createObjectURLSpy).toHaveBeenCalled()
      expect(windowOpenSpy).toHaveBeenCalledWith('blob:mock-url')
    })
  })

  describe('pdfCallbackFn', () => {
    it('should write page numbers to every page of the pdf', async () => {
      await configureModule()
      const setPage = jest.fn()
      const text = jest.fn()
      const pdf = {
        internal: {
          getNumberOfPages: () => 2,
          pageSize: { getWidth: () => 500, getHeight: () => 800 },
        },
        setPage,
        text,
      }
      component.pdfCallbackFn(pdf)
      expect(setPage).toHaveBeenCalledTimes(2)
      expect(text).toHaveBeenCalledTimes(2)
    })
  })

  describe('getdeptUsers', () => {
    it('should populate department info and load users for Draft', async () => {
      await configureModule()
      mockWorkallocationService.getAllUsers.mockReturnValue(
        of({ result: { response: { channel: 'Dept A', rootOrgId: 'org1' } } }) as any,
      )
      mockWorkallocationService.getUsers.mockReturnValue(
        of({ result: { data: [{ id: 1 }], totalhit: 1 } }) as any,
      )

      component.getdeptUsers()

      expect(component.departmentName).toBe('Dept A')
      expect(component.departmentID).toBe('org1')
      expect(component.userslist).toEqual([{ id: 1 }])
      expect(component.totalusersCount).toBe(1)
    })
  })

  describe('getAllUsers', () => {
    it('should default status to Draft when statusKey is empty', async () => {
      await configureModule()
      mockWorkallocationService.getUsers.mockReturnValue(
        of({ result: { data: [], totalhit: 0 } }) as any,
      )
      component.getAllUsers('')
      expect(mockWorkallocationService.getUsers).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'Draft' }),
      )
    })

    it('should use provided statusKey', async () => {
      await configureModule()
      mockWorkallocationService.getUsers.mockReturnValue(
        of({ result: { data: [], totalhit: 0 } }) as any,
      )
      component.getAllUsers('Published')
      expect(mockWorkallocationService.getUsers).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'Published' }),
      )
    })
  })

  describe('onRoleClick', () => {
    it('should set selectedPDFid and isPrint when element provided', async () => {
      await configureModule()
      component.onRoleClick({ id: 'abc' })
      expect(component.selectedPDFid).toBe('abc')
      expect(component.isPrint).toBe(true)
    })

    it('should do nothing when element is falsy', async () => {
      await configureModule()
      component.isPrint = false
      component.onRoleClick(null)
      expect(component.isPrint).toBe(false)
    })
  })

  describe('filter', () => {
    beforeEach(async () => {
      await configureModule()
      component.tabledata = {
        actions: [],
        columns: [{}, {}, {}, {}, {}],
        needCheckBox: false,
        needHash: false,
        sortColumn: 'workorders',
        sortState: 'asc',
        needUserMenus: true,
      } as any
    })

    it('should set Published columns and call getWAT with Published when key is Published', () => {
      component.filter('Published')
      expect(component.tabledata.columns[2]).toEqual({ displayName: 'Published on', key: 'lastupdatedon' })
      expect(component.tabledata.columns[4]).toEqual({ displayName: 'Approval', key: 'approval' })
      expect(component.currentFilter).toBe('Published')
      expect(mockWorkallocationService.fetchWAT).toHaveBeenCalledWith('Published')
    })

    it('should set default columns and call getWAT with Draft for Draft key', () => {
      component.filter('Draft')
      expect(component.tabledata.columns[2]).toEqual({ displayName: 'Last updated on', key: 'lastupdatedon' })
      expect(component.tabledata.columns[4]).toEqual({ displayName: 'Errors', key: 'errors' })
      expect(mockWorkallocationService.fetchWAT).toHaveBeenCalledWith('Draft')
    })

    it('should call getWAT with Published for Archived key (per current behavior)', () => {
      component.filter('Archived')
      expect(mockWorkallocationService.fetchWAT).toHaveBeenCalledWith('Published')
    })

    it('should fall back to Draft for unrecognized keys', () => {
      component.filter('SomethingUnknown')
      expect(mockWorkallocationService.fetchWAT).toHaveBeenCalledWith('Draft')
    })

    it('should reset isPrint and not call getWAT when key is falsy', () => {
      component.isPrint = true
      mockWorkallocationService.fetchWAT.mockClear()
      component.filter('')
      expect(component.isPrint).toBe(false)
      expect(mockWorkallocationService.fetchWAT).not.toHaveBeenCalled()
    })
  })

  describe('getWAT', () => {
    beforeEach(async () => {
      await configureModule()
    })

    it('should map response data into table rows and toggle loader', () => {
      mockWorkallocationService.fetchWAT.mockReturnValue(
        of({
          result: {
            data: [
              {
                id: '1', name: 'WO1', userIds: ['u1', 'u2'], updatedAt: 1000, updatedByName: 'Alice',
                errorCount: 0, createdAt: 900, createdByName: 'Bob', publishedPdfLink: 'p', signedPdfLink: 's',
              },
            ],
          },
        }) as any,
      )

      component.getWAT('Draft')

      expect(component.data).toEqual([
        expect.objectContaining({ id: '1', workorders: 'WO1', officers: 2, lastupdatedby: 'Alice', approval: 'Download' }),
      ])
      expect(loaderEl.style.display).toBe('none')
    })

    it('should set data to empty array when result has no data', () => {
      mockWorkallocationService.fetchWAT.mockReturnValue(of({ result: {} }) as any)
      component.getWAT('Draft')
      expect(component.data).toEqual([])
    })

    it('should handle officers count of 0 when userIds missing', () => {
      mockWorkallocationService.fetchWAT.mockReturnValue(
        of({ result: { data: [{ id: '2', name: 'WO2' }] } }) as any,
      )
      component.getWAT('Draft')
      expect(component.data[0].officers).toBe(0)
    })

    it('should hide loader on error', () => {
      mockWorkallocationService.fetchWAT.mockReturnValue(throwError({ message: 'boom' }))
      component.getWAT('Draft')
      expect(loaderEl.style.display).toBe('none')
    })
  })

  describe('getWATBySearch', () => {
    beforeEach(async () => {
      await configureModule()
    })

    it('should map search response data into rows with Approval action', () => {
      mockWorkallocationService.fetchAllWATRequestBySearch.mockReturnValue(
        of({
          result: {
            data: [
              {
                id: '1', name: 'WO1', userIds: ['u1'], updatedAt: 1000, updatedByName: 'Alice',
                errorCount: 1, createdAt: 900, createdByName: 'Bob',
              },
            ],
          },
        }) as any,
      )

      component.getWATBySearch('query', 'Draft')

      expect(component.data).toEqual([
        expect.objectContaining({ id: '1', workorders: 'WO1', officers: 1, approval: 'Approval' }),
      ])
    })

    it('should hide loader on error', () => {
      mockWorkallocationService.fetchAllWATRequestBySearch.mockReturnValue(throwError({ message: 'boom' }))
      component.getWATBySearch('q', 'Draft')
      expect(loaderEl.style.display).toBe('none')
    })
  })

  describe('getUserByWID', () => {
    it('should subscribe and return the immediate Loading.. string', async () => {
      await configureModule()
      mockWorkallocationService.fetchUserByWID.mockReturnValue(
        of({ result: { data: { first_name: 'A', last_name: 'B' } } }) as any,
      )
      const result = component.getUserByWID('wid1')
      expect(result).toBe('Loading..')
      expect(mockWorkallocationService.fetchUserByWID).toHaveBeenCalledWith('wid1')
    })
  })

  describe('ngOnChanges', () => {
    it('should update data, length, and reset paginator to first page', async () => {
      await configureModule()
      const firstPageSpy = jest.fn()
      component.paginator = { firstPage: firstPageSpy } as any
      component.ngOnChanges({ data: { currentValue: [1, 2, 3] } as any })
      expect(component.data).toEqual([1, 2, 3])
      expect(component.length).toBe(3)
      expect(firstPageSpy).toHaveBeenCalled()
    })
  })

  describe('applyFilter', () => {
    it('should lowercase a truthy filter value (note: current source trims but then overwrites with the untrimmed lowercase value)', async () => {
      await configureModule()
      component.data = {} as any
      component.applyFilter('  ABC ')
      expect((component.data as any).filter).toBe('  abc ')
    })

    it('should clear the filter for a falsy value', async () => {
      await configureModule()
      component.data = {} as any
      component.applyFilter(null)
      expect((component.data as any).filter).toBe('')
    })
  })

  describe('onNewAllocationClick', () => {
    it('should open the dialog and refresh table on close', async () => {
      await configureModule()
      mockDialog.open.mockReturnValue({ afterClosed: () => of(undefined) } as any)
      component.currentFilter = 'Draft'

      component.onNewAllocationClick()

      expect(mockDialog.open).toHaveBeenCalled()
      expect(mockWorkallocationService.fetchWAT).toHaveBeenCalledWith('Draft')
    })
  })

  describe('viewAllocation', () => {
    it('should navigate to the allocation detail route', async () => {
      await configureModule()
      component.viewAllocation({ userId: 'u123' })
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/workallocation/details/u123'])
    })
  })

  describe('buttonClick', () => {
    it('should push row and call exportAsService.save on Download action', async () => {
      await configureModule()
      mockExportAsService.save.mockReturnValue(of('done') as any)
      const row = { id: 'r1' }
      component.buttonClick('Download', row)
      expect(component.downloaddata).toEqual([row])
      expect(mockExportAsService.save).toHaveBeenCalledWith(component.config, 'WorkAllocation')
    })

    it('should reset downloaddata and no-op on Archive action', async () => {
      await configureModule()
      component.downloaddata = ['stale']
      component.buttonClick('Archive', { id: 'r1' })
      expect(component.downloaddata).toEqual([])
      expect(mockExportAsService.save).not.toHaveBeenCalled()
    })
  })

  describe('searchBasedOnQurey', () => {
    it('should call getWATBySearch with stringified query and current filter', async () => {
      await configureModule()
      component.currentFilter = 'Draft'
      const getWATBySearchSpy = jest.spyOn(component, 'getWATBySearch')
      component.searchBasedOnQurey('term' as any)
      expect(getWATBySearchSpy).toHaveBeenCalledWith('term', 'Draft')
    })
  })

  describe('displayLoader', () => {
    it('should set display to block when value is truthy', async () => {
      await configureModule()
      component.displayLoader(true)
      expect(loaderEl.style.display).toBe('block')
    })

    it('should set display to none when value is falsy', async () => {
      await configureModule()
      component.displayLoader(false)
      expect(loaderEl.style.display).toBe('none')
    })
  })

  describe('ngOnDestroy', () => {
    it('should unsubscribe tabs when present', async () => {
      await configureModule()
      const unsubscribe = jest.fn()
      component.tabs = { unsubscribe }
      component.ngOnDestroy()
      expect(unsubscribe).toHaveBeenCalled()
    })

    it('should do nothing when tabs is not set', async () => {
      await configureModule()
      component.tabs = undefined
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })
})
