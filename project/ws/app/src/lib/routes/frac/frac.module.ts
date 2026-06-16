import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { HTTP_INTERCEPTORS } from '@angular/common/http'

// ✅ Material Modules (Angular 16 compatible — NO legacy imports)
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatIconModule } from '@angular/material/icon'
import { MatDividerModule } from '@angular/material/divider'
import { MatTableModule } from '@angular/material/table'
import { MatPaginatorModule } from '@angular/material/paginator'
import { MatSortModule } from '@angular/material/sort'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'

// ✅ Shared / Utility Modules
import { HorizontalScrollerModule } from '@sunbird-cb/utils'

// ✅ Routing
import { FracRoutingModule } from './frac-routing.module'

// ✅ Components (organized by layer)
import { FracComponent } from './components/frac/frac.component'
import { FracDashboardComponent } from './pages/frac-dashboard/frac-dashboard.component'

// --- Competency Pages ---
import { CompetencyUploadComponent } from './pages/competency/competency-upload/competency-upload.component'

// --- Activity Pages ---
import { ActivityUploadComponent } from './pages/activity/activity-upload/activity-upload.component'

// --- Position Pages ---
import { PositionUploadComponent } from './pages/position/position-upload/position-upload.component'

// --- Shared Components ---
import { FracUploadPopupComponent } from './components/frac-upload/frac-upload-popup.component'
import { FracTableComponent } from './components/frac-table/frac-table.component'
import { UploadActivityListTableComponent } from './components/upload-activity-list-table/upload-activity-list-table.component'
import { UploadCompetencyListTableComponent } from './components/upload-competency-list-table/upload-competency-list-table.component'
import { FormsModule } from '@angular/forms'
import { MatSelectModule } from '@angular/material/select'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatDialogModule } from '@angular/material/dialog'
import { WordWrapPipe } from './pipes/word-wrap.pipe'
import { MapActivityCompetenciesComponent } from './pages/activity/map-activity-competencies/map-activity-competencies.component'
import { ActivityMappingListComponent } from './components/activity-mapping-list/activity-mapping-list.component'
import { CompetencyMappingTableComponent } from './components/competency-mapping-table/competency-mapping-table.component'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { CustomSnackbarService } from './services/custom-snackbar.service'
import { CustomSnackbarComponent } from './components/custom-snackbar/custom-snackbar.component'
import { MapRoleActivitiesComponent } from './pages/map-role-activities/map-role-activities.component'
import { RoleMappingListComponent } from './components/role-mapping-list/role-mapping-list.component'
import { ActivityMappingTableComponent } from './components/activity-mapping-table/activity-mapping-table.component'
import { RoleUploadComponent } from './pages/role/role-upload/role-upload.component'
import { MapRolePositionComponent } from './pages/map-role-position/map-role-position.component'
import { RoleMappingTableComponent } from './components/role-mapping-table/role-mapping-table.component'
import { PositionMappingListComponent } from './components/position-mapping-list/position-mapping-list.component'
import { UploadResultModalComponent } from './components/upload-result-modal/upload-result-modal.component'
import { MappingRequiredModalComponent } from './components/mapping-required-modal/mapping-required-modal.component'
import { UnsavedChangesModalComponent } from './components/unsaved-changes-modal/unsaved-changes-modal.component'
import { HierarchyChipDetailsModalComponent } from './components/hierarchy-chip-details-modal/hierarchy-chip-details-modal.component'
import { PositionHierarchyViewModalComponent } from './components/position-hierarchy-view-modal/position-hierarchy-view-modal.component'
import { FracApiErrorNormalizerInterceptor } from './interceptors/frac-api-error-normalizer.interceptor'
import { HideForViewOnlyDirective } from '../../shared/directives/hide-for-view-only.directive'
import { DisableForViewOnlyDirective } from '../../shared/directives/disable-for-view-only.directive'
import { FEATURE_KEY } from '../../shared/access/feature-access'


@NgModule({
  declarations: [
    // Layout
    FracComponent,

    // Dashboard
    FracDashboardComponent,

    // Competency
    CompetencyUploadComponent,

    // Activity
    ActivityUploadComponent,

    // Shared
    FracUploadPopupComponent,
    FracTableComponent,
    UploadActivityListTableComponent,
    UploadCompetencyListTableComponent,
    WordWrapPipe,
    MapActivityCompetenciesComponent,
    ActivityMappingListComponent,
    CompetencyMappingTableComponent,
    CustomSnackbarComponent,
    MapRoleActivitiesComponent,
    RoleMappingListComponent,
    ActivityMappingTableComponent,
    RoleUploadComponent,
    MapRolePositionComponent,
    PositionMappingListComponent,
    RoleMappingTableComponent,
    UploadResultModalComponent,
    MappingRequiredModalComponent,
    UnsavedChangesModalComponent,
    HierarchyChipDetailsModalComponent,
    PositionHierarchyViewModalComponent,
    PositionUploadComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FracRoutingModule,
    HorizontalScrollerModule,

    // ✅ Material
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    FormsModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDialogModule,
    MatSnackBarModule,

    // ✅ Standalone directives
    HideForViewOnlyDirective,
    DisableForViewOnlyDirective,

  ],
  exports: [
    WordWrapPipe,
  ],
  providers: [
    CustomSnackbarService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: FracApiErrorNormalizerInterceptor,
      multi: true,
    },
    // Tells view-only directives in this module they render inside the FRAC feature.
    { provide: FEATURE_KEY, useValue: 'frac' },
  ]
})
export class FracModule { }
