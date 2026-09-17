import { Component, Inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'

export interface FormPreviewDialogData {
  component: string
  framework: string
  rootOrgId: string
  dataJson: string
}

/**
 * Read-only confirmation dialog: shows the exact payload that will be sent
 * to the update API before it actually fires. Mirrors playlist-view-dialog's
 * header/scroll-body/footer structure.
 */
@Component({
  standalone: false,
  selector: 'app-form-preview-dialog',
  templateUrl: './form-preview-dialog.component.html',
  styleUrls: ['./form-preview-dialog.component.scss'],
})
export class FormPreviewDialogComponent {
  constructor(
    private readonly dialogRef: MatDialogRef<FormPreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FormPreviewDialogData,
  ) { }

  onCancel(): void {
    this.dialogRef.close(false)
  }

  onConfirm(): void {
    this.dialogRef.close(true)
  }
}
