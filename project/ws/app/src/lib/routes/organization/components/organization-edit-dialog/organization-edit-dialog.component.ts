import { Component, Inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { Observable } from 'rxjs'
import { IOrganization, IOrgApiResponse } from '../../models/organization.model'
import { ORG_CREATE_DEFAULTS } from '../../constants/organization.constants'
import { OrganizationApiService, orgApiErrorMessage } from '../../services/organization-api.service'

export interface OrganizationEditDialogData {
  /** null → create mode, otherwise edit this org. */
  org: IOrganization | null
}

/**
 * Create / edit dialog. Performs the API call itself so errors stay inline
 * and the dialog only closes (with `true`) after a successful save.
 */
@Component({
  standalone: false,
  selector: 'ws-app-organization-edit-dialog',
  templateUrl: './organization-edit-dialog.component.html',
  styleUrls: ['./organization-edit-dialog.component.scss'],
})
export class OrganizationEditDialogComponent {
  readonly isEdit: boolean

  orgName: string
  channel: string
  isTenant: boolean
  organisationType: string
  organisationSubType: string

  saving = false
  error = ''

  constructor(
    private readonly dialogRef: MatDialogRef<OrganizationEditDialogComponent>,
    private readonly orgApiSvc: OrganizationApiService,
    @Inject(MAT_DIALOG_DATA) public data: OrganizationEditDialogData,
  ) {
    const org = data?.org
    this.isEdit = !!org
    this.orgName = org?.orgName || ''
    this.channel = org?.channel || ''
    this.isTenant = org ? !!org.isTenant : ORG_CREATE_DEFAULTS.isTenant
    this.organisationType = org ? org.organisationType || '' : ORG_CREATE_DEFAULTS.organisationType
    this.organisationSubType = org ? org.organisationSubType || '' : ORG_CREATE_DEFAULTS.organisationSubType
  }

  get canSave(): boolean {
    const hasName = !!this.orgName.trim()
    const hasChannel = this.isEdit || !!this.channel.trim()
    return hasName && hasChannel && !this.saving
  }

  onCancel(): void {
    this.dialogRef.close(false)
  }

  onSave(): void {
    if (!this.canSave) {
      return
    }
    this.saving = true
    this.error = ''

    let request$: Observable<IOrgApiResponse>
    if (this.isEdit && this.data.org) {
      request$ = this.orgApiSvc.updateOrganization({
        organisationId: this.data.org.id,
        orgName: this.orgName.trim(),
        organisationType: this.organisationType.trim(),
        organisationSubType: this.organisationSubType.trim(),
      })
    } else {
      request$ = this.orgApiSvc.createOrganization({
        orgName: this.orgName.trim(),
        channel: this.channel.trim(),
        isTenant: this.isTenant,
        organisationType: this.organisationType.trim(),
        organisationSubType: this.organisationSubType.trim(),
      })
    }

    request$.subscribe({
      next: () => {
        this.saving = false
        this.dialogRef.close(true)
      },
      error: (err) => {
        this.saving = false
        this.error = orgApiErrorMessage(err, this.isEdit ? 'Failed to update organization.' : 'Failed to create organization.')
      },
    })
  }
}
