import { Component, OnInit, OnDestroy } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute } from '@angular/router'
import { FracUploadPopupComponent } from '../../../components/frac-upload/frac-upload-popup.component'
import { UploadPopupConfig, UploadPopupResult } from '../../../models/upload-popup-config.model'
import { UploadResultModalComponent, UploadResultData } from '../../../components/upload-result-modal/upload-result-modal.component'
import { ITableConfig, TableTransformUtil } from '../../../utils/table-transform.util'
import { FracApiService } from '../../../services/frac-api.service'
import { transformActivityForUpdate } from '../../../utils/common.util'
import { merge, Subject, Subscription } from 'rxjs'
import { debounceTime, distinctUntilChanged, filter, takeUntil } from 'rxjs/operators'

type SearchSource = 'typing' | 'icon' | 'enter' | 'language' | 'init'

interface SearchTriggerPayload {
  keyword: string
  language: string
  source: SearchSource
}

@Component({
  selector: 'ws-app-activity-upload',
  templateUrl: './activity-upload.component.html',
  styleUrls: ['./activity-upload.component.scss']
})
export class ActivityUploadComponent implements OnInit, OnDestroy {

  constructor(
    private dialog: MatDialog,
    private fracApiService: FracApiService,
    private tableTransformUtil: TableTransformUtil,
    private activatedRoute: ActivatedRoute
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

  // ============= LOADING & API RESPONSE =============
  uploadProgress = 0
  isUploading = false  // ✅ Track loading state for local spinner
  isSearching = false
  apiResponse: any = null  // Store actual API response

  // ============= INTERNAL STATE =============

  private searchTrigger$ = new Subject<SearchTriggerPayload>()
  private searchSubscription: Subscription | null = null
  private destroy$ = new Subject<void>()

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

  // ============= SEARCH & FILTER =============

  /** Trigger search on input change (debounced) */
  onSearchTermChange(): void {
    this.triggerSearch('typing')
  }

  /** Execute search API call */
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
      .searchEntities('activity', keyword, language)
      .subscribe({
        next: (res) => {
          this.isSearching = false
          const entityList = this.extractEntityList(res)
          this.searchResults = entityList
          this.originalRowData = entityList
          this.tableConfig = this.tableTransformUtil.transformResponseToTableConfig(entityList)
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

  // ============= LANGUAGE DROPDOWN =============

  /** Toggle language dropdown visibility */
  toggleDropdown(): void {
    this.isOpen = !this.isOpen
  }

  /** Select language and search immediately */
  selectLanguage(lang: string, event: MouseEvent): void {
    event.stopPropagation()
    this.selectedLanguage = lang
    this.isOpen = false
    this.triggerSearch('language')
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
    this.isEditing = false

    const updatedActivities = transformActivityForUpdate(this.originalRowData, this.selectedRows)
    const payload = { request: updatedActivities }

    this.fracApiService.updateEntity(payload).subscribe({
      next: (res) => console.log('Update successful:', res),
      error: (err) => console.error('Update failed:', err),
    })
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
    const fileUrl = 'https://aastar-app-assets.s3.ap-south-1.amazonaws.com/activity_template.csv'

    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileUrl.split('/').pop() || 'activity_template.csv'
    link.click()
  }

  /** Open upload dialog popup */
  openUploadPopup(): void {
    const config: UploadPopupConfig = {
      title: 'Upload Activity Data',
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
    console.log('⏳ Uploading activity file:', {
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

        if (this.isValidUploadSuccessResponse(res, 'activity')) {
          const uploadedCount = res?.result?.entityCode?.length || res?.result?.count || 1
          const successData: UploadResultData = {
            type: 'success',
            title: 'Upload Successful',
            message: 'Your activity data has been uploaded successfully.',
            count: uploadedCount
          }
          this.showResultModal(successData, true)
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
    const entityType = (normalizedResponse?.result?.entityType || '').toString().toLowerCase()
    const hasEntityCodeList = Array.isArray(normalizedResponse?.result?.entityCode)

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

    return hasSuccessStatus && hasEntityCodeList && entityType === expectedEntityType.toLowerCase()
  }

  private extractAffectedCodes(response: any): string[] {
    const normalizedResponse = this.normalizeUploadResponse(response)
    const entityCodes = normalizedResponse?.result?.entityCode
    if (Array.isArray(entityCodes)) {
      return entityCodes.filter((code: any) => Boolean(code))
    }

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

}
