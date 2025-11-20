import { Component } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute } from '@angular/router'
import { FracUploadPopupComponent } from '../../../components/frac-upload/frac-upload-popup.component'
import { UploadPopupConfig } from '../../../models/upload-popup-config.model'
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

  constructor(private dialog: MatDialog, private fracApiService: FracApiService, private tableTransformUtil: TableTransformUtil, private activatedRoute: ActivatedRoute) { }
  originalRowData: any[] = [];
  removedData: any[] = [];
  private searchSubject = new Subject<void>();
  private destroy$ = new Subject<void>();
  searchResults: any[] = [];
  routeMode: string = 'upload'; // 'upload' or 'manage'
  uploadButtonText: string = 'Upload File';
  // Table configuration
  // tableConfig = {
  //   columns: [
  //     { key: 'code', label: 'Code' },
  //     { key: 'label', label: 'Label' },
  //     { key: 'description', label: 'Description' },
  //     { key: 'domain', label: 'Domain' },
  //     { key: 'level1', label: 'Level 1' },
  //     { key: 'level2', label: 'Level 2' },
  //   ],
  //   data: [
  //     // {
  //     //   code: 'C1',
  //     //   label: 'Pregnancy Identification',
  //     //   description: 'Conducts initial assessment to identify pregnancy and HRP',
  //     //   domain: 'Community Outreach',
  //     //   level1: 'Understands health assessment protocols',
  //     //   level2: 'Identifies pregnancy using kits',
  //     // },
  //     // {
  //     //   code: 'C2',
  //     //   label: 'Birth Planning',
  //     //   description: 'Creates and implements birth plans for PW including HRP',
  //     //   domain: 'Community Outreach',
  //     //   level1: 'Understands registration components',
  //     //   level2: 'Prepares schedules for PW/HRP',
  //     // },

  //     {
  //       "id": 106,
  //       "type": "activity",
  //       "name": "Verify maternal and child death and ensure reporting (MCDR)",
  //       "description": "Verify maternal and child death and ensure reporting",
  //       "additionalProperties": {
  //         "Code": "A400"
  //       },
  //       "status": "Active",
  //       "source": null,
  //       "level": "A400",
  //       "levelId": 0,
  //       "createdDate": "2025-10-06T18:30:00.000+00:00",
  //       "createdBy": "admin",
  //       "updatedDate": "2025-10-06T18:30:00.000+00:00",
  //       "updatedBy": "reviewer",
  //       "reviewedDate": "2025-10-06T18:30:00.000+00:00",
  //       "reviewedBy": "2025-10-07 00:00:00",
  //       "translation": null,
  //       "code": "A400",
  //       "children": null
  //     }
  //   ],
  // }
  tableConfig: ITableConfig = { columns: [], data: [] };
  apiResponse = {
    "result": {
      "data": {
        "entity": [
          {
            "type": "competency",
            "code": "C400",
            "name": "Pregnancy Identification",
            "description": "Conducts initial assessment to identify pregnancy, HRP, and estimate gestational age",
            "status": "Active",
            "children": [

            ]
          },
          // {
          //   "type": "competency",
          //   "code": "C401",
          //   "name": "Pregnancy Identification",
          //   "description": "Conducts initial assessment to identify pregnancy, HRP, and estimate gestational age",
          //   "status": "Active",
          //   "children": [
          //     {
          //       "level": "L1",
          //       "name": "Understands health of males and females",
          //       "description": "Understands male and female reproductive anatomy"
          //     },
          //     {
          //       "level": "L2",
          //       "name": "Identifies pregnancy using Nischaya Kit",
          //       "description": "Conducts pregnancy test using kit and interprets results"
          //     },
          //     {
          //       "level": "L3",
          //       "name": "Identifies pregnancy using Nischaya Kit 3",
          //       "description": "Conducts pregnancy test using kit and interprets results 3"
          //     },
          //     {
          //       "level": "L4",
          //       "name": "Understands health of males and females",
          //       "description": "Understands male and female reproductive anatomy"
          //     },
          //     {
          //       "level": "L5",
          //       "name": "Identifies pregnancy using Nischaya Kit",
          //       "description": "Conducts pregnancy test using kit and interprets results"
          //     }
          //   ]
          // },
          // {
          //   "type": "competency",
          //   "code": "C401",
          //   "name": "Pregnancy Identification",
          //   "description": "Conducts initial assessment to identify pregnancy, HRP, and estimate gestational age",
          //   "status": "Active",
          //   "children": [
          //     {
          //       "level": "L1",
          //       "name": "Understands health of males and females",
          //       "description": "Understands male and female reproductive anatomy"
          //     },
          //     {
          //       "level": "L2",
          //       "name": "Identifies pregnancy using Nischaya Kit",
          //       "description": "Conducts pregnancy test using kit and interprets results"
          //     },
          //     {
          //       "level": "L3",
          //       "name": "Identifies pregnancy using Nischaya Kit 3",
          //       "description": "Conducts pregnancy test using kit and interprets results 3"
          //     },
          //     {
          //       "level": "L4",
          //       "name": "Understands health of males and females",
          //       "description": "Understands male and female reproductive anatomy"
          //     },
          //     {
          //       "level": "L5",
          //       "name": "Identifies pregnancy using Nischaya Kit",
          //       "description": "Conducts pregnancy test using kit and interprets results"
          //     }
          //   ]
          // }, {
          //   "type": "competency",
          //   "code": "C401",
          //   "name": "Pregnancy Identification",
          //   "description": "Conducts initial assessment to identify pregnancy, HRP, and estimate gestational age",
          //   "status": "Active",
          //   "children": [
          //     {
          //       "level": "L1",
          //       "name": "Understands health of males and females",
          //       "description": "Understands male and female reproductive anatomy"
          //     },
          //     {
          //       "level": "L2",
          //       "name": "Identifies pregnancy using Nischaya Kit",
          //       "description": "Conducts pregnancy test using kit and interprets results"
          //     },
          //     {
          //       "level": "L3",
          //       "name": "Identifies pregnancy using Nischaya Kit 3",
          //       "description": "Conducts pregnancy test using kit and interprets results 3"
          //     },
          //     {
          //       "level": "L4",
          //       "name": "Understands health of males and females",
          //       "description": "Understands male and female reproductive anatomy"
          //     },
          //     {
          //       "level": "L5",
          //       "name": "Identifies pregnancy using Nischaya Kit",
          //       "description": "Conducts pregnancy test using kit and interprets results"
          //     }
          //   ]
          // }
        ]
      }
    }

    // "result": {
    //   "data": {
    //     "entity": [
    //       {
    //         "type": "activity",
    //         "code": "A400",
    //         "name": "Verify maternal and child death and ensure reporting (MCDR)",
    //         "description": "Conducts initial assessment to identify pregnancy, HRP, and estimate gestational age",
    //         "status": "Active",
    //         "additionalProperties": {
    //           "Code": "A400"
    //         }
    //       }
    //     ]
    //   }
    // }
  }


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
      this.tableConfig = this.tableTransformUtil.transformResponseToTableConfig(this.apiResponse)
      console.log('Manage mode - Transformed Table Config:', this.tableConfig)
      this.originalRowData = this.apiResponse.result.data.entity
    } else {
      // Show no-data state in upload mode (keep columns, empty data)
      this.tableConfig = this.tableTransformUtil.transformResponseToTableConfig(this.apiResponse)
      this.tableConfig.data = [] // Empty data to show no-data-row
      this.originalRowData = []
      console.log('Upload mode - Table showing no-data state')
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

  /** Handles actual API upload */
  uploadFile(file: File) {
    console.log('⏳ Uploading file:', file.name)

    this.fracApiService.uploadFile(file).subscribe({
      next: (res) => {
        console.log('✅ Upload successful:', res)
        // Optionally refresh table or notify user
      },
      error: (err) => {
        console.error('❌ Upload failed:', err)
      },
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
