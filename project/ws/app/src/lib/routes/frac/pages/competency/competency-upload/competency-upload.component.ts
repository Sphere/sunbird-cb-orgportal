import { Component } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute } from '@angular/router'
import { FracUploadPopupComponent } from '../../../components/frac-upload/frac-upload-popup.component'
import { UploadPopupConfig, UploadPopupResult } from '../../../models/upload-popup-config.model'
import { UploadResultModalComponent, UploadResultData } from '../../../components/upload-result-modal/upload-result-modal.component'
import { ITableConfig, TableTransformUtil } from '../../../utils/table-transform.util'
import { FracApiService } from '../../../services/frac-api.service'
import { transformCompetencyForUpdate } from '../../../utils/common.util'
import { merge, Subject, Subscription } from 'rxjs'
import { debounceTime, distinctUntilChanged, filter, takeUntil } from 'rxjs/operators'

type SearchSource = 'typing' | 'icon' | 'enter' | 'language' | 'init'

interface SearchTriggerPayload {
  keyword: string
  language: string
  source: SearchSource
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
    private activatedRoute: ActivatedRoute
  ) { }

  // ============= STATE VARIABLES =============
  originalRowData: any[] = [];
  removedData: any[] = [];
  private searchTrigger$ = new Subject<SearchTriggerPayload>();
  private destroy$ = new Subject<void>();
  private searchSubscription: Subscription | null = null;
  searchResults: any[] = [];
  routeMode: string = 'upload';
  uploadButtonText: string = 'Upload File';


  // ============= LOADING & API RESPONSE =============
  uploadProgress = 0
  isUploading = false  // ✅ Track loading state for local spinner
  isSearching = false
  apiResponse: any = null  // Store actual API response instead of hardcoded data
  // ============= TABLE CONFIGURATION =============
  tableConfig: ITableConfig = { columns: [], data: [] }
  selectedLanguage = 'English'
  searchTerm = ''
  isOpen = false
  languages = ['English', 'Hindi', 'Kannada', 'Tamil']

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
      console.log('Upload mode - Table cleared, ready for file upload')
    }
  }
  /** 🔹 Called when user types */
  onSearchTermChange(): void {
    this.triggerSearch('typing')
  }

  /** 🔹 Manual search trigger (Enter key / icon click) */
  onSearch(): void {
    this.triggerSearch('icon')
  }

  onSearchEnter(): void {
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
          this.searchResults = entityList
          this.originalRowData = entityList
          this.tableConfig = this.tableTransformUtil.transformResponseToTableConfig(entityList)
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

    return Boolean(
      hasSuccessStatus &&
      normalizedResponse?.result?.entityType?.toLowerCase() === 'competency' &&
      Array.isArray(normalizedResponse?.result?.entityCode)
    )
  }

  private extractAffectedCodes(response: any): string[] {
    const normalizedResponse = this.normalizeUploadResponse(response)
    const entries = Array.isArray(normalizedResponse?.result) ? normalizedResponse.result : []
    return entries
      .map((item: any) => item?.code)
      .filter((code: any) => Boolean(code))
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

    const detailsParts = [responseCode, paramsStatus, affectedCodesDetails].filter(Boolean)
    const message = this.isMeaningfulApiMessage(apiMessage)
      ? apiMessage!.trim()
      : (affectedCodes.length ? 'Duplicate entry found.' : 'Upload failed. Please verify your file and try again.')

    return {
      type: 'error',
      title: 'Upload Failed',
      message,
      errorDetails: detailsParts.length ? detailsParts.join('\n') : undefined,
    }
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
    this.isOpen = !this.isOpen
  }

  /** 🔹 On language selection — search immediately */
  selectLanguage(lang: string, event: MouseEvent): void {
    event.stopPropagation()
    this.selectedLanguage = lang
    this.isOpen = false
    this.triggerSearch('language')
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

    this.isEditing = false
    console.log('💾 Save clicked. Edited Data:', rowsToUpdate)
    console.log('🧠 Original Row Data:', this.originalRowData)

    // 🧠 Transform all edited rows into nested structure
    const updatedCompetencies = transformCompetencyForUpdate(this.originalRowData, rowsToUpdate)

    console.log('🟢 Updated Competencies (Multiple Rows):', updatedCompetencies)

    // ✅ Send all updated competencies in one go (bulk update)
    const payload = { request: updatedCompetencies }

    this.fracApiService.updateEntity(payload).subscribe({
      next: (res) => console.log('✅ Bulk Update Success:', res),
      error: (err) => console.error('❌ Update Failed:', err),
    })

    this.editRows = []
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
    // 🔹 Option 1: If the file is stored locally in assets folder
    // const fileUrl = '/assets/frac/temp.csv' // or .csv

    // 🔹 Option 2: If the file is hosted on S3, use the S3 public URL instead
    const fileUrl = 'https://aastar-app-assets.s3.ap-south-1.amazonaws.com/final_single_row_questions.xlsx'

    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileUrl.split('/').pop() || 'template.xlsx'
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
        if (this.isValidUploadSuccessResponse(res)) {
          const uploadedCount = res?.result?.entityCode?.length || 0

          this.selectedRows = []
          this.editRows = []
          this.isEditing = false

          const successData: UploadResultData = {
            type: 'success',
            title: 'Upload Successful',
            message: 'Your competency data has been uploaded successfully.',
            count: uploadedCount || 1
          }
          this.showResultModal(successData, true)
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
  private showResultModal(data: UploadResultData, refreshOnClose = false): void {
    const dialogRef = this.dialog.open(UploadResultModalComponent, {
      width: '400px',
      disableClose: true,
      panelClass: 'upload-result-dialog',
      data: data
    })

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (!refreshOnClose) {
        return
      }

      this.triggerSearch('icon')
    })
  }

  /**
   * Check if table has data (not in no-data state)
   * Returns true if table data exists, false if empty
   */
  hasTableData(): boolean {
    return this.tableConfig.data && this.tableConfig.data.length > 0
  }

}
