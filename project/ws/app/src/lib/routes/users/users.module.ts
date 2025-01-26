import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { CreateUserComponent } from './routes/create-user/create-user.component'
import { ViewUserComponent } from './routes/view-user/view-user.component'
import { RouterModule } from '@angular/router'
import { UsersRoutingModule } from './users.routing.module'
import { BreadcrumbsOrgModule, ScrollspyLeftMenuModule } from '@sunbird-cb/collection'
import { UsersUploadComponent } from './components/users-upload/users-upload.component'
import {

  MatPaginatorModule
} from '@angular/material/paginator'
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
import { MatSortModule } from '@angular/material/sort'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatDividerModule } from '@angular/material/divider'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { WidgetResolverModule } from '@sunbird-cb/resolver'
import { RolesService } from './services/roles.service'
import { FileService } from './services/upload.service'
import { RoleConfirmDialogComponent } from '../../../../../../../src/app/plugins/skill/components/role-confirm-dialog/role-confirm-dialog.component'
import { DropdownDobComponent } from '../../../../../../../src/app/component/dropdown-dob/dropdown-dob.component'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatTableModule } from '@angular/material/table'

@NgModule({
  declarations: [CreateUserComponent, ViewUserComponent, UsersUploadComponent, RoleConfirmDialogComponent, DropdownDobComponent],
  imports: [
    CommonModule, RouterModule, UsersRoutingModule, BreadcrumbsOrgModule,
    MatSidenavModule, MatListModule, ScrollspyLeftMenuModule, MatCardModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatGridListModule,
    MatRadioModule, MatDialogModule, ReactiveFormsModule, MatSelectModule, MatProgressSpinnerModule,
    MatExpansionModule, MatDividerModule, MatPaginatorModule, MatTableModule, WidgetResolverModule, MatSortModule, MatDatepickerModule,
  ],
  providers: [RolesService, FileService],
  exports: [UsersUploadComponent],
  entryComponents: [RoleConfirmDialogComponent, DropdownDobComponent],
})
export class UsersModule { }
