import { Component, ElementRef, HostListener, Inject, OnInit, ViewChild } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { UploadPopupConfig, UploadPopupResult } from '../../models/upload-popup-config.model'
import { FRAC_UI_CONFIG } from '../../models/ui.config.model'

@Component({
  standalone: false,
  selector: 'ws-app-frac-upload',
  templateUrl: './frac-upload-popup.component.html',
  styleUrls: ['./frac-upload-popup.component.scss']
})
export class FracUploadPopupComponent implements OnInit {
  readonly uiConfig = FRAC_UI_CONFIG
  @ViewChild('dropdownContainer') dropdownContainer!: ElementRef
  selectedFile: File | null = null
  selectedLanguage = ''
  allowedTypes = '.csv,.xlsx'
  isDropdownOpen = false
  isDragOver = false

  constructor(
    @Inject(MAT_DIALOG_DATA) public config: UploadPopupConfig,
    private readonly dialogRef: MatDialogRef<FracUploadPopupComponent, UploadPopupResult>
  ) { }

  /**
   * Runs when the component is first initialized on the screen.
   */
  ngOnInit(): void {
    this.selectedLanguage = this.config?.dropdown?.defaultValue || ''
    if (this.config?.fileSection?.allowedTypes?.length) {
      this.allowedTypes = this.config.fileSection.allowedTypes.join(',')
    }
  }

  /**
   * Handles file selection from the input element.
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    this.validateAndSetFile(file)
  }

  /**
   * Highlights the drop zone while a file is dragged over it.
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault()
    event.stopPropagation()
    this.isDragOver = true
  }

  /**
   * Removes drag highlight when file leaves the drop zone.
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault()
    event.stopPropagation()
    this.isDragOver = false
  }

  /**
   * Reads dropped file and validates it before saving to local state.
   */
  onFileDrop(event: DragEvent): void {
    event.preventDefault()
    event.stopPropagation()
    this.isDragOver = false

    const file = event.dataTransfer?.files?.[0]
    if (file) {
      this.validateAndSetFile(file)
    }
  }

  /**
   * Validates extension and stores the selected file.
   */
  private validateAndSetFile(file: File): void {
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '')
    if (!this.allowedTypes.includes(ext)) {
      const invalidFileTypePrefix = this.config?.validationMessages?.invalidFileTypePrefix || 'Invalid file type. Allowed:'
      alert(`${invalidFileTypePrefix} ${this.allowedTypes}`)
      return
    }
    this.selectedFile = file
  }

  /**
   * Clears the currently selected file allowing the user to choose another one.
   */
  removeFile(): void {
    this.selectedFile = null
  }

  /**
   * Closes popup without returning upload data.
   */
  close(): void {
    this.dialogRef.close()
  }

  /**
   * Validates required fields and returns selected file + language.
   */
  onConfirmUpload(): void {
    if (!this.selectedFile) {
      alert(this.config?.validationMessages?.fileRequired || 'Please select a file first.')
      return
    }


    this.dialogRef.close({
      action: 'upload',
      file: this.selectedFile,
      language: this.selectedLanguage,
    })
  }

  /**
   * Opens or closes the language dropdown.
   */
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen
  }

  /**
   * Sets the chosen language and closes the dropdown.
   */
  selectLanguage(option: string): void {
    this.selectedLanguage = option
    this.isDropdownOpen = false
  }

  /**
   * Closes language dropdown when user clicks outside.
   */
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event): void {
    if (this.isDropdownOpen && this.dropdownContainer &&
      !this.dropdownContainer.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false
    }
  }
}
