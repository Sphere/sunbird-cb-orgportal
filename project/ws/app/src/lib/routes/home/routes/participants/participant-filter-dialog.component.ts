import { Component, Inject } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'

export interface ParticipantFilterData {
  filterStatus: string
  showCertificateStatus: boolean
}

export interface ParticipantFilterResult {
  filterStatus: string
}

@Component({
  standalone: false,
  selector: 'ws-app-participant-filter-dialog',
  templateUrl: './participant-filter-dialog.component.html',
  styleUrls: ['./participant-filter-dialog.component.scss'],
})
export class ParticipantFilterDialogComponent {
  filterStatus: string

  constructor(
    public readonly dialogRef: MatDialogRef<ParticipantFilterDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: ParticipantFilterData
  ) {
    this.filterStatus = data.filterStatus
  }

  apply(): void {
    this.dialogRef.close({ filterStatus: this.filterStatus } as ParticipantFilterResult)
  }

  cancel(): void {
    this.dialogRef.close(null)
  }
}
