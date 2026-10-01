import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { MatIconModule } from '@angular/material/icon'
import { MatDialogModule } from '@angular/material/dialog'

import { OrganizationRoutingModule } from './organization-routing.module'
import { OrganizationListComponent } from './pages/organization-list/organization-list.component'
import { OrganizationEditDialogComponent } from './components/organization-edit-dialog/organization-edit-dialog.component'
import { OrganizationConfirmDialogComponent } from './components/organization-confirm-dialog/organization-confirm-dialog.component'

@NgModule({
  declarations: [
    OrganizationListComponent,
    OrganizationEditDialogComponent,
    OrganizationConfirmDialogComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    OrganizationRoutingModule,
    FormsModule,
    MatIconModule,
    MatDialogModule,
  ],
})
export class OrganizationModule { }
