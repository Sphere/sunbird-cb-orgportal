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
import { FRAC_DIALOG_SIZES, FRAC_ROUTES } from '../../../constants/frac.constants'
import { buildFracUploadPopupConfig, getFracSampleTemplateUrl } from '../../../utils/frac-upload-ui.util'

interface UploadEmptyStateConfig {
  icon: string
  title: string
  message: string
  suggestion: string
}

@Component({
  standalone: false,
  selector: 'ws-app-competency-upload',
  templateUrl: './competency-upload.component.html',
  styleUrls: ['./competency-upload.component.scss']
})
export class CompetencyUploadComponent implements OnInit, OnDestroy {
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

  // ============= STATE VARIABLES =============
  originalRowData: FracUploadRow[] = []
  removedData: FracUploadRow[] = []
  private readonly searchTrigger$ = new Subject<UploadSearchTriggerPayload>()
  private readonly destroy$ = new Subject<void>()
  private searchSubscription: Subscription | null = null
  searchResults: FracUploadRow[] = []
  selectedRows: FracUploadRow[] = []
  editRows: FracUploadRow[] = []
  editedData: FracUploadRow[] = []
  isEditing = false
  routeMode: UploadRouteMode = 'upload'
  uploadButtonText: string = 'Upload File'


  // ============= LOADING & API RESPONSE =============
  uploadProgress = 0
  isUploading = false  // ✅ Track loading state for local spinner
  isSearching = false
  isUpdating = false
  isDeleting = false
  apiResponse: any = null  // Store actual API response instead of hardcoded data
  // ============= TABLE CONFIGURATION =============
  tableConfig: ITableConfig = { columns: [], data: [] }
  selectedLanguage = this.uploadOrchestrator.languages[0]?.key || 'en'
  searchTerm = ''
  isOpen = false
  languages = this.uploadOrchestrator.languages
  readonly uploadEmptyStateConfig: UploadEmptyStateConfig = {
    icon: 'upload_file',
    title: 'No file uploaded yet',
    message: 'Upload your competency file to preview the records.',
    suggestion: 'Choose a language and download the appropriate sample template.',
  }
  readonly noResultEmptyStateConfig: UploadEmptyStateConfig = {
    icon: 'search_off',
    title: 'No results found',
    message: 'No competency records match the selected filters.',
    suggestion: 'Try a different search keyword or language.',
  }

  /**
   * Runs once when the page loads. Sets up search listeners and checks the URL to see if we are in upload or manage mode.
   */
  ngOnInit() {
    this.uploadOrchestrator.bindSearchTriggerStream(
      this.searchTrigger$,
      this.destroy$,
      (keyword, language) => this.fetchEntitiesForTable(keyword, language),
    )

    // Detect route mode from query params and update button text
    this.activatedRoute.queryParams.subscribe(queryParams => {
      this.routeMode = this.uploadOrchestrator.resolveRouteMode(queryParams['mode'])
      this.updateButtonText()
      this.loadTableDataBasedOnMode()
    })
  }

  /** Update button text based on route mode */
  updateButtonText(): void {
    this.uploadButtonText = this.uploadOrchestrator.resolveUploadButtonText(this.routeMode)
  }

  /** Load table data based on route mode */
  loadTableDataBasedOnMode(): void {
    if (this.routeMode === 'manage') {
      this.triggerSearch('init')
    } else {
      // Show no-data state in upload mode
      this.tableConfig = { columns: [], data: [] }
      this.originalRowData = []
      this.selectedRows = []
      this.editRows = []
      this.removedData = []
      this.isEditing = false
      this.editTracker.captureBaseline(this.tableConfig.data as unknown as FracUploadRow[])
    }
  }
  /** 🔹 Called when user types */
  onSearchTermChange(): void {
    if (this.isFilterControlsDisabled()) {
      return
    }
    this.triggerSearch('typing')
  }

  /** 🔹 Manual search trigger (Enter key / icon click) */
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
      .searchEntities('competency', keyword, language)
      .subscribe({
        next: (res) => {
          this.isSearching = false
          const entityList = extractEntityList(res)
          const sortedEntityList = sortEntitiesForDisplay(entityList) as FracUploadRow[]
          this.searchResults = sortedEntityList
          this.originalRowData = sortedEntityList
          this.tableConfig = this.tableTransformUtil.transformResponseToTableConfig(sortedEntityList)
          this.selectedRows = []
          this.editRows = []
          this.removedData = []
          this.isEditing = false
          this.editTracker.captureBaseline(this.tableConfig.data as unknown as FracUploadRow[])
          fracLogger.debug('Competency table data loaded', { count: this.tableConfig.data.length })
        },
        error: (err) => {
          this.isSearching = false
          fracLogger.error('Competency search failed', err)
        }
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

  /** 🔹 Dropdown toggle */
  toggleDropdown(): void {
    if (this.isLanguageDropdownDisabled()) {
      this.isOpen = false
      return
    }
    this.isOpen = !this.isOpen
  }

  /** 🔹 On language selection — in upload mode this only affects sample download language */
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

  onUploadFile() {
    fracLogger.debug('Upload file action clicked')
    this.openUploadPopup()
  }
  onDownload() {
    fracLogger.debug('Download sample action clicked')
  }
  onEdit() {
    fracLogger.debug('Edit action clicked')
  }
  onRemove() {
    fracLogger.debug('Remove action clicked')
  }

  /**
   * Opens the dialog popup where the user can select and upload a CSV or Excel file.
   */
  openUploadPopup() {
    const config = buildFracUploadPopupConfig('competency', this.languages, this.selectedLanguage)

    const dialogRef = this.dialog.open(FracUploadPopupComponent, {
      width: FRAC_DIALOG_SIZES.uploadPopup,
      disableClose: true,
      panelClass: 'frac-upload-popup-dialog',
      data: config,
    })

    dialogRef.afterClosed().subscribe((result: UploadPopupResult | undefined) => {
      if (result?.action === 'upload' && result?.file) {
        fracLogger.debug('Upload file selected from popup', { name: result.file.name, size: result.file.size })
        this.uploadFile(result.file, result.language || this.selectedLanguage)
      }
    })
  }

  onSelectionChange(selected: FracUploadRow[]) {
    this.selectedRows = selected
    if (!this.isEditing) {
      return
    }

    // While editing, only keep rows that remain selected.
    this.editRows = this.editRows.filter(row => this.selectedRows.includes(row))
    if (this.editRows.length === 0) {
      this.isEditing = false
    }
  }

  /**
   * Turns on "edit mode" for the currently selected rows, allowing the user to modify their values directly in the table.
   */
  onEditClicked() {
    if (this.selectedRows.length === 0) {
      fracLogger.warn('Edit action ignored because no row is selected.')
      return
    }

    this.editRows = [...this.selectedRows]
    this.isEditing = true
    fracLogger.debug('Edit mode enabled for selected rows', { count: this.editRows.length })
  }


  /**
   * Takes all the edited rows and sends them to the server to be updated.
   */
  onSaveClicked(): void {
    const rowsToUpdate = this.editRows.length ? this.editRows : this.selectedRows
    if (rowsToUpdate.length === 0) {
      fracLogger.warn('Save action ignored because no editable rows were found.')
      return
    }

    if (this.isUpdating) {
      return
    }

    const changedRows = this.editTracker.getChangedRows(rowsToUpdate)
    if (!changedRows.length) {
      fracLogger.warn('Save action ignored because no table changes were detected.')
      return
    }

    const payloads = changedRows
      .map(row => {
        const original = (this.originalRowData.find(item => item?.code === row.code) || {}) as FracUploadRow
        const languageCode = original?.languageCode || this.selectedLanguage
        return FracPayloadBuilder.buildCompetencyUpdate(row, original, languageCode)
      })
      .filter(Boolean) as any[]

    if (!payloads.length) {
      fracLogger.warn('Save action ignored because update payload could not be generated.')
      return
    }

    this.isUpdating = true

    this.fracApiService.updateEntity(payloads).subscribe({
      next: () => {
        this.isUpdating = false
        this.isEditing = false
        this.editRows = []
        this.selectedRows = []

        const successData: UploadResultData = {
          type: 'success',
          title: 'Update Successful',
          message: `${changedRows.length} competency ${changedRows.length === 1 ? 'record' : 'records'} updated successfully.`,
          count: changedRows.length,
        }
        this.editTracker.captureBaseline(this.tableConfig.data as unknown as FracUploadRow[])
        this.showResultModal(successData, true)
      },
      error: (err) => {
        this.isUpdating = false
        fracLogger.error('Competency update failed', err)

        const failureData: UploadResultData = {
          type: 'error',
          title: 'Update Failed',
          message:
            err?.error?.params?.errmsg ||
            err?.error?.message ||
            err?.statusText ||
            err?.message ||
            'Failed to update competency.',
          errorDetails: err?.status ? `HTTP Status: ${err.status}` : undefined,
        }
        this.showResultModal(failureData, false)
      },
    })
  }


  /**
   * Removes the selected rows from the table view, marking them as deleted so the Save button becomes active.
   */
  onRemoveClicked() {
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
        .map(row => FracPayloadBuilder.buildDelete('Competency', row, this.selectedLanguage))
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
          this.editRows = []
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
            message: `${deletePayload.length} competency ${deletePayload.length === 1 ? 'record' : 'records'} deleted successfully.`,
            count: deletePayload.length,
          }, true)
        },
        error: (err) => {
          this.isDeleting = false
          fracLogger.error('Competency delete failed', err)
          this.showResultModal({
            type: 'error',
            title: 'Delete Failed',
            message:
              err?.error?.params?.errmsg ||
              err?.error?.message ||
              err?.statusText ||
              err?.message ||
              'Failed to delete competency.',
            errorDetails: err?.status ? `HTTP Status: ${err.status}` : undefined,
          }, false)
        },
      })
    })
  }


  /**
   * Downloads the blank sample CSV file that users can fill out to upload new data.
   */
  onDownloadTemplate() {
    const fileUrl = getFracSampleTemplateUrl('competency', this.selectedLanguage)

    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileUrl.split('/').pop() || 'sample_competency_en_list.csv'
    link.click()

    fracLogger.debug('Competency template download triggered', { fileUrl })
  }

  /** Handles actual API upload with modal result display */
  uploadFile(file: File, language: string = this.selectedLanguage) {
    this.selectedLanguage = language
    fracLogger.debug('Starting competency upload', {
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
        fracLogger.debug('Competency upload completed', res)

        this.isUploading = false
        const parsedRes = await FracResponseParserUtil.resolveApiPayload(res)
        this.apiResponse = parsedRes

        const normalizedResponse = FracResponseParserUtil.parseApiResponse(parsedRes)
        const resultObject = (normalizedResponse?.result || {}) as Record<string, unknown>
        const uploadedCodes = FracResponseParserUtil.getSuccessCodes(parsedRes, 'competency')
        if (FracResponseParserUtil.isUploadSuccessful(parsedRes, 'competency')) {
          const uploadedCount = uploadedCodes.length || Number(resultObject.count || 0) || 0

          this.selectedRows = []
          this.editRows = []
          this.isEditing = false

          const successData: UploadResultData = {
            type: 'success',
            title: 'Upload Successful',
            message: 'Your competency data has been uploaded successfully.',
            count: uploadedCount || 1
          }
          this.showResultModal(successData, false, FRAC_ROUTES.competencyManage)
        } else {
          fracLogger.warn('Upload API returned a failure payload', parsedRes)
          this.showResultModal(FracUploadHelper.createFailureModalData(parsedRes), false)
        }
        })()
      },
      error: (err) => {
        fracLogger.error('Competency upload failed', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          error: err.error,
          url: err.url,
          raw: err,
          keys: err ? Object.keys(err) : [],
        })

        this.isUploading = false
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
  private showResultModal(data: UploadResultData, refreshOnClose = false, redirectToUrl?: string): void {
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
   * Check if table has data (not in no-data state)
   * Returns true if table data exists, false if empty
   */
  hasTableData(): boolean {
    return this.tableConfig.data && this.tableConfig.data.length > 0
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

  hasPendingTableChanges(): boolean {
    return this.editTracker.hasChanges(this.tableConfig.data as unknown as FracUploadRow[])
  }

}
