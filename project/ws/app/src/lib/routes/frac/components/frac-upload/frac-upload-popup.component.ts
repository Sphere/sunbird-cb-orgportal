import { Component, ElementRef, HostListener, Inject, OnInit, ViewChild } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { UploadPopupConfig, UploadPopupResult } from '../../models/upload-popup-config.model'

@Component({
  selector: 'ws-app-frac-upload',
  templateUrl: './frac-upload-popup.component.html',
  styleUrls: ['./frac-upload-popup.component.scss']
})
export class FracUploadPopupComponent implements OnInit {
  @ViewChild('dropdownContainer') dropdownContainer!: ElementRef
  selectedFile: File | null = null
  selectedLanguage = ''
  allowedTypes = '.csv,.xlsx'
  isDropdownOpen = false
  isDragOver = false  // 👈 NEW FLAG

  constructor(
    @Inject(MAT_DIALOG_DATA) public config: UploadPopupConfig,
    private dialogRef: MatDialogRef<FracUploadPopupComponent, UploadPopupResult>
  ) { }

  ngOnInit(): void {
    if (this.config?.fileSection?.allowedTypes?.length) {
      this.allowedTypes = this.config.fileSection.allowedTypes.join(',')
    }
  }

  /** Handle manual file selection */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    this.validateAndSetFile(file)
  }

  /** Handle drag over event */
  onDragOver(event: DragEvent): void {
    event.preventDefault()
    event.stopPropagation()
    this.isDragOver = true
  }

  /** Handle drag leave event */
  onDragLeave(event: DragEvent): void {
    event.preventDefault()
    event.stopPropagation()
    this.isDragOver = false
  }

  /** Handle file drop */
  onFileDrop(event: DragEvent): void {
    event.preventDefault()
    event.stopPropagation()
    this.isDragOver = false

    const file = event.dataTransfer?.files?.[0]
    if (file) {
      this.validateAndSetFile(file)
    }
  }

  /** Validate file type and assign */
  private validateAndSetFile(file: File): void {
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '')
    if (!this.allowedTypes.includes(ext)) {
      alert(`Invalid file type. Allowed: ${this.allowedTypes}`)
      return
    }
    this.selectedFile = file
  }

  removeFile(): void {
    this.selectedFile = null
  }

  close(): void {
    this.dialogRef.close()
  }

  onConfirmUpload(): void {
    if (!this.selectedFile) {
      alert('Please select a file first.')
      return
    }
    if (!this.selectedLanguage) {
      alert('Please select language.')
      return
    }

    this.dialogRef.close({
      action: 'upload',
      file: this.selectedFile,
      language: this.selectedLanguage,
    })
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen
  }

  selectLanguage(option: string): void {
    this.selectedLanguage = option
    this.isDropdownOpen = false
  }
  /** ✅ Close dropdown on outside click */
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event): void {
    if (this.isDropdownOpen && this.dropdownContainer &&
      !this.dropdownContainer.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false
    }
  }
}
