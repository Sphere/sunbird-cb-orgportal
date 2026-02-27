import { Component, OnInit, OnDestroy } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute, Router } from '@angular/router'
import { FracUploadPopupComponent } from '../../../components/frac-upload/frac-upload-popup.component'
import { UploadPopupResult } from '../../../models/upload-popup-config.model'
import { UploadResultModalComponent, UploadResultData } from '../../../components/upload-result-modal/upload-result-modal.component'
import { UnsavedChangesModalComponent } from '../../../components/unsaved-changes-modal/unsaved-changes-modal.component'
import { ITableConfig, TableTransformUtil } from '../../../utils/table-transform.util'
import { FracResponseParserUtil } from '../../../utils/frac-response-parser.util'
import { extractEntityList, sortEntitiesForDisplay, getLanguageCode } from '../../../utils/common.util'
import { fracLogger } from '../../../utils/frac-logger.util'
import { FracApiService } from '../../../services/frac-api.service'
import {
  FracEntityUploadOrchestratorService,
  UploadRouteMode,
  UploadSearchSource,
  UploadSearchTriggerPayload,
} from '../../../services/frac-entity-upload-orchestrator.service'
import { forkJoin, Subject, Subscription } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { FRAC_UI_CONFIG } from '../../../models/ui.config.model'
import { FRAC_DIALOG_SIZES, FRAC_ROUTES, FRAC_UPLOAD_PAGE_SPINNER } from '../../../constants/frac.constants'
import { buildFracUploadPopupConfig, getFracSampleTemplateUrl } from '../../../utils/frac-upload-ui.util'

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

  constructor(
    private dialog: MatDialog,
    private fracApiService: FracApiService,
    private tableTransformUtil: TableTransformUtil,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private uploadOrchestrator: FracEntityUploadOrchestratorService,
  ) { }

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
  originalRowData: any[] = []

  /** Data removed via UI */
  removedData: any[] = []

  /** Table configuration with columns and data */
  tableConfig: ITableConfig = { columns: [], data: [] }

  /** Rows selected in table */
  selectedRows: any[] = []

  // ============= UI STATE =============

  /** Enable/disable edit mode */
  isEditing = false

  /** Button text changes based on mode */
  uploadButtonText: string = 'Upload File'

  /** Search and filter */
  searchTerm = ''
  searchResults: any[] = []

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
  readonly shimmerCardCount = 8
  readonly shimmerCards = Array.from({ length: this.shimmerCardCount })


  // ============= LOADING & API RESPONSE =============
  uploadProgress = 0
  isUploading = false
  isSearching = false
  isUpdating = false
  apiResponse: any = null

  // ============= INTERNAL STATE =============

  private searchTrigger$ = new Subject<UploadSearchTriggerPayload>()
  private searchSubscription: Subscription | null = null
  private destroy$ = new Subject<void>()
  private baselineTableSignature = ''
  private baselineRowSignatureByCode = new Map<string, string>()

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
      this.captureBaselineTableState()
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
    if (this.routeMode !== 'manage') {
      return false
    }
    return this.uploadOrchestrator.computeTableSignature(this.tableConfig.data as Array<Record<string, unknown>>) !== this.baselineTableSignature
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
          const sortedEntityList = sortEntitiesForDisplay(entityList)
          this.searchResults = sortedEntityList
          this.originalRowData = sortedEntityList
          this.tableConfig = this.tableTransformUtil.transformResponseToTableConfig(sortedEntityList)
          this.selectedRows = []
          this.removedData = []
          this.isEditing = false
          this.captureBaselineTableState()
        },
        error: (err) => {
          this.isSearching = false
          fracLogger.error('Position search failed', err)
        }
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

  onSelectionChange(selected: any[]): void {
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

    const changedRows = this.selectedRows.filter(row => this.isRowChanged(row))
    if (!changedRows.length) {
      fracLogger.warn('Save action ignored because no table changes were detected.')
      return
    }

    const payloads = changedRows
      .map(row => this.buildPositionUpdatePayload(row))
      .filter(Boolean) as any[]

    if (!payloads.length) {
      return
    }

    this.isUpdating = true

    forkJoin(payloads.map(payload => this.fracApiService.updateEntity(payload))).subscribe({
      next: () => {
        this.isUpdating = false
        this.isEditing = false
        this.selectedRows = []

        const successData: UploadResultData = {
          type: 'success',
          title: 'Update Successful',
          message: `${changedRows.length} position ${changedRows.length === 1 ? 'record' : 'records'} updated successfully.`,
          count: changedRows.length,
        }
        this.captureBaselineTableState()
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

  private buildPositionUpdatePayload(row: any): any | null {
    if (!row?.code) {
      return null
    }

    const original = this.originalRowData.find(item => item?.code === row.code) || {}
    const languageCode = original?.languageCode || this.getLanguageCode(this.selectedLanguage)

    return {
      entityType: 'Position',
      id: original?.id || row?.id || '',
      code: original?.code || row?.code || '',
      languageCode,
      name: row?.name ?? original?.name ?? '',
    }
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

    this.removedData = [...this.selectedRows]
    this.tableConfig.data = this.tableConfig.data.filter(
      row => !this.selectedRows.includes(row)
    )
    this.selectedRows = []
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
      next: (res) => {
        this.isUploading = false
        this.apiResponse = res

        const normalizedResponse = FracResponseParserUtil.parseApiResponse(res)
        const resultObject = (normalizedResponse?.result || {}) as Record<string, unknown>
        const uploadedCodes = FracResponseParserUtil.getSuccessCodes(res, 'position')
        if (FracResponseParserUtil.isUploadSuccessful(res, 'position')) {
          const uploadedCount = uploadedCodes.length || Number(resultObject.count || 0) || 1
          const successData: UploadResultData = {
            type: 'success',
            title: 'Upload Successful',
            message: 'Your position data has been uploaded successfully.',
            count: uploadedCount
          }
          this.showResultModal(successData, false, false, FRAC_ROUTES.positionManageTable)
        } else {
          this.showResultModal(this.handleFailure(res), false)
        }
      },
      error: (err) => {
        this.isUploading = false
        void this.handleUploadError(err)
      },
    })
  }

  private handleFailure(response: any): UploadResultData {
    const normalizedResponse = FracResponseParserUtil.parseApiResponse(response)
    const apiMessage = FracResponseParserUtil.getRawMessage(normalizedResponse)
    const responseCode = normalizedResponse?.responseCode || normalizedResponse?.code || normalizedResponse?.status
    const paramsStatus = normalizedResponse?.params?.status || normalizedResponse?.statusText
    const affectedCodes = FracResponseParserUtil.getAffectedCodes(normalizedResponse)
    const affectedCodesDetails = affectedCodes.length ? `Affected Codes: ${affectedCodes.join(', ')}` : undefined

    const message = FracResponseParserUtil.isUsefulMessage(apiMessage)
      ? apiMessage!.trim()
      : (affectedCodes.length ? 'Multiple occurrences or duplicates found.' : 'Upload failed. Please verify your file and try again.')

    return {
      type: 'error',
      title: 'Upload Failed',
      message,
      errorDetails: FracResponseParserUtil.formatErrorDetails(responseCode, paramsStatus, affectedCodesDetails),
      resultDetails: FracResponseParserUtil.getStructuredErrorDetails(response)
    }
  }

  private async readUploadError(err: any): Promise<any> {
    return FracResponseParserUtil.readErrorPayload(err)
  }

  private async handleUploadError(err: any): Promise<void> {
    const resolvedPayload = await this.readUploadError(err)

    if (
      resolvedPayload?.params?.errmsg ||
      resolvedPayload?.responseCode ||
      resolvedPayload?.result ||
      resolvedPayload?.message
    ) {
      this.showResultModal(this.handleFailure(resolvedPayload), false)
      return
    }

    const fallbackData: UploadResultData = {
      type: 'error',
      title: 'Upload Failed',
      message: err?.statusText || err?.message || 'An unexpected error occurred while uploading your file.',
      errorDetails: err?.status ? `HTTP Status: ${err.status}` : undefined
    }

    this.showResultModal(fallbackData, false)
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
      this.router.navigateByUrl(FRAC_ROUTES.positionManage)
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
          this.router.navigateByUrl(FRAC_ROUTES.positionManage)
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

  private isRowChanged(row: any): boolean {
    const code = (row?.code ?? '').toString().trim()
    if (!code) {
      return true
    }
    const baselineRowSignature = this.baselineRowSignatureByCode.get(code)
    const currentSignature = this.uploadOrchestrator.getRowSignature(row)
    return baselineRowSignature !== currentSignature
  }

  private captureBaselineTableState(): void {
    const baseline = this.uploadOrchestrator.captureBaselineState(this.tableConfig.data as Array<Record<string, unknown>>)
    this.baselineTableSignature = baseline.tableSignature
    this.baselineRowSignatureByCode = baseline.rowSignatureByCode
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
    this.router.navigateByUrl('/app/frac/position?mode=manage')
  }

  /**
   * Navigates to the role-position mapping page for the selected position.
   * @param position The position card that was clicked.
   */
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
