import { Component, Inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'

export interface MissingMappingItem {
  code: string
  label: string
}

export interface MappingRequiredModalData {
  items: MissingMappingItem[]
  type?: 'activity' | 'role'
}

@Component({
  selector: 'ws-app-mapping-required-modal',
  templateUrl: './mapping-required-modal.component.html',
  styleUrls: ['./mapping-required-modal.component.scss'],
})
export class MappingRequiredModalComponent {
  constructor(
    private readonly dialogRef: MatDialogRef<MappingRequiredModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MappingRequiredModalData,
  ) { }

  /**
   * Closes the dialog and returns to the current screen.
   */
  onBack(): void {
    this.dialogRef.close('back')
  }

  /**
   * Closes the dialog and asks the caller to navigate to mapping page.
   */
  onMapNow(): void {
    this.dialogRef.close('map-now')
  }
}
