import { Component } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute } from '@angular/router'
import { FracUploadPopupComponent } from '../../../components/frac-upload/frac-upload-popup.component'
import { UploadPopupConfig } from '../../../models/upload-popup-config.model'
import { UploadResultModalComponent, UploadResultData } from '../../../components/upload-result-modal/upload-result-modal.component'
import { ITableConfig, TableTransformUtil } from '../../../utils/table-transform.util'
import { FracApiService } from '../../../services/frac-api.service'
import { transformCompetencyForUpdate } from '../../../utils/common.util'
import { Subject } from 'rxjs'
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators'

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
  private searchSubject = new Subject<void>();
  private destroy$ = new Subject<void>();
  searchResults: any[] = [];
  routeMode: string = 'upload';
  uploadButtonText: string = 'Upload File';


  // ============= LOADING & API RESPONSE =============
  uploadProgress = 0
  isUploading = false  // ✅ Track loading state for local spinner
  apiResponse: any = null  // Store actual API response instead of hardcoded data
  // ============= TABLE CONFIGURATION =============
  tableConfig: ITableConfig = { columns: [], data: [] }
  selectedLanguage = 'English'
  searchTerm = ''
  isOpen = false
  languages = ['English', 'Hindi', 'Kannada', 'Tamil', 'English', 'Hindi', 'Kannada', 'Tamil']

  ngOnInit() {
    // Detect route mode from query params and update button text
    this.activatedRoute.queryParams.subscribe(queryParams => {
      console.log('Query params received:', queryParams)
      this.routeMode = queryParams['mode'] || 'upload' // Default to 'upload'
      console.log('Route mode set to:', this.routeMode)
      this.updateButtonText()
      this.loadTableDataBasedOnMode()
    })

    // ✅ Set up reactive debounced search
    this.searchSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.onSearch())
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
      // Show existing data in manage mode
      if (this.apiResponse) {
        this.tableConfig = this.tableTransformUtil.transformResponseToTableConfig(this.apiResponse)
        this.originalRowData = this.apiResponse.result.data.entity
        console.log('Manage mode - Transformed Table Config:', this.tableConfig)
      }
    } else {
      // Show no-data state in upload mode
      this.tableConfig = { columns: [], data: [] }
      this.originalRowData = []
      console.log('Upload mode - Table cleared, ready for file upload')
    }
  }
  /** 🔹 Called when user types */
  onSearchTermChange(): void {
    this.searchSubject.next()
  }

  /** 🔹 Manual search trigger (Enter key / icon click) */
  onSearch(): void {
    const keyword = this.searchTerm.trim()
    if (!keyword) return

    // this.loading = true
    this.fracApiService
      .searchEntities('competency', keyword, this.selectedLanguage)
      .subscribe({
        next: (res) => {
          // this.loading = false
          this.searchResults = res?.result?.data?.entity || []
          console.log('✅ Search results:', this.searchResults)
        },
        error: (err) => {
          // this.loading = false
          console.error('❌ Search failed:', err)
        }
      })
  }

  ngOnDestroy(): void {
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

    // if (this.searchTerm.trim()) {
    this.onSearch() // ✅ triggers instantly on language change
    // }
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
        options: ['English', 'Hindi', 'Kannada', 'English', 'Hindi', 'Kannada'],
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
        console.log('📤 File received from popup:', result.file)
        this.uploadFile(result.file)
      }
    })
  }

  isEditing = false
  selectedRows: any[] = []
  editedData: any[] = []

  onSelectionChange(selected: any[]) {
    this.selectedRows = selected
  }

  onEditClicked() {
    if (this.selectedRows.length === 0) {
      console.warn('⚠️ Please select at least one row to edit.')
      return
    }

    this.isEditing = true
    console.log('✏️ Edit mode enabled for rows:', this.selectedRows)
  }


  onSaveClicked(): void {
    this.isEditing = false
    console.log('💾 Save clicked. Edited Data:', this.selectedRows)
    console.log('🧠 Original Row Data:', this.originalRowData)

    // 🧠 Transform all edited rows into nested structure
    const updatedCompetencies = transformCompetencyForUpdate(this.originalRowData, this.selectedRows)

    console.log('🟢 Updated Competencies (Multiple Rows):', updatedCompetencies)

    // ✅ Send all updated competencies in one go (bulk update)
    const payload = { request: updatedCompetencies }

    this.fracApiService.updateEntity(payload).subscribe({
      next: (res) => console.log('✅ Bulk Update Success:', res),
      error: (err) => console.error('❌ Update Failed:', err),
    })
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
  uploadFile(file: File) {
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
    this.fracApiService.uploadFile(file).subscribe({
      next: (res) => {
        console.log('✅ Upload successful:', res)

        // ✅ Hide local loader
        this.isUploading = false

        // ✅ Store API response in global variable
        this.apiResponse = res

        // ✅ Check if response contains valid data
        if (res?.result?.data?.entity && res.result.data.entity.length > 0) {
          // ✅ Transform response and update table
          this.tableConfig = this.tableTransformUtil.transformResponseToTableConfig(this.apiResponse)
          this.originalRowData = res.result.data.entity

          console.log('✅ Table updated with uploaded data:', {
            rowCount: this.originalRowData.length,
            tableConfig: this.tableConfig
          })

          // ✅ Show success modal with upload count
          const uploadedCount = res.result.count || 1
          const successData: UploadResultData = {
            type: 'success',
            title: 'Upload Successful',
            message: 'Your competency data has been uploaded successfully.',
            count: uploadedCount
          }
          this.showResultModal(successData)
        } else {
          console.warn('⚠️ Upload response received but no entity data found')
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

  /**
   * Check if table has data (not in no-data state)
   * Returns true if table data exists, false if empty
   */
  hasTableData(): boolean {
    return this.tableConfig.data && this.tableConfig.data.length > 0
  }

}
