import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute, Router } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { BehaviorSubject, Subject, of, throwError } from 'rxjs'
import { ActivityUploadComponent } from './activity-upload.component'
import { FracApiService } from '../../../services/frac-api.service'
import { FracEntityUploadOrchestratorService } from '../../../services/frac-entity-upload-orchestrator.service'
import { TableTransformUtil } from '../../../utils/table-transform.util'
import { FRAC_ROUTES } from '../../../constants/frac.constants'
import { UploadResultModalComponent } from '../../../components/upload-result-modal/upload-result-modal.component'
import { UnsavedChangesModalComponent } from '../../../components/unsaved-changes-modal/unsaved-changes-modal.component'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('ActivityUploadComponent', () => {
  let component: ActivityUploadComponent
  let fixture: ComponentFixture<ActivityUploadComponent>
  let queryParams$: BehaviorSubject<Record<string, string>>
  let mockMatDialog: jest.Mocked<MatDialog>
  let mockFracApiService: jest.Mocked<FracApiService>
  let mockTableTransformUtil: jest.Mocked<TableTransformUtil>
  let mockRouter: jest.Mocked<Router>

  beforeEach(async () => {
    queryParams$ = new BehaviorSubject<Record<string, string>>({ mode: 'upload' })
    mockMatDialog = createSpyObj('MatDialog', ['open'])
    mockFracApiService = createSpyObj('FracApiService', ['searchEntities', 'uploadFile', 'updateEntity', 'deleteEntity'])
    mockTableTransformUtil = createSpyObj('TableTransformUtil', ['transformResponseToTableConfig'])
    mockRouter = createSpyObj('Router', ['navigateByUrl'])

    mockFracApiService.searchEntities.mockReturnValue(of({ result: { entity: [] } }) as any)
    mockTableTransformUtil.transformResponseToTableConfig.mockReturnValue({ columns: [], data: [] } as any)
    mockMatDialog.open.mockReturnValue({ afterClosed: () => of(undefined) } as any)

    await TestBed.configureTestingModule({
      declarations: [ActivityUploadComponent],
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

    fixture = TestBed.createComponent(ActivityUploadComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should set button text for route mode', () => {
    component.routeMode = 'upload'
    component.updateButtonText()
    expect(component.uploadButtonText).toBe('Upload File')

    component.routeMode = 'manage'
    component.updateButtonText()
    expect(component.uploadButtonText).toBe('Change File')
  })

  it('should trigger initial search in manage mode from query params', () => {
    queryParams$.next({ mode: 'manage' })
    expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('activity', '', 'en')
  })

  it('should debounce typing search and run immediate enter search', fakeAsync(() => {
    component.routeMode = 'manage'
    component.searchTerm = 'Act'

    component.onSearchTermChange()
    tick(499)
    expect(mockFracApiService.searchEntities).not.toHaveBeenCalledWith('activity', 'Act', 'en')

    tick(1)
    expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('activity', 'Act', 'en')

    component.searchTerm = 'Act now'
    component.onSearchEnter()
    expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('activity', 'Act now', 'en')
  }))

  it('should open unsaved changes modal before leaving home', () => {
    jest.spyOn(component, 'hasPendingTableChanges').mockReturnValue(true)

    component.onHomeClick()

    expect(mockMatDialog.open).toHaveBeenCalledWith(
      UnsavedChangesModalComponent,
      expect.objectContaining({ disableClose: true }),
    )
  })

  it('should redirect to manage page after successful upload modal close', async () => {
    mockFracApiService.uploadFile.mockReturnValue(of({
      responseCode: 'OK',
      result: {
        entity: [{ entityType: 'activity', entityCode: ['ACT_01'] }],
        count: 1,
      },
    }) as any)
    mockMatDialog.open.mockReturnValue({ afterClosed: () => of(undefined) } as any)

    component.uploadFile(new File(['a'], 'activity.csv'), 'en')
    // The component's subscribe `next` handler is a real async function that
    // awaits FracResponseParserUtil.resolveApiPayload(); Zone's fakeAsync/tick
    // doesn't reliably resume native async/await continuations, so this test
    // uses a real awaited microtask flush instead.
    await Promise.resolve()
    await Promise.resolve()

    expect(mockMatDialog.open).toHaveBeenCalledWith(
      UploadResultModalComponent,
      expect.any(Object),
    )
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(FRAC_ROUTES.activityManage)
  })

  it('should show a failure modal when the upload response is not successful', async () => {
    mockFracApiService.uploadFile.mockReturnValue(of({
      responseCode: 'CLIENT_ERROR',
      result: {},
    }) as any)
    mockMatDialog.open.mockReturnValue({ afterClosed: () => of(undefined) } as any)

    component.uploadFile(new File(['a'], 'activity.csv'), 'en')
    await Promise.resolve()
    await Promise.resolve()

    expect(mockMatDialog.open).toHaveBeenCalledWith(UploadResultModalComponent, expect.any(Object))
    expect(mockRouter.navigateByUrl).not.toHaveBeenCalledWith(FRAC_ROUTES.activityManage)
  })

  it('should ignore a second uploadFile call while one is already in progress', () => {
    // A Subject that never emits keeps the component's isUploading guard true,
    // unlike of(...) which resolves synchronously and flips it back before the
    // second call below.
    mockFracApiService.uploadFile.mockReturnValue(new Subject<any>().asObservable())
    component.uploadFile(new File(['a'], 'a.csv'), 'en')
    mockFracApiService.uploadFile.mockClear()
    component.uploadFile(new File(['b'], 'b.csv'), 'en')
    expect(mockFracApiService.uploadFile).not.toHaveBeenCalled()
  })

  it('should show an error modal when the upload request itself errors', async () => {
    mockFracApiService.uploadFile.mockReturnValue(throwError({ status: 500, message: 'boom' }) as any)
    mockMatDialog.open.mockReturnValue({ afterClosed: () => of(undefined) } as any)

    component.uploadFile(new File(['a'], 'activity.csv'), 'en')
    await Promise.resolve()
    await Promise.resolve()

    expect(component.isUploading).toBe(false)
    expect(mockMatDialog.open).toHaveBeenCalledWith(UploadResultModalComponent, expect.any(Object))
  })

  describe('hasTableData / hasPendingTableChanges', () => {
    it('should reflect whether the table has rows', () => {
      component.tableConfig = { data: [{ a: 1 }] } as any
      expect(component.hasTableData()).toBe(true)
      component.tableConfig = { data: [] } as any
      expect(component.hasTableData()).toBe(false)
    })
  })

  describe('onSearch / onSearchEnter when filters are disabled', () => {
    it('should not search when isFilterControlsDisabled is true', () => {
      component.isUploading = true
      mockFracApiService.searchEntities.mockClear()
      component.onSearch()
      component.onSearchEnter()
      component.onSearchTermChange()
      expect(mockFracApiService.searchEntities).not.toHaveBeenCalled()
    })
  })

  describe('fetchEntitiesForTable error path', () => {
    it('should stop the searching spinner when the search API errors', () => {
      mockFracApiService.searchEntities.mockReturnValue(throwError({ message: 'fail' }) as any)
      component.routeMode = 'manage'
      component.onSearchEnter()
      expect(component.isSearching).toBe(false)
    })
  })

  describe('toggleDropdown / selectLanguage', () => {
    it('should not open the dropdown when disabled', () => {
      component.isUploading = true
      component.isOpen = true
      component.toggleDropdown()
      expect(component.isOpen).toBe(false)
    })

    it('should toggle the dropdown open when enabled', () => {
      component.isUploading = false
      component.isOpen = false
      component.toggleDropdown()
      expect(component.isOpen).toBe(true)
    })

    it('should stop propagation and do nothing when the language dropdown is disabled', () => {
      component.isUploading = true
      const event = { stopPropagation: jest.fn() } as unknown as MouseEvent
      component.selectLanguage({ key: 'hi' }, event)
      expect(event.stopPropagation).toHaveBeenCalled()
      expect(component.selectedLanguage).not.toBe('hi')
    })

    it('should select the language and re-search when in manage mode', () => {
      component.isUploading = false
      component.routeMode = 'manage'
      mockFracApiService.searchEntities.mockClear()
      const event = { stopPropagation: jest.fn() } as unknown as MouseEvent
      component.selectLanguage({ key: 'hi' }, event)
      expect(component.selectedLanguage).toBe('hi')
      expect(component.isOpen).toBe(false)
    })

    it('should select the language without searching in upload mode', () => {
      component.isUploading = false
      component.routeMode = 'upload'
      mockFracApiService.searchEntities.mockClear()
      const event = { stopPropagation: jest.fn() } as unknown as MouseEvent
      component.selectLanguage({ key: 'hi' }, event)
      expect(component.selectedLanguage).toBe('hi')
    })
  })

  it('onSelectionChange should set selectedRows', () => {
    component.onSelectionChange([{ code: 'A1' } as any])
    expect(component.selectedRows).toEqual([{ code: 'A1' }])
  })

  describe('onEditClicked', () => {
    it('should warn and do nothing when nothing is selected', () => {
      component.selectedRows = []
      component.onEditClicked()
      expect(component.isEditing).toBe(false)
    })

    it('should enter edit mode when rows are selected', () => {
      component.selectedRows = [{ code: 'A1' } as any]
      component.onEditClicked()
      expect(component.isEditing).toBe(true)
    })
  })

  describe('onSaveClicked', () => {
    it('should do nothing when nothing is selected', () => {
      component.selectedRows = []
      component.onSaveClicked()
      expect(mockFracApiService.updateEntity).not.toHaveBeenCalled()
    })

    it('should do nothing while already updating', () => {
      component.selectedRows = [{ code: 'A1' } as any]
      ;(component as any).isUpdating = true
      component.onSaveClicked()
      expect(mockFracApiService.updateEntity).not.toHaveBeenCalled()
    })

    it('should do nothing when the edit tracker reports no changed rows', () => {
      const row = { code: 'A1', name: 'x' } as any
      component.tableConfig = { data: [row] } as any
      component.originalRowData = [row]
      ;(component as any).editTracker.captureBaseline(component.tableConfig.data)
      component.selectedRows = [{ ...row }]
      component.onSaveClicked()
      expect(mockFracApiService.updateEntity).not.toHaveBeenCalled()
    })

    it('should submit changed rows and show a success modal', () => {
      component.tableConfig = { data: [{ code: 'A1', name: 'y' }] } as any
      component.selectedRows = [{ code: 'A1', name: 'y' } as any]
      component.originalRowData = [{ code: 'A1', name: 'x' } as any]
      mockFracApiService.updateEntity.mockReturnValue(of({}) as any)
      mockMatDialog.open.mockReturnValue({ afterClosed: () => of(undefined) } as any)

      component.onSaveClicked()

      expect(mockFracApiService.updateEntity).toHaveBeenCalled()
      expect(component.isUpdating).toBe(false)
      expect(component.isEditing).toBe(false)
      expect(mockMatDialog.open).toHaveBeenCalledWith(UploadResultModalComponent, expect.any(Object))
    })

    it('should show a failure modal when the update API errors', () => {
      component.tableConfig = { data: [{ code: 'A1', name: 'y' }] } as any
      component.selectedRows = [{ code: 'A1', name: 'y' } as any]
      component.originalRowData = [{ code: 'A1', name: 'x' } as any]
      mockFracApiService.updateEntity.mockReturnValue(throwError({ status: 500, message: 'boom' }) as any)
      mockMatDialog.open.mockReturnValue({ afterClosed: () => of(undefined) } as any)

      component.onSaveClicked()

      expect(component.isUpdating).toBe(false)
      expect(mockMatDialog.open).toHaveBeenCalledWith(UploadResultModalComponent, expect.any(Object))
    })
  })

  describe('onRemoveClicked', () => {
    it('should warn and do nothing when nothing is selected', () => {
      component.selectedRows = []
      component.onRemoveClicked()
      expect(mockMatDialog.open).not.toHaveBeenCalledWith(UnsavedChangesModalComponent, expect.any(Object))
    })

    it('should do nothing while already deleting', () => {
      component.selectedRows = [{ code: 'A1' } as any]
      ;(component as any).isDeleting = true
      component.onRemoveClicked()
      expect(mockMatDialog.open).not.toHaveBeenCalledWith(UnsavedChangesModalComponent, expect.any(Object))
    })

    it('should do nothing when the confirmation dialog is cancelled', () => {
      component.selectedRows = [{ code: 'A1' } as any]
      mockMatDialog.open.mockReturnValue({ afterClosed: () => of('cancel') } as any)
      component.onRemoveClicked()
      expect(mockFracApiService.deleteEntity).not.toHaveBeenCalled()
    })

    it('should delete the selected rows and show a success modal on confirm', () => {
      component.tableConfig = { data: [{ code: 'A1' }, { code: 'A2' }] } as any
      component.originalRowData = [{ code: 'A1' }, { code: 'A2' }] as any
      component.selectedRows = [{ code: 'A1' } as any]
      mockMatDialog.open
        .mockReturnValueOnce({ afterClosed: () => of('continue') } as any)
        .mockReturnValueOnce({ afterClosed: () => of(undefined) } as any)
      mockFracApiService.deleteEntity.mockReturnValue(of({}) as any)

      component.onRemoveClicked()

      expect(mockFracApiService.deleteEntity).toHaveBeenCalled()
      expect(component.isDeleting).toBe(false)
      expect(component.selectedRows).toEqual([])
      expect(mockMatDialog.open).toHaveBeenCalledWith(UploadResultModalComponent, expect.any(Object))
    })

    it('should show a failure modal when the delete API errors', () => {
      component.tableConfig = { data: [{ code: 'A1' }] } as any
      component.originalRowData = [{ code: 'A1' }] as any
      component.selectedRows = [{ code: 'A1' } as any]
      mockMatDialog.open
        .mockReturnValueOnce({ afterClosed: () => of('continue') } as any)
        .mockReturnValueOnce({ afterClosed: () => of(undefined) } as any)
      mockFracApiService.deleteEntity.mockReturnValue(throwError({ status: 500, message: 'boom' }) as any)

      component.onRemoveClicked()

      expect(component.isDeleting).toBe(false)
      expect(mockMatDialog.open).toHaveBeenCalledWith(UploadResultModalComponent, expect.any(Object))
    })
  })

  it('onDownloadTemplate should create and click a download link', () => {
    const clickSpy = jest.fn()
    const anchor = { click: clickSpy, href: '', download: '' } as unknown as HTMLAnchorElement
    jest.spyOn(document, 'createElement').mockReturnValue(anchor)
    component.selectedLanguage = 'en'

    component.onDownloadTemplate()

    expect(clickSpy).toHaveBeenCalled()
    ;(document.createElement as jest.Mock).mockRestore()
  })

  describe('openUploadPopup', () => {
    it('should upload the file returned by the popup', () => {
      const file = new File(['a'], 'a.csv')
      mockMatDialog.open.mockReturnValue({ afterClosed: () => of({ action: 'upload', file, language: 'en' }) } as any)
      const uploadSpy = jest.spyOn(component, 'uploadFile').mockImplementation()

      component.openUploadPopup()

      expect(uploadSpy).toHaveBeenCalledWith(file, 'en')
    })

    it('should not upload when the popup is dismissed without a file', () => {
      mockMatDialog.open.mockReturnValue({ afterClosed: () => of(undefined) } as any)
      const uploadSpy = jest.spyOn(component, 'uploadFile').mockImplementation()

      component.openUploadPopup()

      expect(uploadSpy).not.toHaveBeenCalled()
    })
  })

  describe('onHomeClick', () => {
    it('should do nothing while updating', () => {
      ;(component as any).isUpdating = true
      component.onHomeClick()
      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled()
    })

    it('should navigate home directly when there are no pending changes', () => {
      jest.spyOn(component, 'hasPendingTableChanges').mockReturnValue(false)
      component.onHomeClick()
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(FRAC_ROUTES.homeDashboard)
    })

    it('should navigate home after confirming when there are pending changes', () => {
      jest.spyOn(component, 'hasPendingTableChanges').mockReturnValue(true)
      mockMatDialog.open.mockReturnValue({ afterClosed: () => of('continue') } as any)
      component.onHomeClick()
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(FRAC_ROUTES.homeDashboard)
    })

    it('should not navigate home when the leave confirmation is cancelled', () => {
      jest.spyOn(component, 'hasPendingTableChanges').mockReturnValue(true)
      mockMatDialog.open.mockReturnValue({ afterClosed: () => of('cancel') } as any)
      mockRouter.navigateByUrl.mockClear()
      component.onHomeClick()
      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled()
    })
  })

  describe('isFilterControlsDisabled / isLanguageDropdownDisabled', () => {
    it('should disable filters while uploading or in upload mode', () => {
      component.isUploading = true
      component.routeMode = 'manage'
      expect(component.isFilterControlsDisabled()).toBe(true)

      component.isUploading = false
      component.routeMode = 'upload'
      expect(component.isFilterControlsDisabled()).toBe(true)

      component.routeMode = 'manage'
      expect(component.isFilterControlsDisabled()).toBe(false)
    })

    it('should disable the language dropdown only while uploading', () => {
      component.isUploading = true
      expect(component.isLanguageDropdownDisabled()).toBe(true)
      component.isUploading = false
      expect(component.isLanguageDropdownDisabled()).toBe(false)
    })
  })

  describe('activeEmptyStateConfig / shouldShowTableEmptyState', () => {
    it('should pick the empty-state config based on route mode', () => {
      component.routeMode = 'manage'
      expect(component.activeEmptyStateConfig).toBe((component as any).noResultEmptyStateConfig)
      component.routeMode = 'upload'
      expect(component.activeEmptyStateConfig).toBe((component as any).uploadEmptyStateConfig)
    })

    it('should hide the empty state while uploading, searching, or when data exists', () => {
      component.isUploading = true
      expect(component.shouldShowTableEmptyState()).toBe(false)
      component.isUploading = false
      component.isSearching = true
      expect(component.shouldShowTableEmptyState()).toBe(false)
      component.isSearching = false
      component.tableConfig = { data: [{ a: 1 }] } as any
      expect(component.shouldShowTableEmptyState()).toBe(false)
    })

    it('should show the empty state in upload or manage mode once loading settles with no data', () => {
      component.isUploading = false
      component.isSearching = false
      component.tableConfig = { data: [] } as any
      component.routeMode = 'upload'
      expect(component.shouldShowTableEmptyState()).toBe(true)
      component.routeMode = 'manage'
      expect(component.shouldShowTableEmptyState()).toBe(true)
    })
  })
})
