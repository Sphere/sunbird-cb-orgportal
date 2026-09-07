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
import { FracEditTracker } from '../../../utils/frac-edit-tracker.util'
import { FracUploadRow } from '../../../models/frac-table.models'
import { extractEntityList, sortEntitiesForDisplay } from '../../../utils/common.util'
import { fracLogger } from '../../../utils/frac-logger.util'
import { FracApiService } from '../../../services/frac-api.service'
import {
  FracEntityUploadOrchestratorService,
  UploadRouteMode,
  UploadSearchSource,
  UploadSearchTriggerPayload,
} from '../../../services/frac-entity-upload-orchestrator.service'
import { Subject, Subscription } from 'rxjs'
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
  standalone: false,
  selector: 'ws-app-role-upload',
  templateUrl: './role-upload.component.html',
  styleUrls: ['./role-upload.component.scss']
})
export class RoleUploadComponent implements OnInit, OnDestroy {

  private readonly editTracker: FracEditTracker
  constructor(
    private readonly dialog: MatDialog,
    private readonly fracApiService: FracApiService,
    private readonly tableTransformUtil: TableTransformUtil,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly uploadOrchestrator: FracEntityUploadOrchestratorService,
  ) {
    this.editTracker = new FracEditTracker(this.uploadOrchestrator)
  }

  // ============= UI CONFIG =============
  uiConfig = FRAC_UI_CONFIG

  // ============= ROUTE STATE =============

  /** Route mode: 'upload' or 'manage' */
  routeMode: UploadRouteMode = 'upload'

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
  selectedLanguage = this.uploadOrchestrator.languages[0]?.key || 'en'
  languages = this.uploadOrchestrator.languages
  readonly uploadPageSpinner = FRAC_UPLOAD_PAGE_SPINNER
  isOpen = false
  readonly uploadEmptyStateConfig: UploadEmptyStateConfig = {
    icon: 'upload_file',
    title: 'No file uploaded yet',
    message: 'Upload your role file to preview the records.',
    suggestion: 'Choose a language and download the appropriate sample template.',
  }
  readonly noResultEmptyStateConfig: UploadEmptyStateConfig = {
    icon: 'search_off',
    title: 'No results found',
    message: 'No role records match the selected filters.',
    suggestion: 'Try a different search keyword or language.',
  }

  // ============= LOADING & API RESPONSE =============
  uploadProgress = 0
  isUploading = false  // ✅ Track loading state for local spinner
  isSearching = false
  isUpdating = false
  isDeleting = false
  apiResponse: any = null  // Store actual API response

  // ============= INTERNAL STATE =============

  private readonly searchTrigger$ = new Subject<UploadSearchTriggerPayload>()
  private searchSubscription: Subscription | null = null
  private readonly destroy$ = new Subject<void>()

  // ============= LIFECYCLE =============

  /**
   * Runs once when the page loads. Sets up search listeners and checks the URL to see if we are in upload or manage mode.
   */
  ngOnInit(): void {
    this.uploadOrchestrator.bindSearchTriggerStream(
      this.searchTrigger$,
      this.destroy$,
      (keyword, language) => this.fetchEntitiesForTable(keyword, language),
    )

    // Load route mode and initialize table
    this.activatedRoute.queryParams.subscribe(queryParams => {
      this.routeMode = this.uploadOrchestrator.resolveRouteMode(queryParams['mode'])
      this.updateButtonText()
      this.loadTableDataBasedOnMode()
    })
  }

  /**
   * Cleans up memory and active background tasks when the user leaves this page.
   */
  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe()
    this.destroy$.next()
    this.destroy$.complete()
  }

  // ============= TABLE INITIALIZATION =============

  /** Load table data based on route mode */
  loadTableDataBasedOnMode(): void {
    if (this.routeMode === 'manage') {
      this.triggerSearch('init')
    } else {
      // Upload mode: show empty table
      this.tableConfig = { columns: [], data: [] }
      this.originalRowData = []
      this.selectedRows = []
      this.removedData = []
      this.isEditing = false
      this.editTracker.captureBaseline(this.tableConfig.data as unknown as FracUploadRow[])
    }
  }

  // ============= BUTTON & UI STATE =============

  /** Update upload button text based on route mode */
  updateButtonText(): void {
    this.uploadButtonText = this.uploadOrchestrator.resolveUploadButtonText(this.routeMode)
  }

  /** Check if table has data */
  hasTableData(): boolean {
    return this.tableConfig.data && this.tableConfig.data.length > 0
  }

  /**
   * Checks if the user has made any edits or removed rows that need to be saved.
   */
  hasPendingTableChanges(): boolean {
    if (this.routeMode !== 'manage') {
      return false
    }

    return this.editTracker.hasChanges(this.tableConfig.data as unknown as FracUploadRow[])
  }

  // ============= SEARCH & FILTER =============

  /** Trigger search on input change (debounced) */
  onSearchTermChange(): void {
    if (this.isFilterControlsDisabled()) {
      return
    }
    this.triggerSearch('typing')
  }

  /** Execute search API call */
  onSearch(): void {
    if (this.isFilterControlsDisabled()) {
      return
    }
    this.triggerSearch('icon')
  }

  /**
   * Triggered when the user hits the Enter key in the search box. Searches immediately.
   */
  onSearchEnter(): void {
    if (this.isFilterControlsDisabled()) {
      return
    }
    this.triggerSearch('enter')
  }

  /**
   * Fires a search event to fetch data from the server, either from user typing, clicking search, or changing the language.
   */
  private triggerSearch(source: UploadSearchSource): void {
    this.searchTrigger$.next(this.uploadOrchestrator.buildSearchPayload(this.searchTerm, this.selectedLanguage, source))
  }

  /**
   * Calls the backend API to fetch the list of items (competencies, roles, etc.) and displays them in the table.
   */
  private fetchEntitiesForTable(keyword: string, language: string = this.selectedLanguage): void {
    this.searchSubscription?.unsubscribe()
    this.isSearching = true

    this.searchSubscription = this.fracApiService
      .searchEntities('role', keyword, language)
      .subscribe({
        next: (res) => {
          this.isSearching = false
          const entityList = extractEntityList(res)
          const sortedEntityList = sortEntitiesForDisplay(entityList) as FracUploadRow[]
          this.searchResults = sortedEntityList
          this.originalRowData = sortedEntityList
          this.tableConfig = this.tableTransformUtil.transformResponseToTableConfig(sortedEntityList)
          this.selectedRows = []
          this.removedData = []
          this.isEditing = false
          this.editTracker.captureBaseline(this.tableConfig.data as unknown as FracUploadRow[])
        },
        error: (err) => {
          this.isSearching = false
          fracLogger.error('Role search failed', err)
        }
      })
  }



  // ============= LANGUAGE DROPDOWN =============

  /** Toggle language dropdown visibility */
  toggleDropdown(): void {
    if (this.isLanguageDropdownDisabled()) {
      this.isOpen = false
      return
    }
    this.isOpen = !this.isOpen
  }

  /** Select language; in upload mode this only affects sample download language */
  selectLanguage(lang: { key: string }, event: MouseEvent): void {
    if (this.isLanguageDropdownDisabled()) {
      event.stopPropagation()
      return
    }
    event.stopPropagation()
    this.selectedLanguage = lang.key
    this.isOpen = false

    if (this.routeMode === 'manage') {
      this.triggerSearch('language')
    }
  }

  // ============= TABLE SELECTION =============

  /** Update selected rows from table */
  onSelectionChange(selected: FracUploadRow[]): void {
    this.selectedRows = selected
  }

  // ============= TABLE ACTIONS: EDIT =============

  /** Enable edit mode for selected rows */
  onEditClicked(): void {
    if (this.selectedRows.length === 0) {
      fracLogger.warn('Edit action ignored because no row is selected.')
      return
    }
    this.isEditing = true
  }

  /** Save edited rows */
  onSaveClicked(): void {
    if (!this.selectedRows.length) {
      return
    }

    if (this.isUpdating) {
      return
    }

    const rowsToUpdate = this.selectedRows.map(row => ({ ...row }))
    const changedRows = this.editTracker.getChangedRows(rowsToUpdate)
    if (!changedRows.length) {
      fracLogger.warn('Save action ignored because no table changes were detected.')
      return
    }

    const payloads = changedRows
      .map(row => {
        const original = (this.originalRowData.find(item => item?.code === row.code) || {}) as FracUploadRow
        const languageCode = original?.languageCode || this.selectedLanguage
        return FracPayloadBuilder.buildGenericUpdate('Role', row, original, languageCode)
      })
      .filter(Boolean) as any[]

    if (!payloads.length) {
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
          message: `${changedRows.length} role ${changedRows.length === 1 ? 'record' : 'records'} updated successfully.`,
          count: changedRows.length,
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
            'Failed to update role.',
          errorDetails: err?.status ? `HTTP Status: ${err.status}` : undefined,
        }
        this.showResultModal(failureData, false)
      },
    })
  }




  // ============= TABLE ACTIONS: REMOVE =============

  /** Remove selected rows from table */
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
        .map(row => FracPayloadBuilder.buildDelete('Role', row, this.selectedLanguage))
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
            message: `${deletePayload.length} role ${deletePayload.length === 1 ? 'record' : 'records'} deleted successfully.`,
            count: deletePayload.length,
          }, true)
        },
        error: (err) => {
          this.isDeleting = false
          fracLogger.error('Role delete failed', err)
          this.showResultModal({
            type: 'error',
            title: 'Delete Failed',
            message:
              err?.error?.params?.errmsg ||
              err?.error?.message ||
              err?.statusText ||
              err?.message ||
              'Failed to delete role.',
            errorDetails: err?.status ? `HTTP Status: ${err.status}` : undefined,
          }, false)
        },
      })
    })
  }



  // ============= FILE OPERATIONS =============

  /** Download CSV template for bulk upload */
  onDownloadTemplate(): void {
    const fileUrl = getFracSampleTemplateUrl('role', this.selectedLanguage)

    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileUrl.split('/').pop() || 'sample_role_en_list.csv'
    link.click()
  }

  /** Open upload dialog popup */
  openUploadPopup(): void {
    const config = buildFracUploadPopupConfig('role', this.languages, this.selectedLanguage)

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

  /** Upload file to API */
  uploadFile(file: File, language: string = this.selectedLanguage): void {
    this.selectedLanguage = language
    fracLogger.debug('Starting role upload', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified)
    })

    // ✅ Prevent multiple uploads - check if already uploading
    if (this.isUploading) {
      fracLogger.warn('Upload request ignored because another upload is already running.')
      return
    }

    // ✅ Show local loader
    this.isUploading = true

    // Use actual upload method
    this.fracApiService.uploadFile(file, language).subscribe({
      next: (res) => {
        void (async () => {
        fracLogger.debug('Role upload completed', res)

        // ✅ Hide local loader
        this.isUploading = false

        const resolvedResponse = await FracResponseParserUtil.resolveApiPayload(res)
        // ✅ Store API response globally
        this.apiResponse = resolvedResponse

        const normalizedResponse = FracResponseParserUtil.parseApiResponse(resolvedResponse)
        const resultObject = (normalizedResponse?.result || {}) as Record<string, unknown>
        const uploadedCodes = FracResponseParserUtil.getSuccessCodes(resolvedResponse, 'role')
        if (FracResponseParserUtil.isUploadSuccessful(resolvedResponse, 'role')) {
          const uploadedCount = uploadedCodes.length || Number(resultObject.count || 0) || 1
          const successData: UploadResultData = {
            type: 'success',
            title: 'Upload Successful',
            message: 'Your role data has been uploaded successfully.',
            count: uploadedCount
          }
          this.showResultModal(successData, false, false, FRAC_ROUTES.roleManage)
        } else {
          this.showResultModal(FracUploadHelper.createFailureModalData(resolvedResponse), false)
        }
        })()
      },
      error: (err) => {
        fracLogger.error('Role upload failed', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          error: err.error,
          url: err.url
        })

        // ✅ Hide local loader on error
        this.isUploading = false

        // ✅ Handle error and show modal
        void this.handleUploadError(err)
      },
    })
  }

  /** Handle upload error with appropriate message and show modal */
  private async handleUploadError(err: unknown): Promise<void> {
    const modalData = await FracUploadHelper.resolveErrorToModalData(err)
    this.showResultModal(modalData, false)
  }

  /** Show result modal (success or error) */
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

  /**
   * Handles the user clicking the Home or Back button. Warns them if they have unsaved changes before leaving.
   */
  onHomeClick(): void {
    if (this.isUpdating) {
      return
    }

    if (!this.hasPendingTableChanges()) {
      this.router.navigateByUrl(FRAC_ROUTES.homeDashboard)
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
          this.router.navigateByUrl(FRAC_ROUTES.homeDashboard)
        }
      })
  }

  /**
   * Checks if the search and language filters should be greyed out (disabled) during uploads or saves.
   */
  isFilterControlsDisabled(): boolean {
    return this.isUploading || this.routeMode === 'upload'
  }

  /**
   * Checks if the language dropdown should be greyed out. It is disabled while saving or if there are unsaved changes.
   */
  isLanguageDropdownDisabled(): boolean {
    return this.isUploading
  }

  get activeEmptyStateConfig(): UploadEmptyStateConfig {
    return this.routeMode === 'manage' ? this.noResultEmptyStateConfig : this.uploadEmptyStateConfig
  }

  /**
   * Decides whether to show the "No Data" or "No Results" message instead of the table.
   */
  shouldShowTableEmptyState(): boolean {
    if (this.isUploading || this.isSearching || this.hasTableData()) {
      return false
    }

    return this.routeMode === 'upload' || this.routeMode === 'manage'
  }



}
