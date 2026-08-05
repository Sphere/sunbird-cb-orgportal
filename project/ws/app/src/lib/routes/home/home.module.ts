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
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list'
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field'
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog'
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select'
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input'
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button'
import { MatNativeDateModule } from '@angular/material/core'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatLegacyChipsModule as MatChipsModule } from '@angular/material/legacy-chips'
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner'
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar'
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio'
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator'
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card'
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
import { EventDashboardComponent } from './routes/event-dashboard/event-dashboard.component'
import { EventDetailsComponent } from './routes/event-details/event-details.component'
import { EventOverviewComponent } from './routes/event-overview/event-overview.component'
import { ParticipantsComponent } from './routes/participants/participants.component'
import { CertificateGeneratorComponent } from './routes/certificate-generator/certificate-generator.component'
import { EventModalComponent } from './routes/event-modal/event-modal.component'
import { AddParticipantsComponent } from './routes/add-participants/add-participants.component'
import { MatDatepickerModule } from '@angular/material/datepicker'
// import { Ng2SearchPipeModule } from 'ng2-search-filter'
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
        EventDashboardComponent,
        EventDetailsComponent,
        EventOverviewComponent,
        ParticipantsComponent,
        CertificateGeneratorComponent,
        EventModalComponent,
        AddParticipantsComponent,
    ],
    imports: [
        CommonModule,
        // Ng2SearchPipeModule,
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
        MatDatepickerModule,
        MatNativeDateModule,
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
        MatDatepickerModule,
    ],
    providers: [
        // CKEditorService,
        // LoaderService,
        InitResolver,
    ]
})
export class HomeModule {

}
