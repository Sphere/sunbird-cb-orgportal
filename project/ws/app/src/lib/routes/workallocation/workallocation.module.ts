import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { CreateWorkallocationComponent } from './routes/create-workallocation/create-workallocation.component'
import { DownloadAllocationComponent } from './routes/download-allocation/download-allocation.component'
import { RouterModule } from '@angular/router'
import { WorkallocationRoutingModule } from './workallocation-routing.module'
import { BreadcrumbsOrgModule, ScrollspyLeftMenuModule, UIORGTableModule } from '@sunbird-cb/collection'
import {
  MatSidenavModule
} from '@angular/material/sidenav'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatListModule } from '@angular/material/list'
import { MatCardModule } from '@angular/material/card'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatIconModule } from '@angular/material/icon'
import { MatButtonModule } from '@angular/material/button'
import { MatRadioModule } from '@angular/material/radio'
import { MatDialogModule } from '@angular/material/dialog'
import { MatSelectModule } from '@angular/material/select'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatPaginatorModule } from '@angular/material/paginator'
import { MatTableModule } from '@angular/material/table'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatDividerModule } from '@angular/material/divider'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { WidgetResolverModule } from '@sunbird-cb/resolver'
import { ExportAsModule } from 'ngx-export-as'
import { UpdateWorkallocationComponent } from './routes/update-workallocation/update-workallocation.component'
import { MatMenuModule } from '@angular/material/menu'
import { AllocationActionsComponent } from './components/allocation-actions/allocation-actions.component'
import { MatTabsModule } from '@angular/material/tabs'

@NgModule({
  declarations: [CreateWorkallocationComponent, DownloadAllocationComponent, UpdateWorkallocationComponent, AllocationActionsComponent],
  imports: [
    CommonModule, RouterModule, WorkallocationRoutingModule, BreadcrumbsOrgModule,
    MatSidenavModule, MatListModule, ScrollspyLeftMenuModule, MatCardModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatGridListModule,
    MatRadioModule, MatDialogModule, ReactiveFormsModule, MatSelectModule, MatProgressSpinnerModule,
    MatExpansionModule, MatDividerModule, MatPaginatorModule, MatTableModule, WidgetResolverModule,
    UIORGTableModule, ExportAsModule, MatMenuModule, MatTabsModule,
  ],
  entryComponents: [
    AllocationActionsComponent,
  ],
  exports: [DownloadAllocationComponent],
})
export class WorkallocationModule { }
