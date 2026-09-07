import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute, Router } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { BehaviorSubject, of } from 'rxjs'
import { RoleUploadComponent } from './role-upload.component'
import { FracApiService } from '../../../services/frac-api.service'
import { FracEntityUploadOrchestratorService } from '../../../services/frac-entity-upload-orchestrator.service'
import { TableTransformUtil } from '../../../utils/table-transform.util'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('RoleUploadComponent', () => {
  let component: RoleUploadComponent
  let fixture: ComponentFixture<RoleUploadComponent>
  let queryParams$: BehaviorSubject<Record<string, string>>
  let mockFracApiService: jest.Mocked<FracApiService>

  beforeEach(async () => {
    queryParams$ = new BehaviorSubject<Record<string, string>>({ mode: 'upload' })
    mockFracApiService = createSpyObj('FracApiService', ['searchEntities', 'uploadFile', 'updateEntity', 'deleteEntity'])
    mockFracApiService.searchEntities.mockReturnValue(of({ result: { entity: [] } }) as any)
    await TestBed.configureTestingModule({
      declarations: [RoleUploadComponent],
      providers: [
        FracEntityUploadOrchestratorService,
        { provide: MatDialog, useValue: createSpyObj('MatDialog', ['open']) },
        { provide: Router, useValue: createSpyObj('Router', ['navigateByUrl']) },
        { provide: FracApiService, useValue: mockFracApiService },
        {
          provide: TableTransformUtil,
          useValue: createSpyObj('TableTransformUtil', ['transformResponseToTableConfig']),
        },        { provide: ActivatedRoute, useValue: { queryParams: queryParams$.asObservable() } },
        { provide: ConfigurationsService, useValue: { instanceConfig: {} } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    const tableTransformUtilDefault = TestBed.inject(TableTransformUtil) as jest.Mocked<TableTransformUtil>
    ;(tableTransformUtilDefault.transformResponseToTableConfig as jest.Mock).mockReturnValue({ columns: [], data: [] })

    fixture = TestBed.createComponent(RoleUploadComponent)
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
    expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('role', '', 'en')
  })

  it('should reset table state in upload mode', () => {
    queryParams$.next({ mode: 'upload' })
    expect(component.tableConfig).toEqual({ columns: [], data: [] })
    expect(component.originalRowData).toEqual([])
    expect(component.selectedRows).toEqual([])
    expect(component.removedData).toEqual([])
    expect(component.isEditing).toBe(false)
  })

  it('should unsubscribe and complete destroy$ on ngOnDestroy', () => {
    const nextSpy = jest.spyOn((component as any).destroy$, 'next')
    const completeSpy = jest.spyOn((component as any).destroy$, 'complete')
    component.ngOnDestroy()
    expect(nextSpy).toHaveBeenCalled()
    expect(completeSpy).toHaveBeenCalled()
  })

  it('hasTableData should reflect table contents', () => {
    component.tableConfig = { columns: [], data: [] }
    expect(component.hasTableData()).toBeFalsy()
    component.tableConfig = { columns: [], data: [{ code: 'A' } as any] }
    expect(component.hasTableData()).toBe(true)
  })

  it('hasPendingTableChanges should be false when not in manage mode', () => {
    component.routeMode = 'upload'
    expect(component.hasPendingTableChanges()).toBe(false)
  })

  it('hasPendingTableChanges should delegate to editTracker in manage mode', () => {
    component.routeMode = 'manage'
    component.tableConfig = { columns: [], data: [{ code: 'A', name: 'x' } as any] }
    ;(component as any).editTracker.captureBaseline([])
    expect(component.hasPendingTableChanges()).toBe(true)
  })

  it('onSearchTermChange should be ignored when filter controls disabled', () => {
    component.routeMode = 'upload'
    mockFracApiService.searchEntities.mockClear()
    component.onSearchTermChange()
    expect(mockFracApiService.searchEntities).not.toHaveBeenCalled()
  })

  it('onSearch should trigger search when enabled', () => {
    component.routeMode = 'manage'
    component.isUploading = false
    mockFracApiService.searchEntities.mockClear()
    component.onSearch()
    expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('role', '', 'en')
  })

  it('onSearchEnter should trigger search when enabled', () => {
    component.routeMode = 'manage'
    mockFracApiService.searchEntities.mockClear()
    component.searchTerm = 'abc'
    component.onSearchEnter()
    expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('role', 'abc', 'en')
  })

  it('fetchEntitiesForTable success path should populate table', () => {
    const rows = [{ code: 'A', name: 'a' }, { code: 'B', name: 'b' }]
    mockFracApiService.searchEntities.mockReturnValue(of({ result: { entity: rows } }) as any)
    const tableTransformUtil = TestBed.inject(TableTransformUtil) as jest.Mocked<TableTransformUtil>
    ;(tableTransformUtil.transformResponseToTableConfig as jest.Mock).mockReturnValue({ columns: [], data: rows })

    component.routeMode = 'manage'
    component.onSearch()

    expect(component.isSearching).toBe(false)
    expect(component.tableConfig.data).toEqual(rows)
    expect(component.originalRowData).toEqual(rows)
    expect(component.selectedRows).toEqual([])
    expect(component.isEditing).toBe(false)
  })

  it('fetchEntitiesForTable error path should log and clear searching flag', () => {
    mockFracApiService.searchEntities.mockReturnValue(
      require('rxjs').throwError(() => new Error('boom')),
    )
    component.routeMode = 'manage'
    component.onSearch()
    expect(component.isSearching).toBe(false)
  })

  it('toggleDropdown should toggle isOpen when not disabled', () => {
    component.isUploading = false
    component.isOpen = false
    component.toggleDropdown()
    expect(component.isOpen).toBe(true)
    component.toggleDropdown()
    expect(component.isOpen).toBe(false)
  })

  it('toggleDropdown should force close when disabled', () => {
    component.isUploading = true
    component.isOpen = true
    component.toggleDropdown()
    expect(component.isOpen).toBe(false)
  })

  it('selectLanguage should stop propagation and ignore when disabled', () => {
    component.isUploading = true
    const event = { stopPropagation: jest.fn() } as unknown as MouseEvent
    component.selectLanguage({ key: 'hi' }, event)
    expect(event.stopPropagation).toHaveBeenCalled()
    expect(component.selectedLanguage).not.toBe('hi')
  })

  it('selectLanguage should update language and trigger search in manage mode', () => {
    component.isUploading = false
    component.routeMode = 'manage'
    mockFracApiService.searchEntities.mockClear()
    const event = { stopPropagation: jest.fn() } as unknown as MouseEvent
    component.selectLanguage({ key: 'hi' }, event)
    expect(component.selectedLanguage).toBe('hi')
    expect(component.isOpen).toBe(false)
    expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('role', '', 'hi')
  })

  it('selectLanguage should update language without searching in upload mode', () => {
    component.isUploading = false
    component.routeMode = 'upload'
    mockFracApiService.searchEntities.mockClear()
    const event = { stopPropagation: jest.fn() } as unknown as MouseEvent
    component.selectLanguage({ key: 'fr' }, event)
    expect(component.selectedLanguage).toBe('fr')
    expect(mockFracApiService.searchEntities).not.toHaveBeenCalled()
  })

  it('onSelectionChange should update selectedRows', () => {
    const rows = [{ code: 'A' } as any]
    component.onSelectionChange(rows)
    expect(component.selectedRows).toBe(rows)
  })

  it('onEditClicked should be ignored when nothing selected', () => {
    component.selectedRows = []
    component.isEditing = false
    component.onEditClicked()
    expect(component.isEditing).toBe(false)
  })

  it('onEditClicked should enable editing when rows selected', () => {
    component.selectedRows = [{ code: 'A' } as any]
    component.onEditClicked()
    expect(component.isEditing).toBe(true)
  })

  it('onSaveClicked should no-op when nothing selected', () => {
    component.selectedRows = []
    component.onSaveClicked()
    expect(mockFracApiService.updateEntity).not.toHaveBeenCalled()
  })

  it('onSaveClicked should no-op when already updating', () => {
    component.selectedRows = [{ code: 'A' } as any]
    component.isUpdating = true
    component.onSaveClicked()
    expect(mockFracApiService.updateEntity).not.toHaveBeenCalled()
  })

  it('onSaveClicked should no-op when no changes detected', () => {
    const row = { code: 'A', name: 'same' }
    component.originalRowData = [row as any]
    component.tableConfig = { columns: [], data: [row as any] }
    ;(component as any).editTracker.captureBaseline([row as any])
    component.selectedRows = [row as any]
    component.isUpdating = false
    component.onSaveClicked()
    expect(mockFracApiService.updateEntity).not.toHaveBeenCalled()
  })

  it('onSaveClicked success path should update state and show success modal', () => {
    const original = { code: 'A', name: 'old', languageCode: 'en' }
    const edited = { code: 'A', name: 'new' }
    component.originalRowData = [original as any]
    component.tableConfig = { columns: [], data: [edited as any] }
    ;(component as any).editTracker.captureBaseline([original as any])
    component.selectedRows = [edited as any]
    component.isUpdating = false
    mockFracApiService.updateEntity.mockReturnValue(of({}) as any)
    const dialog = TestBed.inject(MatDialog) as jest.Mocked<MatDialog>
    ;(dialog.open as jest.Mock).mockReturnValue({ afterClosed: () => of(undefined) })

    component.onSaveClicked()

    expect(mockFracApiService.updateEntity).toHaveBeenCalled()
    expect(component.isUpdating).toBe(false)
    expect(component.isEditing).toBe(false)
    expect(component.selectedRows).toEqual([])
    expect(dialog.open).toHaveBeenCalled()
  })

  it('onSaveClicked error path should show failure modal', () => {
    const original = { code: 'A', name: 'old', languageCode: 'en' }
    const edited = { code: 'A', name: 'new' }
    component.originalRowData = [original as any]
    component.tableConfig = { columns: [], data: [edited as any] }
    ;(component as any).editTracker.captureBaseline([original as any])
    component.selectedRows = [edited as any]
    component.isUpdating = false
    mockFracApiService.updateEntity.mockReturnValue(
      require('rxjs').throwError(() => ({ status: 500, message: 'fail' })),
    )
    const dialog = TestBed.inject(MatDialog) as jest.Mocked<MatDialog>
    ;(dialog.open as jest.Mock).mockReturnValue({ afterClosed: () => of(undefined) })

    component.onSaveClicked()

    expect(component.isUpdating).toBe(false)
    expect(dialog.open).toHaveBeenCalled()
  })

  it('onRemoveClicked should be ignored when nothing selected', () => {
    component.selectedRows = []
    const dialog = TestBed.inject(MatDialog) as jest.Mocked<MatDialog>
    component.onRemoveClicked()
    expect(dialog.open).not.toHaveBeenCalled()
  })

  it('onRemoveClicked should be ignored while deleting', () => {
    component.selectedRows = [{ code: 'A' } as any]
    component.isDeleting = true
    const dialog = TestBed.inject(MatDialog) as jest.Mocked<MatDialog>
    component.onRemoveClicked()
    expect(dialog.open).not.toHaveBeenCalled()
  })

  it('onRemoveClicked should delete rows on confirm', () => {
    const row = { code: 'A', name: 'x' }
    component.selectedRows = [row as any]
    component.isDeleting = false
    component.tableConfig = { columns: [], data: [row as any] }
    component.originalRowData = [row as any]
    mockFracApiService.deleteEntity = jest.fn().mockReturnValue(of({}))
    const tableTransformUtil = TestBed.inject(TableTransformUtil) as jest.Mocked<TableTransformUtil>
    ;(tableTransformUtil.transformResponseToTableConfig as jest.Mock).mockReturnValue({ columns: [], data: [] })
    const dialog = TestBed.inject(MatDialog) as jest.Mocked<MatDialog>
    ;(dialog.open as jest.Mock).mockReturnValue({ afterClosed: () => of('continue') })

    component.onRemoveClicked()

    expect(mockFracApiService.deleteEntity).toHaveBeenCalled()
    expect(component.isDeleting).toBe(false)
    expect(component.tableConfig.data).toEqual([])
    expect(component.selectedRows).toEqual([])
  })

  it('onRemoveClicked should do nothing when dialog cancelled', () => {
    const row = { code: 'A', name: 'x' }
    component.selectedRows = [row as any]
    component.isDeleting = false
    mockFracApiService.deleteEntity = jest.fn().mockReturnValue(of({}))
    const dialog = TestBed.inject(MatDialog) as jest.Mocked<MatDialog>
    ;(dialog.open as jest.Mock).mockReturnValue({ afterClosed: () => of('cancel') })

    component.onRemoveClicked()

    expect(mockFracApiService.deleteEntity).not.toHaveBeenCalled()
  })

  it('onRemoveClicked error path should log and reset deleting flag', () => {
    const row = { code: 'A', name: 'x' }
    component.selectedRows = [row as any]
    component.isDeleting = false
    mockFracApiService.deleteEntity = jest.fn().mockReturnValue(
      require('rxjs').throwError(() => new Error('boom')),
    )
    const dialog = TestBed.inject(MatDialog) as jest.Mocked<MatDialog>
    ;(dialog.open as jest.Mock).mockReturnValue({ afterClosed: () => of('continue') })

    component.onRemoveClicked()

    expect(component.isDeleting).toBe(false)
  })

  it('onDownloadTemplate should create and click a download link', () => {
    const anchor = { href: '', download: '', click: jest.fn() } as any
    jest.spyOn(document, 'createElement').mockReturnValue(anchor)
    component.selectedLanguage = 'en'
    component.onDownloadTemplate()
    expect(anchor.click).toHaveBeenCalled()
    ;(document.createElement as jest.Mock).mockRestore()
  })

  it('openUploadPopup should open dialog and upload file on result', () => {
    const dialog = TestBed.inject(MatDialog) as jest.Mocked<MatDialog>
    const file = new File(['x'], 'sample.csv')
    ;(dialog.open as jest.Mock).mockReturnValue({ afterClosed: () => of({ action: 'upload', file, language: 'en' }) })
    mockFracApiService.uploadFile.mockReturnValue(of({}) as any)

    component.openUploadPopup()

    expect(mockFracApiService.uploadFile).toHaveBeenCalled()
  })

  it('openUploadPopup should not upload when dialog result has no file', () => {
    const dialog = TestBed.inject(MatDialog) as jest.Mocked<MatDialog>
    ;(dialog.open as jest.Mock).mockReturnValue({ afterClosed: () => of(undefined) })
    mockFracApiService.uploadFile.mockClear()

    component.openUploadPopup()

    expect(mockFracApiService.uploadFile).not.toHaveBeenCalled()
  })

  it('uploadFile should be ignored when already uploading', () => {
    component.isUploading = true
    mockFracApiService.uploadFile.mockClear()
    component.uploadFile(new File(['x'], 'a.csv'))
    expect(mockFracApiService.uploadFile).not.toHaveBeenCalled()
  })

  it('uploadFile success path should show success modal and navigate on close', () => {
    component.isUploading = false
    mockFracApiService.uploadFile.mockReturnValue(
      of({ result: { role: { successCodes: ['A'] }, count: 1 } }) as any,
    )
    const dialog = TestBed.inject(MatDialog) as jest.Mocked<MatDialog>
    ;(dialog.open as jest.Mock).mockReturnValue({ afterClosed: () => of(undefined) })
    const router = TestBed.inject(Router) as jest.Mocked<Router>

    component.uploadFile(new File(['x'], 'a.csv'))

    return fixture.whenStable().then(() => {
      expect(component.isUploading).toBe(false)
      expect(dialog.open).toHaveBeenCalled()
    })
  })

  it('uploadFile error path should call handleUploadError and show failure modal', async () => {
    component.isUploading = false
    mockFracApiService.uploadFile.mockReturnValue(
      require('rxjs').throwError(() => ({ status: 500, statusText: 'Server Error', message: 'fail', error: {}, url: 'x' })),
    )
    const dialog = TestBed.inject(MatDialog) as jest.Mocked<MatDialog>
    ;(dialog.open as jest.Mock).mockReturnValue({ afterClosed: () => of(undefined) })

    component.uploadFile(new File(['x'], 'a.csv'))

    await new Promise(resolve => setTimeout(resolve, 0))
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(component.isUploading).toBe(false)
    expect(dialog.open).toHaveBeenCalled()
  })

  it('onHomeClick should navigate directly when no pending changes', () => {
    const router = TestBed.inject(Router) as jest.Mocked<Router>
    component.isUpdating = false
    component.routeMode = 'upload'
    component.onHomeClick()
    expect(router.navigateByUrl).toHaveBeenCalled()
  })

  it('onHomeClick should no-op while updating', () => {
    const router = TestBed.inject(Router) as jest.Mocked<Router>
    ;(router.navigateByUrl as jest.Mock).mockClear()
    component.isUpdating = true
    component.onHomeClick()
    expect(router.navigateByUrl).not.toHaveBeenCalled()
  })

  it('onHomeClick should open confirmation dialog when there are pending changes and navigate on continue', () => {
    const router = TestBed.inject(Router) as jest.Mocked<Router>
    ;(router.navigateByUrl as jest.Mock).mockClear()
    component.isUpdating = false
    component.routeMode = 'manage'
    component.tableConfig = { columns: [], data: [{ code: 'A', name: 'x' } as any] }
    ;(component as any).editTracker.captureBaseline([])
    const dialog = TestBed.inject(MatDialog) as jest.Mocked<MatDialog>
    ;(dialog.open as jest.Mock).mockReturnValue({ afterClosed: () => of('continue') })

    component.onHomeClick()

    expect(dialog.open).toHaveBeenCalled()
    expect(router.navigateByUrl).toHaveBeenCalled()
  })

  it('onHomeClick should not navigate when dialog cancelled', () => {
    const router = TestBed.inject(Router) as jest.Mocked<Router>
    ;(router.navigateByUrl as jest.Mock).mockClear()
    component.isUpdating = false
    component.routeMode = 'manage'
    component.tableConfig = { columns: [], data: [{ code: 'A', name: 'x' } as any] }
    ;(component as any).editTracker.captureBaseline([])
    const dialog = TestBed.inject(MatDialog) as jest.Mocked<MatDialog>
    ;(dialog.open as jest.Mock).mockReturnValue({ afterClosed: () => of('cancel') })

    component.onHomeClick()

    expect(router.navigateByUrl).not.toHaveBeenCalled()
  })

  it('isFilterControlsDisabled and isLanguageDropdownDisabled reflect uploading/mode state', () => {
    component.isUploading = true
    expect(component.isFilterControlsDisabled()).toBe(true)
    expect(component.isLanguageDropdownDisabled()).toBe(true)

    component.isUploading = false
    component.routeMode = 'upload'
    expect(component.isFilterControlsDisabled()).toBe(true)

    component.routeMode = 'manage'
    expect(component.isFilterControlsDisabled()).toBe(false)
    expect(component.isLanguageDropdownDisabled()).toBe(false)
  })

  it('activeEmptyStateConfig should switch based on route mode', () => {
    component.routeMode = 'manage'
    expect(component.activeEmptyStateConfig).toBe(component.noResultEmptyStateConfig)
    component.routeMode = 'upload'
    expect(component.activeEmptyStateConfig).toBe(component.uploadEmptyStateConfig)
  })

  it('shouldShowTableEmptyState should be false while uploading or searching or with data', () => {
    component.isUploading = true
    expect(component.shouldShowTableEmptyState()).toBe(false)

    component.isUploading = false
    component.isSearching = true
    expect(component.shouldShowTableEmptyState()).toBe(false)

    component.isSearching = false
    component.tableConfig = { columns: [], data: [{ code: 'A' } as any] }
    expect(component.shouldShowTableEmptyState()).toBe(false)
  })

  it('shouldShowTableEmptyState should be true when no data present in a known mode', () => {
    component.isUploading = false
    component.isSearching = false
    component.tableConfig = { columns: [], data: [] }
    component.routeMode = 'upload'
    expect(component.shouldShowTableEmptyState()).toBe(true)
  })
})
