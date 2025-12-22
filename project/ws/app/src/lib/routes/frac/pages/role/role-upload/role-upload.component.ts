import { Component, OnInit, OnDestroy } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute } from '@angular/router'
import { FracUploadPopupComponent } from '../../../components/frac-upload/frac-upload-popup.component'
import { UploadPopupConfig } from '../../../models/upload-popup-config.model'
import { UploadResultModalComponent, UploadResultData } from '../../../components/upload-result-modal/upload-result-modal.component'
import { ITableConfig, TableTransformUtil } from '../../../utils/table-transform.util'
import { FracApiService } from '../../../services/frac-api.service'
import { transformActivityForUpdate } from '../../../utils/common.util'
import { Subject } from 'rxjs'
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators'

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
  apiResponse: any = null  // Store actual API response

  // ============= INTERNAL STATE =============

  private searchSubject = new Subject<void>()
  private destroy$ = new Subject<void>()

  // ============= LIFECYCLE =============

  ngOnInit(): void {
    // Load route mode and initialize table
    this.activatedRoute.queryParams.subscribe(queryParams => {
      this.routeMode = queryParams['mode'] || 'upload'
      this.updateButtonText()
      this.loadTableDataBasedOnMode()
    })

    // Set up debounced search (500ms delay)
    this.searchSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.onSearch())
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  // ============= TABLE INITIALIZATION =============

  /** Load table data based on route mode */
  loadTableDataBasedOnMode(): void {
    if (this.routeMode === 'manage') {
      // Manage mode: show existing data
      this.tableConfig = this.tableTransformUtil.transformResponseToTableConfig(this.apiResponse)
      this.originalRowData = this.apiResponse.result.data.entity
    } else {
      // Upload mode: show empty table
      this.tableConfig = this.tableTransformUtil.transformResponseToTableConfig(this.apiResponse)
      this.tableConfig.data = []
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
    this.searchSubject.next()
  }

  /** Execute search API call */
  onSearch(): void {
    const keyword = this.searchTerm.trim()
    if (!keyword) return

    this.fracApiService
      .searchEntities('role', keyword, this.selectedLanguage)
      .subscribe({
        next: (res) => {
          this.searchResults = res?.result?.data?.entity || []
        },
        error: (err) => {
          console.error('Search failed:', err)
        }
      })
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
    this.onSearch()
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

    const updatedRoles = transformActivityForUpdate(this.originalRowData, this.selectedRows)
    const payload = { request: updatedRoles }

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
    const fileUrl = 'https://aastar-app-assets.s3.ap-south-1.amazonaws.com/role_template.csv'

    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileUrl.split('/').pop() || 'role_template.csv'
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

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.action === 'upload' && result?.file) {
        this.uploadFile(result.file)
      }
    })
  }

  /** Upload file to API */
  uploadFile(file: File): void {
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
    this.fracApiService.uploadFile(file).subscribe({
      next: (res) => {
        console.log('✅ Upload successful:', res)

        // ✅ Hide local loader
        this.isUploading = false

        // ✅ Store API response globally
        this.apiResponse = res

        // ✅ Check if response contains valid data
        if (res?.result?.data?.entity && res.result.data.entity.length > 0) {
          // ✅ Transform response and update table
          this.tableConfig = this.tableTransformUtil.transformResponseToTableConfig(this.apiResponse)
          this.originalRowData = res.result.data.entity

          // ✅ Show success modal with upload count
          const uploadedCount = res.result.count || 1
          const successData: UploadResultData = {
            type: 'success',
            title: 'Upload Successful',
            message: 'Your role data has been uploaded successfully.',
            count: uploadedCount
          }
          this.showResultModal(successData)
        } else {
          const warningData: UploadResultData = {
            type: 'error',
            title: 'No Data Found',
            message: 'Upload completed but no entity data was returned from the server.',
            errorDetails: 'Please verify the file format and try again.'
          }
          this.showResultModal(warningData)
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
        this.handleUploadError(err)
      },
    })
  }

  /** Handle upload error with appropriate message and show modal */
  private handleUploadError(err: any): void {
    // ✅ Extract API error details from Sunbird response format
    const apiError = err.error?.params?.err
    const apiErrorMsg = err.error?.params?.errmsg
    const responseCode = err.error?.responseCode

    // 🔍 DEBUG: Log all error details
    console.log('🔍 DEBUG handleUploadError - Full error object:', err)
    console.log('🔍 DEBUG - err.status:', err.status)
    console.log('🔍 DEBUG - err.error:', err.error)
    console.log('🔍 DEBUG - apiError:', apiError)
    console.log('🔍 DEBUG - apiErrorMsg:', apiErrorMsg)
    console.log('🔍 DEBUG - responseCode:', responseCode)

    // ✅ Simple approach: Show generic title with actual API error message
    const errorTitle = 'Something Went Wrong'
    const errorMessage = apiErrorMsg || err.statusText || err.message || 'An unexpected error occurred while uploading your file.'

    // ✅ Build error details
    const errorDetailsParts = []
    if (apiError) errorDetailsParts.push(`Error Code: ${apiError}`)
    if (responseCode) errorDetailsParts.push(`Response Code: ${responseCode}`)
    if (err.status) errorDetailsParts.push(`HTTP Status: ${err.status}`)

    const errorDetails = errorDetailsParts.length > 0 ? errorDetailsParts.join('\n') : undefined

    const errorData: UploadResultData = {
      type: 'error',
      title: errorTitle,
      message: errorMessage,
      errorDetails: errorDetails
    }

    this.showResultModal(errorData)
  }

  /** Show result modal (success or error) */
  private showResultModal(data: UploadResultData): void {
    this.dialog.open(UploadResultModalComponent, {
      width: '400px',
      disableClose: false,
      data: data
    })
  }

}
