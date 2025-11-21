import { Component, OnInit, OnDestroy } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute } from '@angular/router'
import { FracUploadPopupComponent } from '../../../components/frac-upload/frac-upload-popup.component'
import { UploadPopupConfig } from '../../../models/upload-popup-config.model'
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
    this.fracApiService.uploadFile(file).subscribe({
      next: (res) => console.log('Upload successful:', res),
      error: (err) => console.error('Upload failed:', err),
    })
  }

  // ============= SAMPLE DATA (Mock Response) =============

  /** Sample API response for demonstration */
  apiResponse = {
    "result": {
      "data": {
        "entity": [
          {
            "type": "role",
            "code": "R1",
            "name": "Provide Antenatal and antepartum services through outreach and at facility",
            "description": "Manages antenatal services delivery",
            "status": "Active",
            "children": []
          },
          {
            "type": "role",
            "code": "R2",
            "name": "Conduct safe institutional delivery and provide Intrapartum care",
            "description": "Manages institutional delivery services",
            "status": "Active",
            "children": []
          },
          {
            "type": "role",
            "code": "R3",
            "name": "Provide Postpartum and postnatal services through outreach and at facility",
            "description": "Manages postpartum services delivery",
            "status": "Active",
            "children": []
          }
        ]
      }
    }
  }
}
