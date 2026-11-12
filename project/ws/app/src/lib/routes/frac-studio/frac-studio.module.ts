import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { FEATURE_KEY } from '../../shared/access/feature-access'
import { DisableForViewOnlyDirective } from '../../shared/directives/disable-for-view-only.directive'
import { HideForViewOnlyDirective } from '../../shared/directives/hide-for-view-only.directive'
import { CompetencyEditorComponent } from './components/competency-editor/competency-editor.component'
import { DocumentUploadComponent } from './components/document-upload/document-upload.component'
import { FracProgressComponent } from './components/frac-progress/frac-progress.component'
import { FracStudioShellComponent } from './components/frac-studio-shell/frac-studio-shell.component'
import { JobProgressComponent } from './components/job-progress/job-progress.component'
import { LadderEditorComponent } from './components/ladder-editor/ladder-editor.component'
import { ResearchEditorComponent } from './components/research-editor/research-editor.component'
import { ReviewReportComponent } from './components/review-report/review-report.component'
import { RolesEditorComponent } from './components/roles-editor/roles-editor.component'
import { RolesPreviewComponent } from './components/roles-preview/roles-preview.component'
import { SaveStatusComponent } from './components/save-status/save-status.component'
import { VersionHistoryComponent } from './components/version-history/version-history.component'
import { FracSortHeaderDirective } from './directives/sort-header.directive'
import { FracStudioRoutingModule } from './frac-studio-routing.module'
import { CreatorBriefComponent } from './pages/creator-brief/creator-brief.component'
import { CreatorDetailComponent } from './pages/creator-detail/creator-detail.component'
import { MyFracsComponent } from './pages/my-fracs/my-fracs.component'
import { ReviewerComponent } from './pages/reviewer/reviewer.component'

/**
 * FRAC Studio: AI-assisted FRAC Reviewer and Creator, backed by frac-studio-service
 * through uiproxy /protected/v8/fracStudio.
 */
@NgModule({
  declarations: [
    FracStudioShellComponent,
    ReviewReportComponent,
    JobProgressComponent,
    FracProgressComponent,
    SaveStatusComponent,
    RolesEditorComponent,
    CompetencyEditorComponent,
    LadderEditorComponent,
    ResearchEditorComponent,
    VersionHistoryComponent,
    DocumentUploadComponent,
    RolesPreviewComponent,
    ReviewerComponent,
    CreatorBriefComponent,
    CreatorDetailComponent,
    MyFracsComponent,
    FracSortHeaderDirective,
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatProgressSpinnerModule,
    FracStudioRoutingModule,
    HideForViewOnlyDirective,
    DisableForViewOnlyDirective,
  ],
  providers: [
    // Shares FRAC's roles: frac_read users see everything, mutations are hidden
    { provide: FEATURE_KEY, useValue: 'frac' },
  ],
})
export class FracStudioModule { }
