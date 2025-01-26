import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { PipeFilterModule, PipeHtmlTagRemovalModule, PipeOrderByModule, PipeRelativeTimeModule } from '@sunbird-cb/utils'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatDividerModule } from '@angular/material/divider'
import { WidgetResolverModule } from '@sunbird-cb/resolver'
import {
  MatIconModule,

} from '@angular/material/icon'
import { MatListModule } from '@angular/material/list'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatDialogModule } from '@angular/material/dialog'
import { MatSelectModule } from '@angular/material/select'
import { MatInputModule } from '@angular/material/input'
import { MatButtonModule } from '@angular/material/button'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatChipsModule } from '@angular/material/chips'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatRadioModule } from '@angular/material/radio'
import { MatTableModule } from '@angular/material/table'
import { MatMenuModule } from '@angular/material/menu'
import { MatPaginatorModule } from '@angular/material/paginator'
import { MatCardModule } from '@angular/material/card'
import { ReactiveFormsModule, FormsModule } from '@angular/forms'
import { InitResolver } from './resolvers/init-resolve.service'
import { RouterModule } from '@angular/router'
import { HomeRoutingModule } from './home.rounting.module'
import { HomeComponent } from './routes/home/home.component'
import { UsersViewComponent } from './routes/users-view/users-view.component'
import { AvatarPhotoModule, BreadcrumbsOrgModule, LeftMenuModule, UIORGTableModule, ScrollspyLeftMenuModule } from '@sunbird-cb/collection'
import { AboutComponent } from './routes/about/about.component'
import { RolesAccessComponent } from './routes/roles-access/roles-access.component'
import { ApprovalsComponent } from './routes/approvals/approvals.component'
import { WorkallocationComponent } from './routes/workallocation/workallocation.component'
import { Ng2SearchPipeModule } from 'ng2-search-filter'
import { ExportAsModule } from 'ngx-export-as'
import { WorkallocationModule } from '../workallocation/workallocation.module'
import { NgxPaginationModule } from 'ngx-pagination'
import { UIAdminTableModule } from '../../head/work-allocation-table/ui-admin-table.module'
import { WelcomeComponent } from './routes/welcome/welcome.component'
// import { RainDashboardsModule } from '@sunbird-cb/rain-dashboards'
import { UsersModule } from '../users/users.module'
import { CompetenciesComponent } from './routes/competencies/competencies.component'
import { SkillModule } from '../../../../../../../src/app/plugins/skill'
import { SelfAssessmentComponent } from './routes/self-assessment/self-assessment.component'
@NgModule({
  declarations: [
    HomeComponent,
    UsersViewComponent,
    AboutComponent,
    RolesAccessComponent,
    ApprovalsComponent,
    WorkallocationComponent,
    WelcomeComponent,
    CompetenciesComponent,
    SelfAssessmentComponent,
  ],
  imports: [
    CommonModule,
    Ng2SearchPipeModule,
    UIORGTableModule,
    WidgetResolverModule,
    ReactiveFormsModule,
    HomeRoutingModule,
    LeftMenuModule,
    FormsModule,
    RouterModule,
    MatGridListModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatDividerModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatListModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatSidenavModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    PipeFilterModule,
    PipeHtmlTagRemovalModule,
    PipeRelativeTimeModule,
    AvatarPhotoModule,
    // EditorSharedModule,
    // CkEditorModule,
    PipeOrderByModule,
    BreadcrumbsOrgModule,
    WidgetResolverModule,
    ScrollspyLeftMenuModule,
    MatRadioModule,
    ExportAsModule,
    WorkallocationModule,
    NgxPaginationModule,
    UIAdminTableModule,
    // RainDashboardsModule,
    UsersModule,
    MatTableModule,
    SkillModule,
  ],
  entryComponents: [
  ],
  providers: [
    // CKEditorService,
    // LoaderService,
    InitResolver,
  ],
})
export class HomeModule {

}
