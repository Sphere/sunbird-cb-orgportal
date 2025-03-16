import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { CreateUserComponent } from './routes/create-user/create-user.component'
import { ViewUserComponent } from './routes/view-user/view-user.component'
import { RouterModule } from '@angular/router'
import { UsersRoutingModule } from './users.routing.module'
import { BreadcrumbsOrgModule, ScrollspyLeftMenuModule } from '@sunbird-cb/collection'
import { UsersUploadComponent } from './components/users-upload/users-upload.component'
import {

  MatLegacyPaginatorModule as MatPaginatorModule,
} from '@angular/material/legacy-paginator'
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
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table'

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
    exports: [UsersUploadComponent]
})
export class UsersModule { }
