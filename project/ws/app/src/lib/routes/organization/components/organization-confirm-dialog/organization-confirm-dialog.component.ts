import { Component, Inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { IOrganization } from '../../models/organization.model'
import { ORG_STATUS } from '../../constants/organization.constants'
import { OrganizationApiService, orgApiErrorMessage } from '../../services/organization-api.service'

export interface OrganizationConfirmDialogData {
  org: IOrganization
  /** Status to set: ORG_STATUS.INACTIVE (deactivate / delete) or ORG_STATUS.ACTIVE (reactivate). */
  targetStatus: number
}

/** Confirms and performs a status change; closes with `true` only after the API succeeds. */
@Component({
  standalone: false,
  selector: 'ws-app-organization-confirm-dialog',
  templateUrl: './organization-confirm-dialog.component.html',
  styleUrls: ['./organization-confirm-dialog.component.scss'],
})
export class OrganizationConfirmDialogComponent {
  readonly isDeactivate: boolean

  saving = false
  error = ''

  constructor(
    private readonly dialogRef: MatDialogRef<OrganizationConfirmDialogComponent>,
    private readonly orgApiSvc: OrganizationApiService,
    @Inject(MAT_DIALOG_DATA) public data: OrganizationConfirmDialogData,
  ) {
    this.isDeactivate = data.targetStatus === ORG_STATUS.INACTIVE
  }

  onCancel(): void {
    this.dialogRef.close(false)
  }

  onConfirm(): void {
    this.saving = true
    this.error = ''
    this.orgApiSvc.updateOrganizationStatus(this.data.org.id, this.data.targetStatus).subscribe({
      next: () => {
        this.saving = false
        this.dialogRef.close(true)
      },
      error: (err) => {
        this.saving = false
        this.error = orgApiErrorMessage(err, 'Failed to update organization status.')
      },
    })
  }
}
