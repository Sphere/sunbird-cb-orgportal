import { Component, OnInit, OnDestroy } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute, Router } from '@angular/router'
import { FracUploadPopupComponent } from '../../../components/frac-upload/frac-upload-popup.component'
import { UploadPopupConfig, UploadPopupResult } from '../../../models/upload-popup-config.model'
import { UploadResultModalComponent, UploadResultData } from '../../../components/upload-result-modal/upload-result-modal.component'
import { UnsavedChangesModalComponent } from '../../../components/unsaved-changes-modal/unsaved-changes-modal.component'
import { ITableConfig, TableTransformUtil } from '../../../utils/table-transform.util'
import { FracApiService } from '../../../services/frac-api.service'
import { forkJoin, merge, Subject, Subscription } from 'rxjs'
import { debounceTime, distinctUntilChanged, filter, takeUntil } from 'rxjs/operators'

type SearchSource = 'typing' | 'icon' | 'enter' | 'language' | 'init'

interface SearchTriggerPayload {
  keyword: string
  language: string
  source: SearchSource
}

interface UploadEmptyStateConfig {
  icon: string
  title: string
  message: string
  suggestion: string
}

@Component({
  selector: 'ws-app-role-upload',
  templateUrl: './role-upload.component.html',
  styleUrls: ['./role-upload.component.scss']
})
export class RoleUploadComponent implements OnInit, OnDestroy {

  constructor(
    private dialog: MatDialog,
    private fracApiService: FracApiService,
    private tableTransformUtil: TableTransformUtil,
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) { }

  // ============= ROUTE STATE =============

  /** Route mode: 'upload' or 'manage' */
  routeMode: string = 'upload'

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
  selectedLanguage = 'English'
  languages = ['English', 'Hindi', 'Kannada', 'Tamil']
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
  apiResponse: any = null  // Store actual API response

  // ============= INTERNAL STATE =============

  private searchTrigger$ = new Subject<SearchTriggerPayload>()
  private searchSubscription: Subscription | null = null
  private destroy$ = new Subject<void>()
  private baselineTableSignature = ''
  private baselineRowSignatureByCode = new Map<string, string>()

  // ============= LIFECYCLE =============

  ngOnInit(): void {
    const debouncedTypingSearch$ = this.searchTrigger$.pipe(
      filter(payload => payload.source === 'typing'),
      debounceTime(500),
      distinctUntilChanged((previous, current) =>
        previous.keyword === current.keyword && previous.language === current.language
      )
    )

    const immediateSearch$ = this.searchTrigger$.pipe(
      filter(payload => payload.source !== 'typing')
    )

    merge(debouncedTypingSearch$, immediateSearch$)
      .pipe(takeUntil(this.destroy$))
      .subscribe(payload => this.fetchEntitiesForTable(payload.keyword, payload.language))

    // Load route mode and initialize table
    this.activatedRoute.queryParams.subscribe(queryParams => {
      this.routeMode = queryParams['mode'] || 'upload'
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
      this.captureBaselineTableState()
    }
  }

  // ============= BUTTON & UI STATE =============

  /** Update upload button text based on route mode */
  updateButtonText(): void {
    this.uploadButtonText = this.routeMode === 'manage' ? 'Change File' : 'Upload File'
  }

  /** Check if table has data */
  hasTableData(): boolean {
    return this.tableConfig.data && this.tableConfig.data.length > 0
  }

  hasPendingTableChanges(): boolean {
    if (this.routeMode !== 'manage') {
      return false
    }

    return this.computeTableSignature(this.tableConfig.data) !== this.baselineTableSignature
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

  onSearchEnter(): void {
    if (this.isFilterControlsDisabled()) {
      return
    }
    this.triggerSearch('enter')
  }

  private triggerSearch(source: SearchSource): void {
    const payload: SearchTriggerPayload = {
      keyword: this.searchTerm.trim(),
      language: this.selectedLanguage,
      source,
    }
    this.searchTrigger$.next(payload)
  }

  private fetchEntitiesForTable(keyword: string, language: string = this.selectedLanguage): void {
    this.searchSubscription?.unsubscribe()
    this.isSearching = true

    this.searchSubscription = this.fracApiService
      .searchEntities('role', keyword, language)
      .subscribe({
        next: (res) => {
          this.isSearching = false
          const entityList = this.extractEntityList(res)
          const sortedEntityList = this.sortEntitiesForDisplay(entityList)
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
          console.error('Search failed:', err)
        }
      })
  }

  private extractEntityList(response: any): any[] {
    if (!response) return []
    if (Array.isArray(response)) return response

    const entityList =
      response?.result?.entity ||
      response?.result?.data?.entity ||
      response?.data?.entity ||
      response?.entity

    return Array.isArray(entityList) ? entityList : []
  }

  private sortEntitiesForDisplay(entities: any[]): any[] {
    return [...(entities || [])].sort((left: any, right: any) => {
      const leftCode = this.normalizeSortValue(left?.code || left?.additionalProperties?.Code)
      const rightCode = this.normalizeSortValue(right?.code || right?.additionalProperties?.Code)
      const codeComparison = this.compareSortValues(leftCode, rightCode)
      if (codeComparison !== 0) {
        return codeComparison
      }

      const leftName = this.normalizeSortValue(left?.name || left?.title)
      const rightName = this.normalizeSortValue(right?.name || right?.title)
      return this.compareSortValues(leftName, rightName)
    })
  }

  private normalizeSortValue(value: unknown): string {
    return (value ?? '').toString().trim()
  }

  private compareSortValues(left: string, right: string): number {
    return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' })
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
  selectLanguage(lang: string, event: MouseEvent): void {
    if (this.isLanguageDropdownDisabled()) {
      event.stopPropagation()
      return
    }
    event.stopPropagation()
    this.selectedLanguage = lang
    this.isOpen = false

    if (this.routeMode === 'manage') {
      this.triggerSearch('language')
    }
  }

  // ============= TABLE SELECTION =============

  /** Update selected rows from table */
  onSelectionChange(selected: any[]): void {
    this.selectedRows = selected
  }

  // ============= TABLE ACTIONS: EDIT =============

  /** Enable edit mode for selected rows */
  onEditClicked(): void {
    if (this.selectedRows.length === 0) {
      console.warn('Please select at least one row to edit.')
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

    const changedRows = this.selectedRows.filter(row => this.isRowChanged(row))
    if (!changedRows.length) {
      console.warn('No changes detected to save.')
      return
    }

    const payloads = changedRows
      .map(row => this.buildRoleUpdatePayload(row))
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
          message: `${changedRows.length} role ${changedRows.length === 1 ? 'record' : 'records'} updated successfully.`,
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
            'Failed to update role.',
          errorDetails: err?.status ? `HTTP Status: ${err.status}` : undefined,
        }
        this.showResultModal(failureData, false)
      },
    })
  }

  private buildRoleUpdatePayload(row: any): any | null {
    if (!row?.code) {
      return null
    }

    const original = this.originalRowData.find(item => item?.code === row.code) || {}
    const languageCode = original?.languageCode || this.getLanguageCode(this.selectedLanguage)

    return {
      entityType: 'Role',
      id: original?.id || row?.id || '',
      code: original?.code || row?.code || '',
      languageCode,
      name: row?.name ?? original?.name ?? '',
    }
  }

  private getLanguageCode(language: string): string {
    const normalized = (language || '').trim().toLowerCase()
    const languageMap: Record<string, string> = {
      english: 'en',
      hindi: 'hi',
      kannada: 'kn',
      tamil: 'ta',
    }

    return languageMap[normalized] || 'en'
  }

  // ============= TABLE ACTIONS: REMOVE =============

  /** Remove selected rows from table */
  onRemoveClicked(): void {
    if (this.selectedRows.length === 0) {
      console.warn('Please select at least one row to remove.')
      return
    }

    this.removedData = [...this.selectedRows]
    this.tableConfig.data = this.tableConfig.data.filter(
      row => !this.selectedRows.includes(row)
    )
    this.selectedRows = []
  }

  // ============= FILE OPERATIONS =============

  /** Download CSV template for bulk upload */
  onDownloadTemplate(): void {
    const languageCode = this.getLanguageCode(this.selectedLanguage)
    const fileUrl = languageCode === 'hi'
      ? 'https://aastar-assets.s3.ap-south-1.amazonaws.com/mdo-frac/files/sample_role_hi_list.csv'
      : 'https://aastar-assets.s3.ap-south-1.amazonaws.com/mdo-frac/files/sample_role_en_list.csv'

    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileUrl.split('/').pop() || 'sample_role_en_list.csv'
    link.click()
  }

  /** Open upload dialog popup */
  openUploadPopup(): void {
    const config: UploadPopupConfig = {
      title: 'Upload Roles Data',
      subText: 'Supported file format: CSV or JSON',
      fileSection: {
        dragText: 'Drag & drop a file here',
        uploadButton: 'Upload File',
      },
      dropdown: {
        label: 'Select Language',
        options: ['English', 'Hindi', 'Kannada', 'Tamil'],
        defaultValue: this.selectedLanguage,
      },
      actions: {
        secondary: { label: 'Cancel' },
        primary: { label: 'Confirm & Upload', disabled: false },
      },
    }

    const dialogRef = this.dialog.open(FracUploadPopupComponent, {
      width: '450px',
      disableClose: true,
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
    console.log('⏳ Uploading role file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified)
    })

    // ✅ Prevent multiple uploads - check if already uploading
    if (this.isUploading) {
      console.warn('⚠️ Upload already in progress, ignoring duplicate request')
      return
    }

    // ✅ Show local loader
    this.isUploading = true

    // Use actual upload method
    this.fracApiService.uploadFile(file, language).subscribe({
      next: (res) => {
        console.log('✅ Upload successful:', res)

        // ✅ Hide local loader
        this.isUploading = false

        // ✅ Store API response globally
        this.apiResponse = res

        const uploadedCodes = this.getUploadedEntityCodes(res, 'role')
        if (this.isValidUploadSuccessResponse(res, 'role')) {
          const uploadedCount = uploadedCodes.length || res?.result?.count || 1
          const successData: UploadResultData = {
            type: 'success',
            title: 'Upload Successful',
            message: 'Your role data has been uploaded successfully.',
            count: uploadedCount
          }
          this.showResultModal(successData, false, false, '/app/frac/role?mode=manage')
        } else {
          this.showResultModal(this.createUploadFailureModalData(res), false)
        }
      },
      error: (err) => {
        console.error('❌ Upload failed:', {
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

  private isValidUploadSuccessResponse(response: any, expectedEntityType: string): boolean {
    const normalizedResponse = this.normalizeUploadResponse(response)
    const responseCode = (normalizedResponse?.responseCode || '').toString().toLowerCase()
    const paramsStatus = (normalizedResponse?.params?.status || '').toString().toLowerCase()

    const hasSuccessStatus =
      responseCode === 'ok' ||
      responseCode === '200 ok' ||
      responseCode === 'created' ||
      responseCode === '201 created' ||
      paramsStatus === 'success' ||
      paramsStatus === 'ok' ||
      paramsStatus === '200 ok' ||
      paramsStatus === 'created' ||
      paramsStatus === '201 created'

    return hasSuccessStatus && this.getUploadedEntityCodes(normalizedResponse, expectedEntityType).length > 0
  }

  private extractAffectedCodes(response: any): string[] {
    const normalizedResponse = this.normalizeUploadResponse(response)
    const uploadedCodes = this.getUploadedEntityCodes(normalizedResponse)
    if (uploadedCodes.length) {
      return uploadedCodes
    }

    const entries = Array.isArray(normalizedResponse?.result) ? normalizedResponse.result : []
    return entries
      .map((item: any) => item?.code)
      .filter((code: any) => Boolean(code))
  }

  private getUploadedEntityCodes(response: any, expectedEntityType?: string): string[] {
    const normalizedResponse = this.normalizeUploadResponse(response)
    const entityBlocks = this.getUploadEntityBlocks(normalizedResponse)
    const expectedType = (expectedEntityType || '').toLowerCase()
    const collectedCodes: string[] = []

    entityBlocks.forEach((item: any) => {
      const entityType = (item?.entityType || '').toString().toLowerCase()
      if (expectedType && entityType !== expectedType) {
        return
      }

      const entityCodes = Array.isArray(item?.entityCode) ? item.entityCode : []
      entityCodes.forEach((code: any) => {
        const normalizedCode = (code ?? '').toString().trim()
        if (normalizedCode) {
          collectedCodes.push(normalizedCode)
        }
      })
    })

    return collectedCodes
  }

  private getUploadEntityBlocks(response: any): any[] {
    const legacyEntityType = response?.result?.entityType
    const legacyEntityCodes = Array.isArray(response?.result?.entityCode) ? response.result.entityCode : []
    const entityList = Array.isArray(response?.result?.entity) ? response.result.entity : []
    const blocks: any[] = [...entityList]

    if (legacyEntityType || legacyEntityCodes.length) {
      blocks.push({
        entityType: legacyEntityType,
        entityCode: legacyEntityCodes,
      })
    }

    return blocks
  }

  private isMeaningfulApiMessage(message: string | undefined): boolean {
    const normalized = (message || '').trim().toLowerCase()
    if (!normalized) {
      return false
    }
    return normalized !== 'error' && normalized !== 'failed'
  }

  private createUploadFailureModalData(response: any): UploadResultData {
    const normalizedResponse = this.normalizeUploadResponse(response)
    const apiMessage =
      (normalizedResponse?.params?.errmsg as string | undefined) ||
      normalizedResponse?.errmsg ||
      normalizedResponse?.message ||
      normalizedResponse?.error_description
    const responseCode =
      normalizedResponse?.responseCode ||
      normalizedResponse?.code ||
      normalizedResponse?.status
    const paramsStatus =
      normalizedResponse?.params?.status ||
      normalizedResponse?.statusText
    const affectedCodes = this.extractAffectedCodes(normalizedResponse)
    const affectedCodesDetails = affectedCodes.length
      ? `Affected Codes: ${affectedCodes.join(', ')}`
      : undefined

    const message = this.isMeaningfulApiMessage(apiMessage)
      ? apiMessage!.trim()
      : (affectedCodes.length ? 'Duplicate entry found.' : 'Upload failed. Please verify your file and try again.')

    return {
      type: 'error',
      title: 'Upload Failed',
      message,
      errorDetails: this.buildErrorDetails(responseCode, paramsStatus, affectedCodesDetails),
    }
  }

  private buildErrorDetails(responseCode: unknown, paramsStatus: unknown, affectedCodesDetails?: string): string | undefined {
    const uniqueDetails: string[] = []
    const seen = new Set<string>()

    const appendIfUnique = (value: unknown): void => {
      const detail = (value ?? '').toString().trim()
      if (!detail) {
        return
      }

      const normalized = detail.toLowerCase()
      if (seen.has(normalized)) {
        return
      }

      seen.add(normalized)
      uniqueDetails.push(detail)
    }

    appendIfUnique(responseCode)
    appendIfUnique(paramsStatus)
    appendIfUnique(affectedCodesDetails)

    return uniqueDetails.length ? uniqueDetails.join('\n') : undefined
  }

  private normalizeUploadResponse(response: any): any {
    if (!response) {
      return null
    }

    if (typeof response === 'string') {
      try {
        return JSON.parse(response)
      } catch {
        return { params: { errmsg: response } }
      }
    }

    if (Array.isArray(response)) {
      return { result: response }
    }

    if (typeof response !== 'object') {
      return { params: { errmsg: String(response) } }
    }

    const looksLikeUploadPayload =
      Boolean(response?.params?.errmsg) ||
      Boolean(response?.responseCode) ||
      Boolean(response?.result?.entityCode) ||
      Array.isArray(response?.result?.entity) ||
      Array.isArray(response?.result)

    if (looksLikeUploadPayload) {
      return response
    }

    const nestedCandidates = [
      response.error,
      response.body,
      response.data,
      response.response,
      response.rejection,
      response.payload,
      response.text,
    ]

    for (const candidate of nestedCandidates) {
      if (!candidate) continue
      const normalizedCandidate = this.normalizeUploadResponse(candidate)
      if (
        normalizedCandidate?.params?.errmsg ||
        normalizedCandidate?.responseCode ||
        normalizedCandidate?.result?.entityCode ||
        Array.isArray(normalizedCandidate?.result?.entity) ||
        Array.isArray(normalizedCandidate?.result)
      ) {
        return normalizedCandidate
      }
    }

    return response
  }

  private async resolveUploadErrorPayload(err: any): Promise<any> {
    const normalizedDirect = this.normalizeUploadResponse(err)
    if (
      normalizedDirect?.params?.errmsg ||
      normalizedDirect?.responseCode ||
      normalizedDirect?.result ||
      normalizedDirect?.message
    ) {
      return normalizedDirect
    }

    const rawError = err?.error

    if (rawError instanceof Blob) {
      try {
        const text = await rawError.text()
        const normalizedFromBlob = this.normalizeUploadResponse(text)
        if (
          normalizedFromBlob?.params?.errmsg ||
          normalizedFromBlob?.responseCode ||
          normalizedFromBlob?.result
        ) {
          return normalizedFromBlob
        }
      } catch {
        // Fall back below.
      }
    }

    if (typeof rawError === 'string') {
      const normalizedFromString = this.normalizeUploadResponse(rawError)
      if (
        normalizedFromString?.params?.errmsg ||
        normalizedFromString?.responseCode ||
        normalizedFromString?.result
      ) {
        return normalizedFromString
      }
    }

    return normalizedDirect
  }

  /** Handle upload error with appropriate message and show modal */
  private async handleUploadError(err: any): Promise<void> {
    const resolvedPayload = await this.resolveUploadErrorPayload(err)

    if (
      resolvedPayload?.params?.errmsg ||
      resolvedPayload?.responseCode ||
      resolvedPayload?.result ||
      resolvedPayload?.message
    ) {
      this.showResultModal(this.createUploadFailureModalData(resolvedPayload), false)
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

  /** Show result modal (success or error) */
  private showResultModal(
    data: UploadResultData,
    refreshOnClose = false,
    redirectOnClose = false,
    redirectToUrl?: string,
  ): void {
    const dialogRef = this.dialog.open(UploadResultModalComponent, {
      width: '400px',
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
        this.router.navigateByUrl('/app/home/frac/dashboard')
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
      this.router.navigateByUrl('/app/home/frac/dashboard')
      return
    }

    const dialogRef = this.dialog.open(UnsavedChangesModalComponent, {
      width: '363px',
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
          this.router.navigateByUrl('/app/home/frac/dashboard')
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
    return this.routeMode === 'manage' ? this.noResultEmptyStateConfig : this.uploadEmptyStateConfig
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
    const currentSignature = this.getRowSignature(row)
    return baselineRowSignature !== currentSignature
  }

  private captureBaselineTableState(): void {
    const rows = this.tableConfig?.data || []
    this.baselineTableSignature = this.computeTableSignature(rows)
    this.baselineRowSignatureByCode = new Map<string, string>()

    rows.forEach((row) => {
      const code = (row?.code ?? '').toString().trim()
      if (!code) {
        return
      }
      this.baselineRowSignatureByCode.set(code, this.getRowSignature(row))
    })
  }

  private computeTableSignature(rows: any[]): string {
    return (rows || [])
      .map((row) => this.getRowSignature(row))
      .sort()
      .join('||')
  }

  private getRowSignature(row: any): string {
    const normalized: Record<string, string> = {}
    const keys = Object.keys(row || {}).sort()

    keys.forEach((key) => {
      normalized[key] = (row?.[key] ?? '').toString()
    })

    return JSON.stringify(normalized)
  }

}
