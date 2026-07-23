import { Component, Inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'

export interface UnsavedChangesModalData {
  title?: string
  message?: string
  continueLabel?: string
  cancelLabel?: string
}

@Component({
  standalone: false,
  selector: 'ws-app-unsaved-changes-modal',
  templateUrl: './unsaved-changes-modal.component.html',
  styleUrls: ['./unsaved-changes-modal.component.scss'],
})
export class UnsavedChangesModalComponent {
  constructor(
    private dialogRef: MatDialogRef<UnsavedChangesModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UnsavedChangesModalData,
  ) { }

  onContinue(): void {
    this.dialogRef.close('continue')
  }

  /**
   * Closes the popup dialog without saving any changes.
   */
  onCancel(): void {
    this.dialogRef.close('cancel')
  }
}
