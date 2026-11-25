import { BehaviorSubject, of, throwError, Subject } from 'rxjs'
import { PositionUploadComponent } from './position-upload.component'
import { FracApiService } from '../../../services/frac-api.service'
import { FracEntityUploadOrchestratorService } from '../../../services/frac-entity-upload-orchestrator.service'
import { TableTransformUtil } from '../../../utils/table-transform.util'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { FRAC_ROUTES } from '../../../constants/frac.constants'

describe('PositionUploadComponent', () => {
  let component: PositionUploadComponent
  let queryParams$: BehaviorSubject<Record<string, string>>
  let mockDialog: any
  let mockFracApiService: jest.Mocked<FracApiService>
  let mockTableTransformUtil: jest.Mocked<TableTransformUtil>
  let mockActivatedRoute: any
  let mockRouter: any
  let mockOrchestrator: FracEntityUploadOrchestratorService
  let mockConfigSvc: any

  const buildComponent = () => {
    return new PositionUploadComponent(
      mockDialog,
      mockFracApiService,
      mockTableTransformUtil,
      mockActivatedRoute,
      mockRouter,
      mockOrchestrator,
    )
  }

  beforeEach(() => {
    queryParams$ = new BehaviorSubject<Record<string, string>>({ mode: 'upload' })

    mockDialog = createSpyObj('MatDialog', ['open'])
    mockDialog.open.mockReturnValue({ afterClosed: () => of(undefined) })

    mockFracApiService = createSpyObj('FracApiService', [
      'searchEntities',
      'uploadFile',
      'updateEntity',
      'deleteEntity',
      'searchEntityHierarchy',
    ])
    mockFracApiService.searchEntities.mockReturnValue(of({ result: { entity: [] } }) as any)
    mockFracApiService.searchEntityHierarchy.mockReturnValue(of({ result: [] }) as any)

    mockTableTransformUtil = createSpyObj('TableTransformUtil', ['transformResponseToTableConfig'])
    mockTableTransformUtil.transformResponseToTableConfig.mockImplementation((rows: any) => ({
      columns: [],
      data: rows || [],
    }))

    mockActivatedRoute = { queryParams: queryParams$.asObservable() }
    mockRouter = createSpyObj('Router', ['navigateByUrl', 'navigate'])

    mockConfigSvc = { instanceConfig: {} }
    mockOrchestrator = new FracEntityUploadOrchestratorService(mockConfigSvc)

    component = buildComponent()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit / route mode resolution', () => {
    it('resolves upload mode from query params and skips search', () => {
      queryParams$.next({ mode: 'upload' })
      component.ngOnInit()
      expect(component.routeMode).toBe('upload')
      expect(component.tableConfig).toEqual({ columns: [], data: [] })
    })

    it('resolves manage mode and triggers a search', () => {
      component.ngOnInit()
      queryParams$.next({ mode: 'manage' })
      expect(component.routeMode).toBe('manage')
      expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('position', '', 'en')
    })

    it('resolves card mode when no query param is present', () => {
      component.ngOnInit()
      queryParams$.next({})
      expect(component.routeMode).toBe('card')
      expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('position', '', 'en')
    })
  })

  describe('ngOnDestroy', () => {
    it('unsubscribes and completes destroy subject without throwing', () => {
      component.ngOnInit()
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })

  describe('updateButtonText', () => {
    it('sets text based on route mode', () => {
      component.routeMode = 'upload'
      component.updateButtonText()
      expect(component.uploadButtonText).toBe('Upload File')

      component.routeMode = 'manage'
      component.updateButtonText()
      expect(component.uploadButtonText).toBe('Change File')

      component.routeMode = 'card'
      component.updateButtonText()
      expect(component.uploadButtonText).toBe('Change File')
    })
  })

  describe('hasTableData / hasPendingTableChanges', () => {
    it('returns false with no data and true with data', () => {
      component.tableConfig = { columns: [], data: [] }
      expect(component.hasTableData()).toBe(false)

      component.tableConfig = { columns: [], data: [{ code: 'A' }] as any }
      expect(component.hasTableData()).toBe(true)
    })

    it('detects pending changes via edit tracker baseline', () => {
      component.tableConfig = { columns: [], data: [{ code: 'A', name: 'foo' }] as any }
      ;(component as any).editTracker.captureBaseline(component.tableConfig.data as any)
      expect(component.hasPendingTableChanges()).toBe(false)

      component.tableConfig = { columns: [], data: [{ code: 'A', name: 'bar' }] as any }
      expect(component.hasPendingTableChanges()).toBe(true)
    })
  })

  describe('search triggers', () => {
    beforeEach(() => {
      component.ngOnInit()
      mockFracApiService.searchEntities.mockClear()
    })

    it('onSearchTermChange triggers search when not disabled', () => {
      jest.useFakeTimers()
      component.routeMode = 'manage'
      component.searchTerm = 'abc'
      component.onSearchTermChange()
      jest.advanceTimersByTime(1000)
      expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('position', 'abc', 'en')
      jest.useRealTimers()
    })

    it('onSearchTermChange does nothing when filter controls disabled', () => {
      component.isUploading = true
      component.onSearchTermChange()
      expect(mockFracApiService.searchEntities).not.toHaveBeenCalled()
    })

    it('onSearch triggers immediate search', () => {
      component.routeMode = 'manage'
      component.searchTerm = 'xyz'
      component.onSearch()
      expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('position', 'xyz', 'en')
    })

    it('onSearch does nothing in upload mode', () => {
      component.routeMode = 'upload'
      component.onSearch()
      expect(mockFracApiService.searchEntities).not.toHaveBeenCalled()
    })

    it('onSearchEnter triggers search', () => {
      component.routeMode = 'card'
      component.searchTerm = 'ent'
      component.onSearchEnter()
      expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('position', 'ent', 'en')
    })
  })

  describe('fetchEntitiesForTable (via triggerSearch/init)', () => {
    it('populates table state on success and loads hierarchy counts in card mode', () => {
      const rows = [{ code: 'p1', name: 'Pos One' }, { code: 'p2', name: 'Pos Two' }]
      mockFracApiService.searchEntities.mockReturnValue(of({ result: { entity: rows } }) as any)
      mockFracApiService.searchEntityHierarchy.mockReturnValue(of({ result: [] }) as any)

      component.routeMode = 'card'
      component.ngOnInit()
      queryParams$.next({})

      expect(component.isSearching).toBe(false)
      expect(component.originalRowData.length).toBe(2)
      expect(component.tableConfig.data.length).toBe(2)
      expect(component.selectedRows).toEqual([])
      expect(mockFracApiService.searchEntityHierarchy).toHaveBeenCalled()
    })

    it('handles search error gracefully and resets hierarchy maps', () => {
      mockFracApiService.searchEntities.mockReturnValue(throwError(() => new Error('boom')))
      component.routeMode = 'manage'
      component.ngOnInit()
      queryParams$.next({ mode: 'manage' })

      expect(component.isSearching).toBe(false)
      expect(component.positionHierarchyCountMap).toEqual({})
      expect(component.positionHierarchyDetailMap).toEqual({})
    })

    it('skips hierarchy loading entirely when not in card mode', () => {
      const rows = [{ code: 'p1', name: 'Pos One' }]
      mockFracApiService.searchEntities.mockReturnValue(of({ result: { entity: rows } }) as any)
      component.routeMode = 'manage'
      component.ngOnInit()
      queryParams$.next({ mode: 'manage' })

      expect(mockFracApiService.searchEntityHierarchy).not.toHaveBeenCalled()
      expect(component.positionHierarchyCountMap).toEqual({})
    })
  })

  describe('getPositionHierarchyCounts / isCountLoading', () => {
    it('returns default counts when code missing from map', () => {
      const counts = component.getPositionHierarchyCounts({ code: 'zzz' })
      expect(counts).toEqual({ role: 0, activity: 0, competency: 0 })
    })

    it('returns cached counts for a known code and reports loading state', () => {
      component.positionHierarchyCountMap = { CODE1: { role: 2, activity: 1, competency: 3 } }
      component.positionCountLoadingSet = new Set(['CODE1'])
      expect(component.getPositionHierarchyCounts({ code: 'code1' })).toEqual({ role: 2, activity: 1, competency: 3 })
      expect(component.isCountLoading({ code: 'code1' })).toBe(true)
      expect(component.isCountLoading({ code: 'other' })).toBe(false)
    })
  })

  describe('onCountChipClick', () => {
    it('opens hierarchy chip details dialog with resolved details', () => {
      component.positionHierarchyDetailMap = {
        CODE1: { role: [{ entityCode: 'R1', entityName: 'Role 1' }], activity: [], competency: [] },
      }
      component.onCountChipClick({ code: 'code1' }, 'role')
      expect(mockDialog.open).toHaveBeenCalled()
      const callArgs = mockDialog.open.mock.calls[0][1]
      expect(callArgs.data.chipType).toBe('role')
      expect(callArgs.data.items).toEqual([{ entityCode: 'R1', entityName: 'Role 1' }])
    })
  })

  describe('language dropdown', () => {
    it('toggles open state when not disabled', () => {
      component.isUploading = false
      component.toggleDropdown()
      expect(component.isOpen).toBe(true)
      component.toggleDropdown()
      expect(component.isOpen).toBe(false)
    })

    it('forces closed state when disabled', () => {
      component.isUploading = true
      component.isOpen = true
      component.toggleDropdown()
      expect(component.isOpen).toBe(false)
    })

    it('selectLanguage updates language and triggers search in manage/card mode', () => {
      component.ngOnInit()
      mockFracApiService.searchEntities.mockClear()
      component.routeMode = 'manage'
      component.isOpen = true
      const evt = { stopPropagation: jest.fn() } as any
      component.selectLanguage({ key: 'hi' }, evt)
      expect(component.selectedLanguage).toBe('hi')
      expect(component.isOpen).toBe(false)
      expect(evt.stopPropagation).toHaveBeenCalled()
      expect(mockFracApiService.searchEntities).toHaveBeenCalledWith('position', '', 'hi')
    })

    it('selectLanguage is a no-op when dropdown disabled', () => {
      component.isUploading = true
      const evt = { stopPropagation: jest.fn() } as any
      component.selectLanguage({ key: 'hi' }, evt)
      expect(component.selectedLanguage).not.toBe('hi')
      expect(evt.stopPropagation).toHaveBeenCalled()
    })

    it('onDocumentClick closes dropdown when click outside', () => {
      component.isOpen = true
      const target = document.createElement('div')
      component.onDocumentClick({ target } as any)
      expect(component.isOpen).toBe(false)
    })

    it('onDocumentClick keeps dropdown open when click inside .language-dropdown', () => {
      const target = document.createElement('div')
      target.classList.add('language-dropdown')
      component.isOpen = true
      component.onDocumentClick({ target } as any)
      expect(component.isOpen).toBe(true)
    })

    it('onDocumentClick does nothing when dropdown already closed', () => {
      component.isOpen = false
      const target = document.createElement('div')
      component.onDocumentClick({ target } as any)
      expect(component.isOpen).toBe(false)
    })
  })

  describe('onSelectionChange', () => {
    it('updates selected rows', () => {
      const rows = [{ code: 'a' }] as any
      component.onSelectionChange(rows)
      expect(component.selectedRows).toBe(rows)
    })
  })

  describe('onEditClicked', () => {
    it('does nothing when no rows selected', () => {
      component.selectedRows = []
      component.onEditClicked()
      expect(component.isEditing).toBe(false)
    })

    it('enables edit mode when rows selected', () => {
      component.selectedRows = [{ code: 'a' }] as any
      component.onEditClicked()
      expect(component.isEditing).toBe(true)
    })
  })

  describe('onSaveClicked', () => {
    beforeEach(() => {
      component.originalRowData = [{ code: 'A', name: 'Old', languageCode: 'en' }] as any
      component.tableConfig = { columns: [], data: [{ code: 'A', name: 'New' }] as any }
      ;(component as any).editTracker.captureBaseline(component.originalRowData)
      component.selectedRows = [{ code: 'A', name: 'New' }] as any
    })

    it('does nothing when no rows selected', () => {
      component.selectedRows = []
      component.onSaveClicked()
      expect(mockFracApiService.updateEntity).not.toHaveBeenCalled()
    })

    it('does nothing while already updating', () => {
      component.isUpdating = true
      component.onSaveClicked()
      expect(mockFracApiService.updateEntity).not.toHaveBeenCalled()
    })

    it('warns and skips when no rows changed', () => {
      const unchangedRow = { code: 'A', name: 'Old', languageCode: 'en' }
      component.tableConfig = { columns: [], data: [{ ...unchangedRow }] as any }
      component.selectedRows = [{ ...unchangedRow }] as any
      ;(component as any).editTracker.captureBaseline(component.tableConfig.data as any)
      component.onSaveClicked()
      expect(mockFracApiService.updateEntity).not.toHaveBeenCalled()
    })

    it('calls updateEntity and shows success modal on success', () => {
      mockFracApiService.updateEntity.mockReturnValue(of({}) as any)
      component.onSaveClicked()
      expect(mockFracApiService.updateEntity).toHaveBeenCalled()
      expect(component.isUpdating).toBe(false)
      expect(component.isEditing).toBe(false)
      expect(component.selectedRows).toEqual([])
      expect(mockDialog.open).toHaveBeenCalled()
    })

    it('shows error modal on updateEntity failure', () => {
      mockFracApiService.updateEntity.mockReturnValue(throwError(() => ({ status: 500, message: 'fail' })))
      component.onSaveClicked()
      expect(component.isUpdating).toBe(false)
      expect(mockDialog.open).toHaveBeenCalled()
    })
  })

  describe('onRemoveClicked', () => {
    beforeEach(() => {
      component.selectedRows = [{ code: 'A' }] as any
      component.tableConfig = { columns: [], data: [{ code: 'A' }, { code: 'B' }] as any }
      component.originalRowData = [{ code: 'A' }, { code: 'B' }] as any
    })

    it('does nothing when no rows selected', () => {
      component.selectedRows = []
      component.onRemoveClicked()
      expect(mockDialog.open).not.toHaveBeenCalled()
    })

    it('does nothing while already deleting', () => {
      component.isDeleting = true
      component.onRemoveClicked()
      expect(mockDialog.open).not.toHaveBeenCalled()
    })

    it('deletes selected rows on confirmation continue', () => {
      mockDialog.open.mockReturnValue({ afterClosed: () => of('continue') })
      mockFracApiService.deleteEntity.mockReturnValue(of({}) as any)
      component.onRemoveClicked()
      expect(mockFracApiService.deleteEntity).toHaveBeenCalled()
      expect(component.tableConfig.data.length).toBe(1)
      expect(component.originalRowData.length).toBe(1)
      expect(component.isDeleting).toBe(false)
    })

    it('does not delete when dialog is cancelled', () => {
      mockDialog.open.mockReturnValue({ afterClosed: () => of('cancel') })
      component.onRemoveClicked()
      expect(mockFracApiService.deleteEntity).not.toHaveBeenCalled()
    })

    it('shows error modal when delete fails', () => {
      mockDialog.open.mockReturnValue({ afterClosed: () => of('continue') })
      mockFracApiService.deleteEntity.mockReturnValue(throwError(() => ({ status: 400 })))
      component.onRemoveClicked()
      expect(component.isDeleting).toBe(false)
    })
  })

  describe('onDownloadTemplate', () => {
    it('creates a download link and clicks it', () => {
      const clickSpy = jest.fn()
      const anchor: any = { click: clickSpy, href: '', download: '' }
      jest.spyOn(document, 'createElement').mockReturnValue(anchor)
      component.selectedLanguage = 'en'
      component.onDownloadTemplate()
      expect(clickSpy).toHaveBeenCalled()
      expect(anchor.download).toContain('position')
      ;(document.createElement as any).mockRestore()
    })
  })

  describe('openUploadPopup / uploadFile', () => {
    it('opens the upload popup and triggers uploadFile when result contains a file', () => {
      const file = new File(['x'], 'sample.csv')
      mockDialog.open.mockReturnValue({ afterClosed: () => of({ action: 'upload', file, language: 'en' }) })
      mockFracApiService.uploadFile.mockReturnValue(of({ result: { position: { successCodes: ['P1'] } } }) as any)
      component.openUploadPopup()
      expect(mockFracApiService.uploadFile).toHaveBeenCalledWith(file, 'en')
    })

    it('does not upload when dialog closed without file', () => {
      mockDialog.open.mockReturnValue({ afterClosed: () => of({ action: 'cancel' }) })
      component.openUploadPopup()
      expect(mockFracApiService.uploadFile).not.toHaveBeenCalled()
    })

    it('uploadFile is a no-op while already uploading', () => {
      component.isUploading = true
      component.uploadFile(new File(['x'], 'a.csv'), 'en')
      expect(mockFracApiService.uploadFile).not.toHaveBeenCalled()
    })

    it('uploadFile handles a successful upload response', async () => {
      const file = new File(['x'], 'a.csv')
      mockFracApiService.uploadFile.mockReturnValue(of({ result: { position: { successCodes: ['P1', 'P2'] } } }) as any)
      component.uploadFile(file, 'en')
      await Promise.resolve()
      await Promise.resolve()
      expect(component.isUploading).toBe(false)
      expect(mockDialog.open).toHaveBeenCalled()
    })

    it('uploadFile handles an upload error', async () => {
      const file = new File(['x'], 'a.csv')
      mockFracApiService.uploadFile.mockReturnValue(throwError(() => ({ status: 500, message: 'server error' })))
      component.uploadFile(file, 'en')
      await Promise.resolve()
      await Promise.resolve()
      expect(component.isUploading).toBe(false)
      expect(mockDialog.open).toHaveBeenCalled()
    })
  })

  describe('onHomeClick', () => {
    it('does nothing when updating', () => {
      component.isUpdating = true
      component.onHomeClick()
      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled()
    })

    it('navigates directly when no pending changes', () => {
      component.isUpdating = false
      jest.spyOn(component, 'hasPendingTableChanges').mockReturnValue(false)
      component.onHomeClick()
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(FRAC_ROUTES.positionCardGrid)
    })

    it('opens confirmation dialog and navigates on continue when pending changes exist', () => {
      jest.spyOn(component, 'hasPendingTableChanges').mockReturnValue(true)
      mockDialog.open.mockReturnValue({ afterClosed: () => of('continue') })
      component.onHomeClick()
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(FRAC_ROUTES.positionCardGrid)
    })

    it('does not navigate on dialog cancel when pending changes exist', () => {
      jest.spyOn(component, 'hasPendingTableChanges').mockReturnValue(true)
      mockDialog.open.mockReturnValue({ afterClosed: () => of('cancel') })
      component.onHomeClick()
      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled()
    })
  })

  describe('isFilterControlsDisabled / isLanguageDropdownDisabled', () => {
    it('disables filters when uploading or in upload mode', () => {
      component.isUploading = false
      component.routeMode = 'manage'
      expect(component.isFilterControlsDisabled()).toBe(false)

      component.routeMode = 'upload'
      expect(component.isFilterControlsDisabled()).toBe(true)

      component.routeMode = 'manage'
      component.isUploading = true
      expect(component.isFilterControlsDisabled()).toBe(true)
    })

    it('disables language dropdown only when uploading', () => {
      component.isUploading = false
      expect(component.isLanguageDropdownDisabled()).toBe(false)
      component.isUploading = true
      expect(component.isLanguageDropdownDisabled()).toBe(true)
    })
  })

  describe('activeEmptyStateConfig / shouldShowTableEmptyState', () => {
    it('returns noResultEmptyStateConfig for card/manage modes', () => {
      component.routeMode = 'card'
      expect(component.activeEmptyStateConfig).toBe(component.noResultEmptyStateConfig)
      component.routeMode = 'manage'
      expect(component.activeEmptyStateConfig).toBe(component.noResultEmptyStateConfig)
    })

    it('returns uploadEmptyStateConfig for upload mode', () => {
      component.routeMode = 'upload'
      expect(component.activeEmptyStateConfig).toBe(component.uploadEmptyStateConfig)
    })

    it('shouldShowTableEmptyState is false while uploading/searching/has data', () => {
      component.isUploading = true
      expect(component.shouldShowTableEmptyState()).toBe(false)
    })

    it('shouldShowTableEmptyState is true for empty manage/upload table', () => {
      component.isUploading = false
      component.isSearching = false
      component.tableConfig = { columns: [], data: [] }
      component.routeMode = 'manage'
      expect(component.shouldShowTableEmptyState()).toBe(true)

      component.routeMode = 'card'
      expect(component.shouldShowTableEmptyState()).toBe(false)
    })
  })

  describe('goToUploadMode / navigateToListManage', () => {
    it('navigates to upload route', () => {
      component.goToUploadMode()
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(FRAC_ROUTES.positionUpload)
    })

    it('navigates to manage route', () => {
      component.navigateToListManage()
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(FRAC_ROUTES.positionManage)
    })
  })

  describe('onViewPosition', () => {
    it('opens hierarchy view dialog on successful fetch', () => {
      component.ngOnInit()
      mockFracApiService.searchEntityHierarchy.mockReturnValue(of({ result: [] }) as any)
      component.onViewPosition({ code: 'p1', name: 'Position One' } as any)
      expect(mockFracApiService.searchEntityHierarchy).toHaveBeenCalledWith('position', 'P1', 'en')
      expect(mockDialog.open).toHaveBeenCalled()
    })

    it('falls back to empty tree dialog when fetch fails and no cache exists', () => {
      component.ngOnInit()
      mockFracApiService.searchEntityHierarchy.mockReturnValue(throwError(() => new Error('fail')))
      component.onViewPosition({ code: 'p2', name: 'Position Two' } as any)
      expect(mockDialog.open).toHaveBeenCalled()
    })

    it('falls back to the raw cached response when fetch fails but a cached entry exists', () => {
      component.ngOnInit()
      const cacheKey = (component as any).getHierarchyCacheKey('P3', 'en')
      const cachedRaw = { result: [{ code: 'P3' }] }
      ;(component as any).hierarchyRawResponseCache.set(cacheKey, cachedRaw)
      mockFracApiService.searchEntityHierarchy.mockReturnValue(throwError(() => new Error('fail')))
      component.onViewPosition({ code: 'p3', name: 'Position Three' } as any)
      expect(mockDialog.open).toHaveBeenCalled()
    })
  })

  describe('onViewEdit', () => {
    it('navigates with positionCode query param when code present', () => {
      component.onViewEdit({ code: 'P1' })
      expect(mockRouter.navigate).toHaveBeenCalledWith([FRAC_ROUTES.mapRolePosition], { queryParams: { positionCode: 'P1' } })
    })

    it('navigates with empty query params when code missing', () => {
      component.onViewEdit({})
      expect(mockRouter.navigate).toHaveBeenCalledWith([FRAC_ROUTES.mapRolePosition], { queryParams: {} })
    })
  })

  describe('onCardRemove', () => {
    it('filters the removed position out of searchResults', () => {
      const pos1 = { code: 'A' }
      const pos2 = { code: 'B' }
      component.searchResults = [pos1, pos2] as any
      component.onCardRemove(pos1)
      expect(component.searchResults).toEqual([pos2])
    })
  })

  describe('resolveDefaultLanguage via languages getter', () => {
    it('exposes languages from the orchestrator', () => {
      expect(component.languages).toBe(mockOrchestrator.languages)
    })
  })

  describe('additional branch coverage', () => {
    it('onSearchEnter is a no-op when filter controls are disabled', () => {
      component.routeMode = 'upload'
      const nextSpy = jest.spyOn((component as any).searchTrigger$, 'next')
      component.onSearchEnter()
      expect(nextSpy).not.toHaveBeenCalled()
    })

    it('loadHierarchyCountsForCardPositions clears hierarchy maps when not in card mode', () => {
      component.routeMode = 'manage'
      ;(component as any).loadHierarchyCountsForCardPositions([{ code: 'P1' }] as any, 'en')
      expect(component.positionHierarchyCountMap).toEqual({})
      expect(component.positionHierarchyDetailMap).toEqual({})
    })

    it('loadHierarchyCountsForCardPositions clears state when there are no valid positions', () => {
      component.routeMode = 'card'
      ;(component as any).loadHierarchyCountsForCardPositions([{ code: '' }, {}] as any, 'en')
      expect(component.positionHierarchyCountMap).toEqual({})
      expect(component.positionCountLoadingSet.size).toBe(0)
    })

    it('loadHierarchyCountsForCardPositions seeds the map with cached aggregates before the refresh resolves', () => {
      component.routeMode = 'card'
      const cacheKey = (component as any).getHierarchyCacheKey('P1', 'en')
      const aggregate = { counts: { role: 1, activity: 2, competency: 3 }, details: { role: [], activity: [], competency: [] } }
      ;(component as any).hierarchyAggregateCache.set(cacheKey, aggregate)
      const pending = new Subject<any>()
      mockFracApiService.searchEntityHierarchy.mockReturnValue(pending.asObservable())
      ;(component as any).loadHierarchyCountsForCardPositions([{ code: 'P1' }] as any, 'en')
      expect(component.positionHierarchyCountMap['P1']).toBe(aggregate.counts)
    })

    it('loadHierarchyCountsForCardPositions ignores a stale resolved request from a superseded call', () => {
      component.routeMode = 'card'
      const pending = new Subject<any>()
      mockFracApiService.searchEntityHierarchy.mockReturnValue(pending.asObservable())
      ;(component as any).loadHierarchyCountsForCardPositions([{ code: 'P1' }] as any, 'en')
      mockFracApiService.searchEntityHierarchy.mockReturnValue(of({ result: [] }))
      ;(component as any).loadHierarchyCountsForCardPositions([{ code: 'P2' }] as any, 'en')
      pending.next({ result: [] })
      pending.complete()
      expect(component.positionHierarchyCountMap['P2']).toBeDefined()
    })

    it('onRemoveClicked warns and skips when the delete payload cannot be generated', () => {
      component.selectedRows = [{ code: undefined } as any]
      mockDialog.open.mockReturnValue({ afterClosed: () => of('continue') })
      component.onRemoveClicked()
      expect(mockFracApiService.deleteEntity).not.toHaveBeenCalled()
    })

    it('uploadFile falls back to a count of 1 when there are no success codes or result count', async () => {
      mockFracApiService.uploadFile = jest.fn().mockReturnValue(
        of({ responseCode: 'OK', result: {} }),
      ) as any
      component.uploadFile(new File([''], 'f.csv'))
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
      expect(mockDialog.open).toHaveBeenCalled()
      const dialogData = mockDialog.open.mock.calls[mockDialog.open.mock.calls.length - 1][1].data
      expect(dialogData.count).toBe(1)
    })

    it('uploadFile uses the result count when uploadedCodes are absent', async () => {
      mockFracApiService.uploadFile = jest.fn().mockReturnValue(
        of({ responseCode: 'OK', result: { count: 5 } }),
      ) as any
      component.uploadFile(new File([''], 'f.csv'))
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
      const dialogData = mockDialog.open.mock.calls[mockDialog.open.mock.calls.length - 1][1].data
      expect(dialogData.count).toBe(5)
    })

    it('uploadFile shows a failure modal when the upload response indicates failure', done => {
      mockFracApiService.uploadFile = jest.fn().mockReturnValue(
        of({ responseCode: 'CLIENT_ERROR', result: {} }),
      ) as any
      component.uploadFile(new File([''], 'f.csv'))
      setTimeout(() => {
        expect(mockDialog.open).toHaveBeenCalled()
        done()
      }, 0)
    })

    it('showResultModal redirects to a given URL on close when redirectToUrl is set and result succeeded', () => {
      mockDialog.open.mockReturnValue({ afterClosed: () => of(undefined) })
      ;(component as any).showResultModal({ type: 'success', title: 'T', message: 'M' }, false, false, '/custom-url')
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/custom-url')
    })

    it('showResultModal redirects home on close when redirectOnClose is set and result succeeded', () => {
      mockDialog.open.mockReturnValue({ afterClosed: () => of(undefined) })
      ;(component as any).showResultModal({ type: 'success', title: 'T', message: 'M' }, false, true)
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(FRAC_ROUTES.homeDashboard)
    })

    it('fetchHierarchyAggregate returns the cached aggregate when not forcing a refresh', () => {
      const cacheKey = (component as any).getHierarchyCacheKey('P1', 'en')
      const aggregate = { counts: { role: 1, activity: 0, competency: 0 }, details: { role: [], activity: [], competency: [] } }
      const rawResponse = { result: [] }
      ;(component as any).hierarchyAggregateCache.set(cacheKey, aggregate)
      ;(component as any).hierarchyRawResponseCache.set(cacheKey, rawResponse)
      mockFracApiService.searchEntityHierarchy.mockClear()
      let emitted: any
      ;(component as any).fetchHierarchyAggregate('P1', 'en', false).subscribe((v: any) => { emitted = v })
      expect(emitted).toEqual({ aggregate, response: rawResponse })
      expect(mockFracApiService.searchEntityHierarchy).not.toHaveBeenCalled()
    })

    it('fetchHierarchyAggregate reuses an in-flight request for the same cache key', () => {
      const subject = new Subject<any>()
      mockFracApiService.searchEntityHierarchy.mockReturnValue(subject.asObservable())
      const first = (component as any).fetchHierarchyAggregate('P1', 'en', true)
      const second = (component as any).fetchHierarchyAggregate('P1', 'en', true)
      expect(second).toBe(first)
      expect(mockFracApiService.searchEntityHierarchy).toHaveBeenCalledTimes(1)
    })
  })
})
