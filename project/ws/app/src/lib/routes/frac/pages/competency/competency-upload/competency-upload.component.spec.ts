import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute, Router } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { BehaviorSubject, of, throwError } from 'rxjs'
import { CompetencyUploadComponent } from './competency-upload.component'
import { FracApiService } from '../../../services/frac-api.service'
import { FracEntityUploadOrchestratorService } from '../../../services/frac-entity-upload-orchestrator.service'
import { TableTransformUtil } from '../../../utils/table-transform.util'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { FRAC_ROUTES } from '../../../constants/frac.constants'
import { UploadResultModalComponent } from '../../../components/upload-result-modal/upload-result-modal.component'
import { UnsavedChangesModalComponent } from '../../../components/unsaved-changes-modal/unsaved-changes-modal.component'
import { FracUploadPopupComponent } from '../../../components/frac-upload/frac-upload-popup.component'

describe('CompetencyUploadComponent', () => {
  let component: CompetencyUploadComponent
  let fixture: ComponentFixture<CompetencyUploadComponent>
  let queryParams$: BehaviorSubject<Record<string, string>>
  let mockFracApiService: jest.Mocked<FracApiService>
  let mockMatDialog: jest.Mocked<MatDialog>
  let mockTableTransformUtil: jest.Mocked<TableTransformUtil>
  let mockRouter: jest.Mocked<Router>

  beforeEach(async () => {
    queryParams$ = new BehaviorSubject<Record<string, string>>({ mode: 'upload' })
    mockFracApiService = createSpyObj('FracApiService', ['searchEntities', 'uploadFile', 'updateEntity', 'deleteEntity'])
    mockMatDialog = createSpyObj('MatDialog', ['open'])
    mockTableTransformUtil = createSpyObj('TableTransformUtil', ['transformResponseToTableConfig'])
    mockRouter = createSpyObj('Router', ['navigateByUrl'])

    mockFracApiService.searchEntities.mockReturnValue(of({ result: { entity: [] } }) as any)
    mockTableTransformUtil.transformResponseToTableConfig.mockReturnValue({ columns: [], data: [] } as any)
    mockMatDialog.open.mockReturnValue({ afterClosed: () => of(undefined) } as any)

    await TestBed.configureTestingModule({
      declarations: [CompetencyUploadComponent],
      providers: [
        FracEntityUploadOrchestratorService,
        { provide: MatDialog, useValue: mockMatDialog },
        { provide: Router, useValue: mockRouter },
        { provide: FracApiService, useValue: mockFracApiService },
        { provide: TableTransformUtil, useValue: mockTableTransformUtil },
        { provide: ActivatedRoute, useValue: { queryParams: queryParams$.asObservable() } },
        { provide: ConfigurationsService, useValue: { instanceConfig: {} } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(CompetencyUploadComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should set upload button text based on route mode', () => {
    component.routeMode = 'upload'
    component.updateButtonText()
    expect(component.uploadButtonText).toBe('Upload File')

    component.routeMode = 'manage'
    component.updateButtonText()
    expect(component.uploadButtonText).toBe('Change File')
  })

  it('should trigger initial search in manage mode', () => {
    queryParams$.next({ mode: 'manage' })
    expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('competency', '', 'en')
  })

  describe('ngOnInit / loadTableDataBasedOnMode', () => {
    it('should reset table state when in upload mode', () => {
      queryParams$.next({ mode: 'upload' })
      expect(component.tableConfig).toEqual({ columns: [], data: [] })
      expect(component.originalRowData).toEqual([])
      expect(component.selectedRows).toEqual([])
      expect(component.editRows).toEqual([])
      expect(component.removedData).toEqual([])
      expect(component.isEditing).toBe(false)
    })

    it('should populate table data on successful search in manage mode', () => {
      mockFracApiService.searchEntities.mockReturnValue(
        of({ result: { entity: [{ code: 'C1', name: 'Comp 1' }] } }) as any,
      )
      mockTableTransformUtil.transformResponseToTableConfig.mockReturnValue({
        columns: [{ key: 'name', label: 'Name' }],
        data: [{ code: 'C1', name: 'Comp 1' }],
      } as any)

      queryParams$.next({ mode: 'manage' })

      expect(component.isSearching).toBe(false)
      expect(component.tableConfig.data).toEqual([{ code: 'C1', name: 'Comp 1' }])
      expect(component.originalRowData).toEqual([{ code: 'C1', name: 'Comp 1' }])
    })

    it('should handle search error gracefully', () => {
      mockFracApiService.searchEntities.mockReturnValue(throwError(() => new Error('boom')))

      expect(() => queryParams$.next({ mode: 'manage' })).not.toThrow()
      expect(component.isSearching).toBe(false)
    })
  })

  describe('search triggers', () => {
    beforeEach(() => {
      component.routeMode = 'manage'
    })

    it('should debounce typing search and run immediate enter search', fakeAsync(() => {
      component.searchTerm = 'Comp'
      component.onSearchTermChange()
      tick(499)
      expect(mockFracApiService.searchEntities).not.toHaveBeenCalledWith('competency', 'Comp', 'en')
      tick(1)
      expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('competency', 'Comp', 'en')

      component.searchTerm = 'Comp now'
      component.onSearchEnter()
      expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('competency', 'Comp now', 'en')
    }))

    it('should trigger search on icon click', fakeAsync(() => {
      component.searchTerm = 'icon-search'
      component.onSearch()
      tick(600)
      expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('competency', 'icon-search', 'en')
    }))

    it('should not trigger search when filter controls are disabled (upload mode)', () => {
      component.routeMode = 'upload'
      jest.clearAllMocks()
      component.onSearchTermChange()
      component.onSearch()
      component.onSearchEnter()
      expect(mockFracApiService.searchEntities).not.toHaveBeenCalled()
    })
  })

  describe('language dropdown', () => {
    it('should toggle dropdown open/closed', () => {
      component.isOpen = false
      component.toggleDropdown()
      expect(component.isOpen).toBe(true)
      component.toggleDropdown()
      expect(component.isOpen).toBe(false)
    })

    it('should not open dropdown while uploading', () => {
      component.isUploading = true
      component.isOpen = false
      component.toggleDropdown()
      expect(component.isOpen).toBe(false)
    })

    it('should select a language and trigger search in manage mode', fakeAsync(() => {
      component.routeMode = 'manage'
      const event = { stopPropagation: jest.fn() } as unknown as MouseEvent
      component.selectLanguage({ key: 'hi' }, event)
      expect(component.selectedLanguage).toBe('hi')
      expect(component.isOpen).toBe(false)
      expect(event.stopPropagation).toHaveBeenCalled()
      tick(600)
      expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('competency', '', 'hi')
    }))

    it('should not select language when dropdown is disabled', () => {
      component.isUploading = true
      const event = { stopPropagation: jest.fn() } as unknown as MouseEvent
      const prevLang = component.selectedLanguage
      component.selectLanguage({ key: 'ta' }, event)
      expect(component.selectedLanguage).toBe(prevLang)
      expect(event.stopPropagation).toHaveBeenCalled()
    })
  })

  describe('onUploadFile / openUploadPopup', () => {
    it('should open the upload popup dialog', () => {
      component.onUploadFile()
      expect(mockMatDialog.open).toHaveBeenCalledWith(
        FracUploadPopupComponent,
        expect.objectContaining({ disableClose: true }),
      )
    })

    it('should call uploadFile when popup result has action upload with a file', () => {
      const file = new File(['data'], 'file.csv')
      mockMatDialog.open.mockReturnValue({
        afterClosed: () => of({ action: 'upload', file, language: 'en' }),
      } as any)
      jest.spyOn(component, 'uploadFile').mockImplementation(() => undefined)

      component.openUploadPopup()

      expect(component.uploadFile).toHaveBeenCalledWith(file, 'en')
    })

    it('should not call uploadFile when popup is dismissed', () => {
      mockMatDialog.open.mockReturnValue({ afterClosed: () => of(undefined) } as any)
      jest.spyOn(component, 'uploadFile').mockImplementation(() => undefined)

      component.openUploadPopup()

      expect(component.uploadFile).not.toHaveBeenCalled()
    })
  })

  describe('onSelectionChange', () => {
    it('should update selected rows', () => {
      const rows = [{ code: 'A' }, { code: 'B' }] as any
      component.onSelectionChange(rows)
      expect(component.selectedRows).toEqual(rows)
    })

    it('should filter edit rows to remaining selection and exit edit mode when empty', () => {
      const rowA = { code: 'A' }
      const rowB = { code: 'B' }
      component.isEditing = true
      component.editRows = [rowA, rowB] as any

      component.onSelectionChange([rowA] as any)
      expect(component.editRows).toEqual([rowA])
      expect(component.isEditing).toBe(true)

      component.onSelectionChange([] as any)
      expect(component.editRows).toEqual([])
      expect(component.isEditing).toBe(false)
    })
  })

  describe('onEditClicked', () => {
    it('should ignore when nothing is selected', () => {
      component.selectedRows = []
      component.onEditClicked()
      expect(component.isEditing).toBe(false)
    })

    it('should enable edit mode for selected rows', () => {
      component.selectedRows = [{ code: 'A' }] as any
      component.onEditClicked()
      expect(component.isEditing).toBe(true)
      expect(component.editRows).toEqual([{ code: 'A' }])
    })
  })

  describe('onSaveClicked', () => {
    beforeEach(() => {
      component.originalRowData = [{ code: 'A', name: 'Old' }] as any
      component.tableConfig = { columns: [], data: [{ code: 'A', name: 'New' }] } as any
      (component as any).editTracker.captureBaseline([{ code: 'A', name: 'Old' }] as any)
      component.editRows = [{ code: 'A', name: 'New' }] as any
      component.selectedRows = [{ code: 'A', name: 'New' }] as any
    })

    it('should ignore save when there are no rows to update', () => {
      component.editRows = []
      component.selectedRows = []
      component.onSaveClicked()
      expect(mockFracApiService.updateEntity).not.toHaveBeenCalled()
    })

    it('should ignore save when already updating', () => {
      component.isUpdating = true
      component.onSaveClicked()
      expect(mockFracApiService.updateEntity).not.toHaveBeenCalled()
    })

    it('should ignore save when no changes are detected', () => {
      component.editRows = [{ code: 'A', name: 'Old' }] as any
      component.selectedRows = [{ code: 'A', name: 'Old' }] as any
      component.onSaveClicked()
      expect(mockFracApiService.updateEntity).not.toHaveBeenCalled()
    })

    it('should call updateEntity and show success modal on success', () => {
      mockFracApiService.updateEntity.mockReturnValue(of({}) as any)

      component.onSaveClicked()

      expect(mockFracApiService.updateEntity).toHaveBeenCalled()
      expect(component.isUpdating).toBe(false)
      expect(component.isEditing).toBe(false)
      expect(component.editRows).toEqual([])
      expect(component.selectedRows).toEqual([])
      expect(mockMatDialog.open).toHaveBeenCalledWith(
        UploadResultModalComponent,
        expect.any(Object),
      )
    })

    it('should show error modal on update failure', () => {
      mockFracApiService.updateEntity.mockReturnValue(throwError(() => ({ status: 500, message: 'fail' })))

      component.onSaveClicked()

      expect(component.isUpdating).toBe(false)
      expect(mockMatDialog.open).toHaveBeenCalledWith(
        UploadResultModalComponent,
        expect.any(Object),
      )
    })
  })

  describe('onRemoveClicked', () => {
    it('should ignore remove when nothing is selected', () => {
      component.selectedRows = []
      component.onRemoveClicked()
      expect(mockMatDialog.open).not.toHaveBeenCalled()
    })

    it('should ignore remove when already deleting', () => {
      component.selectedRows = [{ code: 'A' }] as any
      component.isDeleting = true
      component.onRemoveClicked()
      expect(mockMatDialog.open).not.toHaveBeenCalled()
    })

    it('should open confirmation dialog and do nothing when cancelled', () => {
      component.selectedRows = [{ code: 'A' }] as any
      mockMatDialog.open.mockReturnValue({ afterClosed: () => of('cancel') } as any)

      component.onRemoveClicked()

      expect(mockMatDialog.open).toHaveBeenCalledWith(
        UnsavedChangesModalComponent,
        expect.objectContaining({ disableClose: true }),
      )
      expect(mockFracApiService.deleteEntity).not.toHaveBeenCalled()
    })

    it('should delete entities and show success modal, refreshing the table on close', () => {
      component.selectedRows = [{ code: 'A' }] as any
      component.tableConfig = { columns: [], data: [{ code: 'A' }, { code: 'B' }] } as any
      component.originalRowData = [{ code: 'A' }, { code: 'B' }] as any
      // Confirmation dialog resolves with 'continue'; the subsequent result modal's
      // afterClosed also resolves (any value), which triggers a table refresh search.
      mockMatDialog.open.mockReturnValue({ afterClosed: () => of('continue') } as any)
      mockFracApiService.deleteEntity.mockReturnValue(of({}) as any)

      component.onRemoveClicked()

      expect(mockFracApiService.deleteEntity).toHaveBeenCalled()
      expect(component.isDeleting).toBe(false)
      expect(component.selectedRows).toEqual([])
      expect(component.isEditing).toBe(false)
      expect(mockMatDialog.open).toHaveBeenCalledWith(
        UploadResultModalComponent,
        expect.any(Object),
      )
      // showResultModal has refreshOnClose=true for deletes, so closing it re-searches.
      expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('competency', '', 'en')
    })

    it('should show error modal on delete failure', () => {
      component.selectedRows = [{ code: 'A' }] as any
      mockMatDialog.open.mockReturnValue({ afterClosed: () => of('continue') } as any)
      mockFracApiService.deleteEntity.mockReturnValue(throwError(() => ({ status: 400, message: 'nope' })))

      component.onRemoveClicked()

      expect(component.isDeleting).toBe(false)
      expect(mockMatDialog.open).toHaveBeenCalledWith(
        UploadResultModalComponent,
        expect.any(Object),
      )
    })
  })

  describe('onDownloadTemplate', () => {
    it('should trigger a template download without throwing', () => {
      const clickSpy = jest.fn()
      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue({ click: clickSpy } as any)

      expect(() => component.onDownloadTemplate()).not.toThrow()
      expect(clickSpy).toHaveBeenCalled()

      createElementSpy.mockRestore()
    })
  })

  describe('uploadFile', () => {
    it('should ignore upload when already uploading', () => {
      component.isUploading = true
      component.uploadFile(new File(['a'], 'a.csv'))
      expect(mockFracApiService.uploadFile).not.toHaveBeenCalled()
    })

    it('should redirect to manage page after successful upload', async () => {
      mockFracApiService.uploadFile.mockReturnValue(of({
        responseCode: 'OK',
        result: {
          entity: [{ entityType: 'competency', entityCode: ['C_01'] }],
          count: 1,
        },
      }) as any)

      component.uploadFile(new File(['a'], 'competency.csv'), 'en')
      await Promise.resolve()
      await Promise.resolve()

      expect(mockMatDialog.open).toHaveBeenCalledWith(
        UploadResultModalComponent,
        expect.any(Object),
      )
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(FRAC_ROUTES.competencyManage)
    })

    it('should show failure modal when upload API returns a failure payload', async () => {
      mockFracApiService.uploadFile.mockReturnValue(of({
        responseCode: 'CLIENT_ERROR',
        params: { errmsg: 'invalid file' },
        result: {},
      }) as any)

      component.uploadFile(new File(['a'], 'bad.csv'), 'en')
      await Promise.resolve()
      await Promise.resolve()

      expect(component.isUploading).toBe(false)
      expect(mockMatDialog.open).toHaveBeenCalledWith(
        UploadResultModalComponent,
        expect.any(Object),
      )
    })

    it('should handle upload error and show error modal', async () => {
      mockFracApiService.uploadFile.mockReturnValue(throwError(() => ({ status: 500, message: 'server error' })))

      component.uploadFile(new File(['a'], 'err.csv'), 'en')
      await Promise.resolve()
      await Promise.resolve()

      expect(component.isUploading).toBe(false)
      expect(mockMatDialog.open).toHaveBeenCalledWith(
        UploadResultModalComponent,
        expect.any(Object),
      )
    })
  })

  describe('onHomeClick', () => {
    it('should navigate home directly when there are no pending changes', () => {
      jest.spyOn(component, 'hasPendingTableChanges').mockReturnValue(false)
      component.onHomeClick()
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(FRAC_ROUTES.homeDashboard)
    })

    it('should do nothing while updating', () => {
      component.isUpdating = true
      component.onHomeClick()
      expect(mockMatDialog.open).not.toHaveBeenCalled()
      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled()
    })

    it('should open unsaved changes modal before leaving home and navigate on continue', () => {
      jest.spyOn(component, 'hasPendingTableChanges').mockReturnValue(true)
      mockMatDialog.open.mockReturnValue({ afterClosed: () => of('continue') } as any)

      component.onHomeClick()

      expect(mockMatDialog.open).toHaveBeenCalledWith(
        UnsavedChangesModalComponent,
        expect.objectContaining({ disableClose: true }),
      )
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(FRAC_ROUTES.homeDashboard)
    })

    it('should not navigate when unsaved changes modal is cancelled', () => {
      jest.spyOn(component, 'hasPendingTableChanges').mockReturnValue(true)
      mockMatDialog.open.mockReturnValue({ afterClosed: () => of('cancel') } as any)

      component.onHomeClick()

      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled()
    })
  })

  describe('state helpers', () => {
    it('hasTableData should reflect table contents', () => {
      component.tableConfig = { columns: [], data: [] } as any
      expect(component.hasTableData()).toBeFalsy()

      component.tableConfig = { columns: [], data: [{ code: 'A' }] } as any
      expect(component.hasTableData()).toBeTruthy()
    })

    it('isFilterControlsDisabled should be true while uploading or in upload mode', () => {
      component.isUploading = false
      component.routeMode = 'manage'
      expect(component.isFilterControlsDisabled()).toBe(false)

      component.routeMode = 'upload'
      expect(component.isFilterControlsDisabled()).toBe(true)

      component.routeMode = 'manage'
      component.isUploading = true
      expect(component.isFilterControlsDisabled()).toBe(true)
    })

    it('isLanguageDropdownDisabled should reflect upload state', () => {
      component.isUploading = false
      expect(component.isLanguageDropdownDisabled()).toBe(false)
      component.isUploading = true
      expect(component.isLanguageDropdownDisabled()).toBe(true)
    })

    it('activeEmptyStateConfig should switch based on route mode', () => {
      component.routeMode = 'manage'
      expect(component.activeEmptyStateConfig).toBe(component.noResultEmptyStateConfig)
      component.routeMode = 'upload'
      expect(component.activeEmptyStateConfig).toBe(component.uploadEmptyStateConfig)
    })

    it('shouldShowTableEmptyState should be false while uploading/searching or when data exists', () => {
      component.routeMode = 'manage'
      component.isUploading = true
      expect(component.shouldShowTableEmptyState()).toBe(false)

      component.isUploading = false
      component.isSearching = true
      expect(component.shouldShowTableEmptyState()).toBe(false)

      component.isSearching = false
      component.tableConfig = { columns: [], data: [{ code: 'A' }] } as any
      expect(component.shouldShowTableEmptyState()).toBe(false)

      component.tableConfig = { columns: [], data: [] } as any
      expect(component.shouldShowTableEmptyState()).toBe(true)
    })

    it('hasPendingTableChanges should delegate to editTracker', () => {
      component.tableConfig = { columns: [], data: [{ code: 'A', name: 'X' }] } as any
      (component as any).editTracker.captureBaseline([{ code: 'A', name: 'X' }] as any)
      expect(component.hasPendingTableChanges()).toBe(false)

      component.tableConfig = { columns: [], data: [{ code: 'A', name: 'Changed' }] } as any
      expect(component.hasPendingTableChanges()).toBe(true)
    })
  })

  describe('ngOnDestroy', () => {
    it('should unsubscribe search subscription and complete destroy subject', () => {
      const destroySpy = jest.spyOn((component as any).destroy$, 'complete')
      component.ngOnDestroy()
      expect(destroySpy).toHaveBeenCalled()
    })
  })
})
