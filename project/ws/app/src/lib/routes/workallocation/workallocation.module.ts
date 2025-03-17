import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { CreateWorkallocationComponent } from './routes/create-workallocation/create-workallocation.component'
import { DownloadAllocationComponent } from './routes/download-allocation/download-allocation.component'
import { RouterModule } from '@angular/router'
import { WorkallocationRoutingModule } from './workallocation-routing.module'
import { BreadcrumbsOrgModule, ScrollspyLeftMenuModule, UIORGTableModule } from '@sunbird-cb/collection'
import {
  MatSidenavModule,
} from '@angular/material/sidenav'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list'
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card'
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field'
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input'
import { MatIconModule } from '@angular/material/icon'
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button'
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio'
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog'
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select'
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner'
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator'
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatDividerModule } from '@angular/material/divider'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { WidgetResolverModule } from '@sunbird-cb/resolver'
import { ExportAsModule } from 'ngx-export-as'
import { UpdateWorkallocationComponent } from './routes/update-workallocation/update-workallocation.component'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'
import { AllocationActionsComponent } from './components/allocation-actions/allocation-actions.component'
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs'
import { MatToolbarModule } from '@angular/material/toolbar'
// import { DialogConfirmComponent } from '../../../../../../../src/app/component/dialog-confirm/dialog-confirm.component'

@NgModule({
  declarations: [CreateWorkallocationComponent, DownloadAllocationComponent, UpdateWorkallocationComponent, AllocationActionsComponent],
  imports: [
    CommonModule, RouterModule, WorkallocationRoutingModule, BreadcrumbsOrgModule,
    MatSidenavModule, MatListModule, ScrollspyLeftMenuModule, MatCardModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatGridListModule,
    MatRadioModule, MatDialogModule, ReactiveFormsModule, MatSelectModule, MatProgressSpinnerModule,
    MatExpansionModule, MatDividerModule, MatPaginatorModule, MatTableModule, WidgetResolverModule,
    UIORGTableModule, ExportAsModule, MatMenuModule, MatTabsModule, MatToolbarModule
  ],
  exports: [DownloadAllocationComponent]
})
export class WorkallocationModule { }
