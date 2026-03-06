import { Component, OnInit, OnDestroy } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute, Router } from '@angular/router'
import { FracUploadPopupComponent } from '../../../components/frac-upload/frac-upload-popup.component'
import { UploadPopupResult } from '../../../models/upload-popup-config.model'
import { UploadResultModalComponent, UploadResultData } from '../../../components/upload-result-modal/upload-result-modal.component'
import { UnsavedChangesModalComponent } from '../../../components/unsaved-changes-modal/unsaved-changes-modal.component'
import { ITableConfig, TableTransformUtil } from '../../../utils/table-transform.util'
import { FracResponseParserUtil } from '../../../utils/frac-response-parser.util'
import { FracUploadHelper } from '../../../utils/frac-upload-helper'
import { FracPayloadBuilder } from '../../../utils/frac-payload-builder.util'
import { FracPositionHierarchyHelper, PositionHierarchyAggregate, PositionHierarchyCounts, PositionHierarchyDetails } from '../../../utils/frac-position-hierarchy.helper'
import { FracEditTracker } from '../../../utils/frac-edit-tracker.util'
import { FracUploadRow } from '../../../models/frac-table.models'
import { extractEntityList, sortEntitiesForDisplay, getLanguageCode } from '../../../utils/common.util'
import { fracLogger } from '../../../utils/frac-logger.util'
import { FracApiService } from '../../../services/frac-api.service'
import {
  FracEntityUploadOrchestratorService,
  UploadRouteMode,
  UploadSearchSource,
  UploadSearchTriggerPayload,
} from '../../../services/frac-entity-upload-orchestrator.service'
import { forkJoin, of, Subject, Subscription } from 'rxjs'
import { catchError, map, takeUntil } from 'rxjs/operators'
import { FRAC_UI_CONFIG } from '../../../models/ui.config.model'
import { FRAC_DIALOG_SIZES, FRAC_ROUTES, FRAC_UPLOAD_PAGE_SPINNER } from '../../../constants/frac.constants'
import { buildFracUploadPopupConfig, getFracSampleTemplateUrl } from '../../../utils/frac-upload-ui.util'
import {
  HierarchyChipDetailsModalComponent,
  HierarchyChipType,
} from '../../../components/hierarchy-chip-details-modal/hierarchy-chip-details-modal.component'
import {
  PositionHierarchyViewModalComponent,
  PositionHierarchyViewModalData,
} from '../../../components/position-hierarchy-view-modal/position-hierarchy-view-modal.component'
import { buildPositionMappingTree } from '../../../utils/common.util'

interface UploadEmptyStateConfig {
  icon: string
  title: string
  message: string
  suggestion: string
}



@Component({
  selector: 'ws-app-position-upload',
  templateUrl: './position-upload.component.html',
  styleUrls: ['./position-upload.component.scss']
})
export class PositionUploadComponent implements OnInit, OnDestroy {

  private editTracker: FracEditTracker
  constructor(
    private dialog: MatDialog,
    private fracApiService: FracApiService,
    private tableTransformUtil: TableTransformUtil,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private uploadOrchestrator: FracEntityUploadOrchestratorService,
  ) {
    this.editTracker = new FracEditTracker(this.uploadOrchestrator)
  }

  // ============= UI CONFIG =============
  uiConfig = FRAC_UI_CONFIG

  // ============= ROUTE STATE =============

  /**
   * Route mode:
   * - 'card'   → card grid (sidebar / no query param)
   * - 'manage' → role-like table manage (?mode=manage)
   * - 'upload' → upload flow (?mode=upload)
   */
  routeMode: UploadRouteMode | 'card' = 'card'

  /** Shows search & language on card grid only when accessed via explicit ?mode=manage from dashboard card */
  showManageSearch = false

  // ============= TABLE STATE =============

  /** Original table data for comparison */
  originalRowData: FracUploadRow[] = []

  /** Data removed via UI */
  removedData: FracUploadRow[] = []

  /** Table configuration with columns and data */
  tableConfig: ITableConfig = { columns: [], data: [] }

  /** Rows selected in table */
  selectedRows: FracUploadRow[] = []

  // ============= UI STATE =============

  /** Enable/disable edit mode */
  isEditing = false

  /** Button text changes based on mode */
  uploadButtonText: string = 'Upload File'

  /** Search and filter */
  searchTerm = ''
  searchResults: FracUploadRow[] = []

  /** Language selection */
  selectedLanguage = this.uploadOrchestrator.languages[0]
  languages = this.uploadOrchestrator.languages
  readonly uploadPageSpinner = FRAC_UPLOAD_PAGE_SPINNER
  isOpen = false
  readonly uploadEmptyStateConfig: UploadEmptyStateConfig = {
    icon: 'upload_file',
    title: 'No file uploaded yet',
    message: 'Upload your position file to preview the records.',
    suggestion: 'Choose a language and download the appropriate sample template.',
  }
  readonly noResultEmptyStateConfig: UploadEmptyStateConfig = {
    icon: 'search_off',
    title: 'No results found',
    message: 'No position records match the selected filters.',
    suggestion: 'Try a different search keyword or language.',
  }

  /** Shimmer placeholder cards shown while card grid is loading. Count is config-driven. */
  readonly shimmerCardCount = 16
  readonly shimmerCards = Array.from({ length: this.shimmerCardCount })
  readonly defaultHierarchyCounts: PositionHierarchyCounts = { role: 0, activity: 0, competency: 0 }
  readonly defaultHierarchyDetails: PositionHierarchyDetails = { role: [], activity: [], competency: [] }
  positionHierarchyCountMap: Record<string, PositionHierarchyCounts> = {}
  positionHierarchyDetailMap: Record<string, PositionHierarchyDetails> = {}


  // ============= LOADING & API RESPONSE =============
  uploadProgress = 0
  isUploading = false
  isSearching = false
  isUpdating = false
  isDeleting = false
  apiResponse: any = null

  // ============= INTERNAL STATE =============

  private searchTrigger$ = new Subject<UploadSearchTriggerPayload>()
  private searchSubscription: Subscription | null = null
  private destroy$ = new Subject<void>()
  private hierarchyAggregateCache = new Map<string, PositionHierarchyAggregate>()
  private hierarchyRawResponseCache = new Map<string, import('../../../models/frac-api.models').FracHierarchyResponse>()
  private hierarchyRequestToken = 0

  // ============= LIFECYCLE =============

  ngOnInit(): void {
    this.uploadOrchestrator.bindSearchTriggerStream(
      this.searchTrigger$,
      this.destroy$,
      (keyword, language) => this.fetchEntitiesForTable(keyword, language),
    )

    this.activatedRoute.queryParams.subscribe(queryParams => {
      const rawMode = queryParams['mode']
      if (rawMode === 'upload') {
        // Upload flow
        this.routeMode = 'upload'
        this.showManageSearch = false
      } else if (rawMode === 'manage') {
        // Explicit ?mode=manage -> role-like table manage
        this.routeMode = 'manage'
        this.showManageSearch = false
      } else {
        // No query param -> sidebar/home layout -> card grid
        this.routeMode = 'card'
        this.showManageSearch = false
      }
      this.updateButtonText()
      this.loadTableDataBasedOnMode()
    })
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe()
    this.destroy$.next()
    this.destroy$.complete()
  }

  // ============= TABLE INITIALIZATION =============

  loadTableDataBasedOnMode(): void {
    if (this.routeMode === 'card' || this.routeMode === 'manage') {
      this.triggerSearch('init')
    } else {
      this.tableConfig = { columns: [], data: [] }
      this.originalRowData = []
      this.selectedRows = []
      this.removedData = []
      this.isEditing = false
      this.editTracker.captureBaseline(this.tableConfig.data as unknown as FracUploadRow[])
    }
  }

  // ============= BUTTON & UI STATE =============

  updateButtonText(): void {
    const mode = this.routeMode === 'card' ? 'manage' : this.routeMode
    this.uploadButtonText = this.uploadOrchestrator.resolveUploadButtonText(mode)
  }

  hasTableData(): boolean {
    return this.tableConfig.data && this.tableConfig.data.length > 0
  }

  hasPendingTableChanges(): boolean {
    return this.editTracker.hasChanges(this.tableConfig.data as unknown as FracUploadRow[])
  }

  // ============= SEARCH & FILTER =============

  onSearchTermChange(): void {
    if (this.isFilterControlsDisabled()) {
      return
    }
    this.triggerSearch('typing')
  }

  onSearch(): void {
    if (this.isFilterControlsDisabled()) {
      return
    }
    this.triggerSearch('icon')
  }

  onSearchEnter(): void {
    if (this.isFilterControlsDisabled()) {
      return
    }
    this.triggerSearch('enter')
  }

  private triggerSearch(source: UploadSearchSource): void {
    this.searchTrigger$.next(this.uploadOrchestrator.buildSearchPayload(this.searchTerm, this.selectedLanguage, source))
  }

  private fetchEntitiesForTable(keyword: string, language: string = this.selectedLanguage): void {
    this.searchSubscription?.unsubscribe()
    this.isSearching = true

    this.searchSubscription = this.fracApiService
      .searchEntities('position', keyword, language)
      .subscribe({
        next: (res) => {
          this.isSearching = false
          const entityList = extractEntityList(res)
          const sortedEntityList = sortEntitiesForDisplay(entityList) as unknown as FracUploadRow[]
          this.searchResults = sortedEntityList
          this.originalRowData = sortedEntityList
          this.tableConfig = this.tableTransformUtil.transformResponseToTableConfig(sortedEntityList)
          this.selectedRows = []
          this.removedData = []
          this.isEditing = false
          this.loadHierarchyCountsForCardPositions(sortedEntityList, language)
          this.editTracker.captureBaseline(this.tableConfig.data as unknown as FracUploadRow[])
        },
        error: (err) => {
          this.isSearching = false
          this.positionHierarchyCountMap = {}
          this.positionHierarchyDetailMap = {}
          fracLogger.error('Position search failed', err)
        }
      })
  }

  private loadHierarchyCountsForCardPositions(positions: FracUploadRow[], language: string): void {
    if (this.routeMode !== 'card') {
      this.positionHierarchyCountMap = {}
      this.positionHierarchyDetailMap = {}
      return
    }

    const validPositions = (positions || []).filter((pos) => !!FracPositionHierarchyHelper.normalizeCode(pos?.code))
    if (!validPositions.length) {
      this.positionHierarchyCountMap = {}
      this.positionHierarchyDetailMap = {}
      return
    }

    const requestToken = ++this.hierarchyRequestToken
    const requests = validPositions.map((position) => {
      const code = FracPositionHierarchyHelper.normalizeCode(position?.code)
      const cacheKey = this.getHierarchyCacheKey(code, language)
      const cachedAggregate = this.hierarchyAggregateCache.get(cacheKey)

      if (cachedAggregate) {
        return of({ code, aggregate: cachedAggregate })
      }

      return this.fracApiService.searchEntityHierarchy('position', code, language).pipe(
        map((response) => {
          const aggregate = FracPositionHierarchyHelper.extractAggregateFromResponse(response)
          this.hierarchyAggregateCache.set(cacheKey, aggregate)
          this.hierarchyRawResponseCache.set(cacheKey, response)
          return { code, aggregate }
        }),
        catchError(() => of({
          code,
          aggregate: { counts: this.defaultHierarchyCounts, details: this.defaultHierarchyDetails },
        })),
      )
    })

    forkJoin(requests).subscribe((results) => {
      if (requestToken !== this.hierarchyRequestToken) {
        return
      }

      const nextMap: Record<string, PositionHierarchyCounts> = {}
      const nextDetailsMap: Record<string, PositionHierarchyDetails> = {}
      results.forEach((item) => {
        nextMap[item.code] = item.aggregate.counts
        nextDetailsMap[item.code] = item.aggregate.details
      })
      this.positionHierarchyCountMap = nextMap
      this.positionHierarchyDetailMap = nextDetailsMap
    })
  }

  getPositionHierarchyCounts(position: Record<string, unknown>): PositionHierarchyCounts {
    const code = FracPositionHierarchyHelper.normalizeCode(position?.['code'])
    return this.positionHierarchyCountMap[code] || this.defaultHierarchyCounts
  }

  private getPositionHierarchyDetails(position: Record<string, unknown>): PositionHierarchyDetails {
    const code = FracPositionHierarchyHelper.normalizeCode(position?.['code'])
    return this.positionHierarchyDetailMap[code] || this.defaultHierarchyDetails
  }

  onCountChipClick(position: Record<string, unknown>, chipType: HierarchyChipType): void {
    const details = this.getPositionHierarchyDetails(position)[chipType] || []

    this.dialog.open(HierarchyChipDetailsModalComponent, {
      width: FRAC_DIALOG_SIZES.hierarchyChipDetails,
      disableClose: false,
      panelClass: 'hierarchy-chip-details-dialog',
      data: {
        chipType,
        items: details,
      },
    })
  }



  // ============= LANGUAGE DROPDOWN =============

  toggleDropdown(): void {
    if (this.isLanguageDropdownDisabled()) {
      this.isOpen = false
      return
    }
    this.isOpen = !this.isOpen
  }

  selectLanguage(lang: string, event: MouseEvent): void {
    if (this.isLanguageDropdownDisabled()) {
      event.stopPropagation()
      return
    }
    event.stopPropagation()
    this.selectedLanguage = lang
    this.isOpen = false

    if (this.routeMode === 'card' || this.routeMode === 'manage') {
      this.triggerSearch('language')
    }
  }

  // ============= TABLE SELECTION =============

  /** Update selected rows from table */
  onSelectionChange(selected: FracUploadRow[]): void {
    this.selectedRows = selected
  }

  // ============= TABLE ACTIONS: EDIT =============

  onEditClicked(): void {
    if (this.selectedRows.length === 0) {
      fracLogger.warn('Edit action ignored because no row is selected.')
      return
    }
    this.isEditing = true
  }

  onSaveClicked(): void {
    if (!this.selectedRows.length) {
      return
    }

    if (this.isUpdating) {
      return
    }

    const rowsToUpdate = this.selectedRows.map(row => ({ ...row }))
    const payloads = this.editTracker.getChangedRows(rowsToUpdate)
      .map(row => {
        const original = this.originalRowData.find(item => item?.code === row.code) || {}
        const languageCode = original?.languageCode || this.getLanguageCode(this.selectedLanguage)
        return FracPayloadBuilder.buildGenericUpdate('Position', row, original, languageCode)
      })
      .filter(Boolean) as any[]

    if (!payloads.length) {
      fracLogger.warn('Save action ignored because no table changes were detected.')
      return
    }

    this.isUpdating = true

    this.fracApiService.updateEntity(payloads).subscribe({
      next: () => {
        this.isUpdating = false
        this.isEditing = false
        this.selectedRows = []

        const successData: UploadResultData = {
          type: 'success',
          title: 'Update Successful',
          message: `${payloads.length} position ${payloads.length === 1 ? 'record' : 'records'} updated successfully.`,
          count: payloads.length,
        }
        this.editTracker.captureBaseline(this.tableConfig.data as unknown as FracUploadRow[])
        this.showResultModal(successData, true)
      },
      error: (err) => {
        this.isUpdating = false
        const failureData: UploadResultData = {
          type: 'error',
          title: 'Update Failed',
          message:
            err?.error?.params?.errmsg ||
            err?.error?.message ||
            err?.statusText ||
            err?.message ||
            'Failed to update position.',
          errorDetails: err?.status ? `HTTP Status: ${err.status}` : undefined,
        }
        this.showResultModal(failureData, false)
      },
    })
  }



  private getLanguageCode(language: string): string {
    return getLanguageCode(language)
  }

  // ============= TABLE ACTIONS: REMOVE =============

  onRemoveClicked(): void {
    if (this.selectedRows.length === 0) {
      fracLogger.warn('Remove action ignored because no row is selected.')
      return
    }

    if (this.isDeleting) {
      return
    }

    const selectedCodes = this.selectedRows
      .map(row => (row?.code ?? '').toString().trim().toUpperCase())
      .filter(Boolean)

    const confirmationDialogRef = this.dialog.open(UnsavedChangesModalComponent, {
      width: FRAC_DIALOG_SIZES.unsavedChanges,
      maxWidth: '92vw',
      disableClose: true,
      panelClass: 'unsaved-changes-dialog',
      data: {
        title: 'Confirm Delete',
        message: `Are you sure you want to delete these rows: ${selectedCodes.join(', ')}?`,
        continueLabel: 'Delete',
        cancelLabel: 'Cancel',
      },
    })

    confirmationDialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((action: 'continue' | 'cancel' | undefined) => {
      if (action !== 'continue') {
        return
      }

      const deletePayload = this.selectedRows
        .map(row => FracPayloadBuilder.buildDelete('Position', row, this.getLanguageCode(this.selectedLanguage)))
        .filter(Boolean) as any[]

      if (!deletePayload.length) {
        fracLogger.warn('Remove action ignored because delete payload could not be generated.')
        return
      }

      this.isDeleting = true
      this.fracApiService.deleteEntity(deletePayload).subscribe({
        next: () => {
          this.isDeleting = false
          const deletedCodes = new Set(
            this.selectedRows.map(row => (row?.code ?? '').toString().trim()),
          )
          this.removedData = []
          this.selectedRows = []
          this.isEditing = false
          if (deletedCodes.size) {
            const nextData = (this.tableConfig.data || []).filter(row =>
              !deletedCodes.has((row?.code ?? '').toString().trim()),
            )
            this.tableConfig = { ...this.tableConfig, data: nextData }
            this.originalRowData = (this.originalRowData || []).filter(row =>
              !deletedCodes.has((row?.code ?? '').toString().trim()),
            )
            this.editTracker.captureBaseline(nextData as unknown as FracUploadRow[])
          }

          this.showResultModal({
            type: 'success',
            title: 'Delete Successful',
            message: `${deletePayload.length} position ${deletePayload.length === 1 ? 'record' : 'records'} deleted successfully.`,
            count: deletePayload.length,
          }, true)
        },
        error: (err) => {
          this.isDeleting = false
          fracLogger.error('Position delete failed', err)
          this.showResultModal({
            type: 'error',
            title: 'Delete Failed',
            message:
              err?.error?.params?.errmsg ||
              err?.error?.message ||
              err?.statusText ||
              err?.message ||
              'Failed to delete position.',
            errorDetails: err?.status ? `HTTP Status: ${err.status}` : undefined,
          }, false)
        },
      })
    })
  }



  // ============= FILE OPERATIONS =============

  onDownloadTemplate(): void {
    const languageCode = this.getLanguageCode(this.selectedLanguage)
    const fileUrl = getFracSampleTemplateUrl('position', languageCode)

    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileUrl.split('/').pop() || 'sample_position_en_list.csv'
    link.click()
  }

  openUploadPopup(): void {
    const config = buildFracUploadPopupConfig('position', this.languages, this.selectedLanguage)

    const dialogRef = this.dialog.open(FracUploadPopupComponent, {
      width: FRAC_DIALOG_SIZES.uploadPopup,
      disableClose: true,
      panelClass: 'frac-upload-popup-dialog',
      data: config,
    })

    dialogRef.afterClosed().subscribe((result: UploadPopupResult | undefined) => {
      if (result?.action === 'upload' && result?.file) {
        this.uploadFile(result.file, result.language || this.selectedLanguage)
      }
    })
  }

  uploadFile(file: File, language: string = this.selectedLanguage): void {
    this.selectedLanguage = language
    if (this.isUploading) {
      return
    }

    this.isUploading = true

    this.fracApiService.uploadFile(file, language).subscribe({
      next: async (res) => {
        this.isUploading = false
        const resolvedResponse = await FracResponseParserUtil.resolveApiPayload(res)
        this.apiResponse = resolvedResponse

        const normalizedResponse = FracResponseParserUtil.parseApiResponse(resolvedResponse)
        const resultObject = (normalizedResponse?.result || {}) as Record<string, unknown>
        const uploadedCodes = FracResponseParserUtil.getSuccessCodes(resolvedResponse, 'position')
        if (FracResponseParserUtil.isUploadSuccessful(resolvedResponse, 'position')) {
          const uploadedCount = uploadedCodes.length || Number(resultObject.count || 0) || 1
          const successData: UploadResultData = {
            type: 'success',
            title: 'Upload Successful',
            message: 'Your position data has been uploaded successfully.',
            count: uploadedCount
          }
          this.showResultModal(successData, false, false, FRAC_ROUTES.positionManage)
        } else {
          this.showResultModal(FracUploadHelper.createFailureModalData(resolvedResponse), false)
        }
      },
      error: (err) => {
        this.isUploading = false
        void this.handleUploadError(err)
      },
    })
  }

  private async handleUploadError(err: unknown): Promise<void> {
    const modalData = await FracUploadHelper.resolveErrorToModalData(err)
    this.showResultModal(modalData, false)
  }

  private showResultModal(
    data: UploadResultData,
    refreshOnClose = false,
    redirectOnClose = false,
    redirectToUrl?: string,
  ): void {
    const dialogRef = this.dialog.open(UploadResultModalComponent, {
      width: FRAC_DIALOG_SIZES.uploadResult,
      disableClose: true,
      panelClass: 'upload-result-dialog',
      data: data
    })

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (redirectToUrl && data.type === 'success') {
        this.router.navigateByUrl(redirectToUrl)
        return
      }

      if (redirectOnClose && data.type === 'success') {
        this.router.navigateByUrl(FRAC_ROUTES.homeDashboard)
        return
      }

      if (!refreshOnClose) {
        return
      }
      this.triggerSearch('init')
    })
  }

  onHomeClick(): void {
    if (this.isUpdating) {
      return
    }

    if (!this.hasPendingTableChanges()) {
      this.router.navigateByUrl(FRAC_ROUTES.positionCardGrid)
      return
    }

    const dialogRef = this.dialog.open(UnsavedChangesModalComponent, {
      width: FRAC_DIALOG_SIZES.unsavedChanges,
      maxWidth: '92vw',
      disableClose: true,
      panelClass: 'unsaved-changes-dialog',
      data: {
        title: 'You Have Unsaved Changes',
        message: 'You’re about to return to the home screen. Any unsaved changes will be lost.',
        continueLabel: 'Continue',
        cancelLabel: 'Cancel',
      },
    })

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((action: 'continue' | 'cancel' | undefined) => {
        if (action === 'continue') {
          this.router.navigateByUrl(FRAC_ROUTES.positionCardGrid)
        }
      })
  }

  isFilterControlsDisabled(): boolean {
    return this.isUploading || this.routeMode === 'upload'
  }

  isLanguageDropdownDisabled(): boolean {
    return this.isUploading
  }

  get activeEmptyStateConfig(): UploadEmptyStateConfig {
    return (this.routeMode === 'card' || this.routeMode === 'manage')
      ? this.noResultEmptyStateConfig
      : this.uploadEmptyStateConfig
  }

  shouldShowTableEmptyState(): boolean {
    if (this.isUploading || this.isSearching || this.hasTableData()) {
      return false
    }
    return this.routeMode === 'upload' || this.routeMode === 'manage'
  }

  // ============= MANAGE MODE NAVIGATION =============

  /**
   * Navigates from manage card view back to upload mode.
   */
  goToUploadMode(): void {
    this.router.navigateByUrl(FRAC_ROUTES.positionUpload)
  }

  /**
   * Navigates to the role-like table manage view as a standalone page.
   */
  navigateToListManage(): void {
    this.router.navigateByUrl(FRAC_ROUTES.positionManage)
  }

  /**
   * Opens the hierarchy view dialog for a position card.
   * Reuses the cached raw hierarchy response if available; otherwise fetches from the API.
   * Side effects: opens MatDialog with the full mapping tree.
   * @param position The position card clicked by the user.
   */
  onViewPosition(position: FracUploadRow): void {
    const code = FracPositionHierarchyHelper.normalizeCode(position?.['code'])
    const positionName = (position?.['name'] || position?.['code'] || '').toString()
    const language = this.selectedLanguage
    const cacheKey = this.getHierarchyCacheKey(code, language)
    const rawCached = this.hierarchyRawResponseCache.get(cacheKey)

    if (rawCached) {
      this.openPositionHierarchyDialogFromResponse(positionName, code, rawCached)
      return
    }

    this.fracApiService.searchEntityHierarchy('position', code, language)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const aggregate = FracPositionHierarchyHelper.extractAggregateFromResponse(response)
          this.hierarchyAggregateCache.set(cacheKey, aggregate)
          this.hierarchyRawResponseCache.set(cacheKey, response)
          this.openPositionHierarchyDialogFromResponse(positionName, code, response)
        },
        error: () => {
          this.openPositionHierarchyDialogFromResponse(positionName, code, { result: [] } as any)
        },
      })
  }

  private getHierarchyCacheKey(code: string, language: string): string {
    return `${code}|${this.getLanguageCode(language)}`
  }

  /**
   * Opens PositionHierarchyViewModalComponent using the raw hierarchy API response.
   * @param positionName Display name shown in the dialog header.
   * @param positionCode Entity code for navigation on Edit.
   * @param response Raw FracHierarchyResponse to parse into the tree.
   * Side effects: opens MatDialog.
   */
  private openPositionHierarchyDialogFromResponse(
    positionName: string,
    positionCode: string,
    response: import('../../../models/frac-api.models').FracHierarchyResponse,
  ): void {
    const roles = buildPositionMappingTree(response)

    const dialogData: PositionHierarchyViewModalData = {
      positionName,
      positionCode,
      roles,
      language: this.selectedLanguage,
    }

    this.dialog.open(PositionHierarchyViewModalComponent, {
      width: '860px',
      maxWidth: '96vw',
      maxHeight: '90vh',
      disableClose: false,
      panelClass: 'position-hierarchy-view-dialog',
      data: dialogData,
    })
  }

  onViewEdit(position: Record<string, unknown>): void {
    const code = position?.['code'] as string | undefined
    const queryParams = code ? { positionCode: code } : {}
    this.router.navigate([FRAC_ROUTES.mapRolePosition], { queryParams })
  }

  /**
   * Removes a single position card from the grid by filtering it out of searchResults.
   * Does not call the API — removal is local until a save is triggered.
   * @param position The position card to remove.
   */
  onCardRemove(position: Record<string, unknown>): void {
    this.searchResults = this.searchResults.filter(p => p !== position)
  }

}
