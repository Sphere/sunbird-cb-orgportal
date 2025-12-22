import { Component, Inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'

export interface UploadResultData {
  type: 'success' | 'error'
  title: string
  message: string
  count?: number
  errorDetails?: string
}

@Component({
  selector: 'ws-app-upload-result-modal',
  templateUrl: './upload-result-modal.component.html',
  styleUrls: ['./upload-result-modal.component.scss']
})
export class UploadResultModalComponent {
  constructor(
    public dialogRef: MatDialogRef<UploadResultModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UploadResultData
  ) { }

  isSuccess(): boolean {
    return this.data.type === 'success'
  }

  isError(): boolean {
    return this.data.type === 'error'
  }

  onClose(): void {
    this.dialogRef.close()
  }
}
