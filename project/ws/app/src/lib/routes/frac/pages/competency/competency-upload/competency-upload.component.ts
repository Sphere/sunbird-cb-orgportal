import { Component } from '@angular/core'
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
  selector: 'ws-app-competency-upload',
  templateUrl: './competency-upload.component.html',
  styleUrls: ['./competency-upload.component.scss']
})
export class CompetencyUploadComponent {
  constructor(
    private dialog: MatDialog,
    private fracApiService: FracApiService,
    private tableTransformUtil: TableTransformUtil,
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) { }

  // ============= STATE VARIABLES =============
  originalRowData: any[] = [];
  removedData: any[] = [];
  private searchTrigger$ = new Subject<SearchTriggerPayload>();
  private destroy$ = new Subject<void>();
  private searchSubscription: Subscription | null = null;
  private baselineTableSignature = '';
  private baselineRowSignatureByCode = new Map<string, string>();
  searchResults: any[] = [];
  routeMode: string = 'upload';
  uploadButtonText: string = 'Upload File';


  // ============= LOADING & API RESPONSE =============
  uploadProgress = 0
  isUploading = false  // ✅ Track loading state for local spinner
  isSearching = false
  isUpdating = false
  apiResponse: any = null  // Store actual API response instead of hardcoded data
  // ============= TABLE CONFIGURATION =============
  tableConfig: ITableConfig = { columns: [], data: [] }
  selectedLanguage = 'English'
  searchTerm = ''
  isOpen = false
  languages = ['English', 'Hindi', 'Kannada', 'Tamil']
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

  ngOnInit() {
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

    // Detect route mode from query params and update button text
    this.activatedRoute.queryParams.subscribe(queryParams => {
      console.log('Query params received:', queryParams)
      this.routeMode = queryParams['mode'] || 'upload' // Default to 'upload'
      console.log('Route mode set to:', this.routeMode)
      this.updateButtonText()
      this.loadTableDataBasedOnMode()
    })
  }

  /** Update button text based on route mode */
  updateButtonText(): void {
    console.log('updateButtonText called with routeMode:', this.routeMode)
    if (this.routeMode === 'manage') {
      this.uploadButtonText = 'Change File'
    } else {
      this.uploadButtonText = 'Upload File'
    }
    console.log('Button text set to:', this.uploadButtonText)
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
      this.captureBaselineTableState()
      console.log('Upload mode - Table cleared, ready for file upload')
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
      .searchEntities('competency', keyword, language)
      .subscribe({
        next: (res) => {
          this.isSearching = false
          const entityList = this.extractEntityList(res)
          const sortedEntityList = this.sortEntitiesForDisplay(entityList)
          this.searchResults = sortedEntityList
          this.originalRowData = sortedEntityList
          this.tableConfig = this.tableTransformUtil.transformResponseToTableConfig(sortedEntityList)
          this.selectedRows = []
          this.editRows = []
          this.removedData = []
          this.isEditing = false
          this.captureBaselineTableState()
          console.log('Competency table data loaded:', this.tableConfig.data.length)
        },
        error: (err) => {
          this.isSearching = false
          console.error('❌ Search failed:', err)
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

  private isValidUploadSuccessResponse(response: any): boolean {
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

    return hasSuccessStatus && this.getUploadedEntityCodes(normalizedResponse, 'competency').length > 0
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
    return !this.isGenericFailureText(normalized)
  }

  private isGenericFailureText(text: string): boolean {
    const normalized = (text || '').trim().toLowerCase()
    return (
      normalized === 'error' ||
      normalized === 'failed' ||
      normalized === 'bad request' ||
      normalized === 'request failed'
    )
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
      if (this.isGenericFailureText(normalized)) {
        return
      }

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

    // Sometimes backend JSON arrives as string in error body.
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
    // 1) Fast path: normal object / nested object parsing
    const normalizedDirect = this.normalizeUploadResponse(err)
    if (
      normalizedDirect?.params?.errmsg ||
      normalizedDirect?.responseCode ||
      normalizedDirect?.result
    ) {
      return normalizedDirect
    }

    const rawError = err?.error

    // 2) Blob payload (common when backend sends JSON with non-json content-type)
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

    // 3) String body fallback
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

    // 4) Keep best effort normalized object for fallback modal message
    return normalizedDirect
  }

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

  onUploadFile() {
    console.log('Upload File clicked')
    this.openUploadPopup()
  }
  onDownload() {
    console.log('Download sample clicked')
  }
  onEdit() {
    console.log('Edit clicked')
  }
  onRemove() {
    console.log('Remove clicked')
  }

  openUploadPopup() {
    const config: UploadPopupConfig = {
      title: 'Upload Competency Data',
      subText: 'Supported file formats: CSV or XLSX',
      fileSection: {
        dragText: 'Drag & drop a file here',
        uploadButton: 'Upload File',
      },
      dropdown: {
        label: 'Select Language',
        options: ['English', 'Hindi', 'Kannada', 'Tamil'],
        defaultValue: '',
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
        if (!result.language) {
          console.warn('⚠️ Upload blocked: language was not selected in popup.')
          return
        }
        console.log('📤 File received from popup:', result.file)
        this.uploadFile(result.file, result.language)
      }
    })
  }

  isEditing = false
  selectedRows: any[] = []
  editRows: any[] = []
  editedData: any[] = []

  onSelectionChange(selected: any[]) {
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

  onEditClicked() {
    if (this.selectedRows.length === 0) {
      console.warn('⚠️ Please select at least one row to edit.')
      return
    }

    this.editRows = [...this.selectedRows]
    this.isEditing = true
    console.log('✏️ Edit mode enabled for rows:', this.editRows)
  }


  onSaveClicked(): void {
    const rowsToUpdate = this.editRows.length ? this.editRows : this.selectedRows
    if (rowsToUpdate.length === 0) {
      console.warn('⚠️ No editable rows found to save.')
      return
    }

    if (this.isUpdating) {
      return
    }

    const changedRows = rowsToUpdate.filter(row => this.isRowChanged(row))
    if (!changedRows.length) {
      console.warn('⚠️ No changes detected to save.')
      return
    }

    const payloads = changedRows
      .map(row => this.buildCompetencyUpdatePayload(row))
      .filter(Boolean) as any[]

    if (!payloads.length) {
      console.warn('⚠️ No valid payload generated for selected rows.')
      return
    }

    this.isUpdating = true

    forkJoin(payloads.map(payload => this.fracApiService.updateEntity(payload))).subscribe({
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
        this.captureBaselineTableState()
        this.showResultModal(successData, true)
      },
      error: (err) => {
        this.isUpdating = false
        console.error('❌ Update Failed:', err)

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

  private buildCompetencyUpdatePayload(row: any): any | null {
    if (!row?.code) {
      return null
    }

    const original = this.originalRowData.find(item => item?.code === row.code) || {}
    const languageCode = original?.languageCode || this.getLanguageCode(this.selectedLanguage)

    const competencyLevels = this.extractCompetencyLevelsFromRow(row)

    return {
      entityType: 'Competency',
      code: row.code,
      languageCode,
      name: row.name ?? original?.name ?? '',
      description: row.description ?? original?.description ?? '',
      status: original?.status ?? 'Active',
      area: row.area ?? original?.area ?? '',
      type: row.type ?? original?.type ?? '',
      competencyLevels,
    }
  }

  private extractCompetencyLevelsFromRow(row: any): any[] {
    const levelMap: Record<number, { levelNumber: number; levelName: string; levelDescription: string }> = {}

    Object.keys(row || {}).forEach((key) => {
      const match = key.match(/^level_L(\d+)_(label|description)$/)
      if (!match) {
        return
      }

      const levelNumber = Number(match[1])
      const fieldType = match[2]
      if (!Number.isFinite(levelNumber) || levelNumber <= 0) {
        return
      }

      if (!levelMap[levelNumber]) {
        levelMap[levelNumber] = {
          levelNumber,
          levelName: '',
          levelDescription: '',
        }
      }

      const value = (row[key] ?? '').toString().trim()
      if (fieldType === 'label') {
        levelMap[levelNumber].levelName = value
      } else {
        levelMap[levelNumber].levelDescription = value
      }
    })

    return Object.values(levelMap)
      .filter(level => level.levelName || level.levelDescription)
      .sort((a, b) => a.levelNumber - b.levelNumber)
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

  onRemoveClicked() {
    if (this.selectedRows.length === 0) {
      console.warn('⚠️ Please select at least one row to remove.')
      return
    }
    this.removedData = [...this.selectedRows]
    this.tableConfig.data = this.tableConfig.data.filter(
      row => !this.selectedRows.includes(row)
    )
    this.selectedRows = []
    this.editRows = []
    this.isEditing = false
    console.log('🗑️ Removed Rows:', this.removedData)
    console.log('📋 Remaining Data:', this.tableConfig.data)
  }
  onDownloadTemplate() {
    const languageCode = this.getLanguageCode(this.selectedLanguage)
    const fileUrl = languageCode === 'hi'
      ? 'https://aastar-assets.s3.ap-south-1.amazonaws.com/mdo-frac/files/sample_competency_hi_list.csv'
      : 'https://aastar-assets.s3.ap-south-1.amazonaws.com/mdo-frac/files/sample_competency_en_list.csv'

    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileUrl.split('/').pop() || 'sample_competency_en_list.csv'
    link.click()

    console.log('📥 Template downloaded from:', fileUrl)
  }

  /** Handles actual API upload with modal result display */
  uploadFile(file: File, language: string = this.selectedLanguage) {
    this.selectedLanguage = language
    console.log('⏳ Starting file upload:', {
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

        // ✅ Store API response in global variable
        this.apiResponse = res

        // ✅ Validate new upload response contract
        const uploadedCodes = this.getUploadedEntityCodes(res, 'competency')
        if (this.isValidUploadSuccessResponse(res)) {
          const uploadedCount = uploadedCodes.length || res?.result?.count || 0

          this.selectedRows = []
          this.editRows = []
          this.isEditing = false

          const successData: UploadResultData = {
            type: 'success',
            title: 'Upload Successful',
            message: 'Your competency data has been uploaded successfully.',
            count: uploadedCount || 1
          }
          this.showResultModal(successData, false, '/app/frac/competency?mode=manage')
        } else {
          console.warn('⚠️ Upload API returned failure payload:', res)
          this.showResultModal(this.createUploadFailureModalData(res), false)
        }
      },
      error: (err) => {
        console.error('❌ Upload failed:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          error: err.error,
          url: err.url,
          raw: err,
          keys: err ? Object.keys(err) : [],
        })

        // ✅ Hide local loader on error
        this.isUploading = false

        // ✅ Handle error and show modal
        void this.handleUploadError(err)
      },
    })
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
      errorDetails: err?.status ? `HTTP Status: ${err.status}` : undefined,
    }

    this.showResultModal(fallbackData, false)
  }

  /** Show result modal (success or error) */
  private showResultModal(data: UploadResultData, refreshOnClose = false, redirectToUrl?: string): void {
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

  /**
   * Check if table has data (not in no-data state)
   * Returns true if table data exists, false if empty
   */
  hasTableData(): boolean {
    return this.tableConfig.data && this.tableConfig.data.length > 0
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

  hasPendingTableChanges(): boolean {
    if (this.routeMode !== 'manage') {
      return false
    }

    return this.computeTableSignature(this.tableConfig.data) !== this.baselineTableSignature
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
