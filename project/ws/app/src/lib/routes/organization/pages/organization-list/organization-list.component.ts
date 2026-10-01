import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { IOrganization } from '../../models/organization.model'
import { ORG_CONFIRM_DIALOG, ORG_EDIT_DIALOG, ORG_PAGE_SIZE, ORG_STATUS } from '../../constants/organization.constants'
import { OrganizationApiService, orgApiErrorMessage } from '../../services/organization-api.service'
import {
  OrganizationEditDialogComponent,
  OrganizationEditDialogData,
} from '../../components/organization-edit-dialog/organization-edit-dialog.component'
import {
  OrganizationConfirmDialogComponent,
  OrganizationConfirmDialogData,
} from '../../components/organization-confirm-dialog/organization-confirm-dialog.component'

/**
 * Organization list with client-side search + paging over a single upfront
 * org-search fetch. Create / Edit / Deactivate / Activate open dialogs that
 * perform the call themselves; the list reloads after any successful change.
 */
@Component({
  standalone: false,
  selector: 'ws-app-organization-list',
  templateUrl: './organization-list.component.html',
  styleUrls: ['./organization-list.component.scss'],
})
export class OrganizationListComponent implements OnInit {
  readonly ORG_STATUS = ORG_STATUS
  readonly shimmerRows = [1, 2, 3, 4, 5, 6]

  orgs: IOrganization[] = []
  searchText = ''
  pageIndex = 0

  loading = false
  loadError = ''

  constructor(
    private readonly dialog: MatDialog,
    private readonly orgApiSvc: OrganizationApiService,
  ) { }

  ngOnInit(): void {
    this.loadOrganizations()
  }

  loadOrganizations(): void {
    this.loading = true
    this.loadError = ''
    this.orgApiSvc.searchOrganizations().subscribe({
      next: (orgs) => {
        this.orgs = orgs
        this.loading = false
        this.clampPage()
      },
      error: (err) => {
        this.orgs = []
        this.loading = false
        this.loadError = orgApiErrorMessage(err, 'Failed to load organizations.')
      },
    })
  }

  get filteredOrgs(): IOrganization[] {
    const q = this.searchText.trim().toLowerCase()
    if (!q) {
      return this.orgs
    }
    return this.orgs.filter(org =>
      (org.orgName || '').toLowerCase().includes(q)
      || (org.channel || '').toLowerCase().includes(q)
      || String(org.id || '').toLowerCase().includes(q))
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredOrgs.length / ORG_PAGE_SIZE))
  }

  get pagedOrgs(): IOrganization[] {
    const start = this.pageIndex * ORG_PAGE_SIZE
    return this.filteredOrgs.slice(start, start + ORG_PAGE_SIZE)
  }

  get rangeLabel(): string {
    const total = this.filteredOrgs.length
    if (!total) {
      return '0 of 0'
    }
    const start = this.pageIndex * ORG_PAGE_SIZE + 1
    const end = Math.min(total, start + ORG_PAGE_SIZE - 1)
    return `${start}–${end} of ${total}`
  }

  onSearchChange(): void {
    this.pageIndex = 0
  }

  prevPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex -= 1
    }
  }

  nextPage(): void {
    if (this.pageIndex < this.totalPages - 1) {
      this.pageIndex += 1
    }
  }

  isActive(org: IOrganization): boolean {
    return org.status === ORG_STATUS.ACTIVE
  }

  /** Sunbird createdDate is "YYYY-MM-DD HH:mm:ss:SSS+0000" (not ISO) — show just the date part. */
  createdOn(org: IOrganization): string {
    return (org.createdDate || '').slice(0, 10) || '—'
  }

  trackById(_index: number, org: IOrganization): string {
    return org.id
  }

  openCreate(): void {
    this.openEditDialog(null)
  }

  openEdit(org: IOrganization): void {
    this.openEditDialog(org)
  }

  openStatusChange(org: IOrganization): void {
    const data: OrganizationConfirmDialogData = {
      org,
      targetStatus: this.isActive(org) ? ORG_STATUS.INACTIVE : ORG_STATUS.ACTIVE,
    }
    this.dialog.open(OrganizationConfirmDialogComponent, { ...ORG_CONFIRM_DIALOG, data })
      .afterClosed().subscribe(changed => {
        if (changed) {
          this.loadOrganizations()
        }
      })
  }

  private openEditDialog(org: IOrganization | null): void {
    const data: OrganizationEditDialogData = { org }
    this.dialog.open(OrganizationEditDialogComponent, { ...ORG_EDIT_DIALOG, data })
      .afterClosed().subscribe(saved => {
        if (saved) {
          this.loadOrganizations()
        }
      })
  }

  private clampPage(): void {
    if (this.pageIndex > this.totalPages - 1) {
      this.pageIndex = this.totalPages - 1
    }
  }
}
