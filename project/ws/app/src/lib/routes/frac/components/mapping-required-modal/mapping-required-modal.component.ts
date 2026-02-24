import { Component, Inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'

export interface MissingActivityMappingItem {
  code: string
  label: string
}

export interface MappingRequiredModalData {
  activities: MissingActivityMappingItem[]
}

@Component({
  selector: 'ws-app-mapping-required-modal',
  templateUrl: './mapping-required-modal.component.html',
  styleUrls: ['./mapping-required-modal.component.scss'],
})
export class MappingRequiredModalComponent {
  constructor(
    private dialogRef: MatDialogRef<MappingRequiredModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MappingRequiredModalData,
  ) { }

  onBack(): void {
    this.dialogRef.close('back')
  }

  onMapNow(): void {
    this.dialogRef.close('map-now')
  }
}
