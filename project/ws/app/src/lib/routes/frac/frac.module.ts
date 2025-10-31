import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'

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

// ✅ Shared / Utility Modules
import { HorizontalScrollerModule } from '@sunbird-cb/utils'

// ✅ Routing
import { FracRoutingModule } from './frac-routing.module'

// ✅ Components (organized by layer)
import { FracComponent } from './components/frac/frac.component'
import { FracDashboardComponent } from './pages/frac-dashboard/frac-dashboard.component'

// --- Competency Pages ---
import { CompetencyUploadComponent } from './pages/competency/competency-upload/competency-upload.component'
import { CompetencyListComponent } from './pages/competency/competency-list/competency-list.component'
import { CompetencyDetailComponent } from './pages/competency/competency-detail/competency-detail.component'

// --- Activity Pages ---
import { ActivityUploadComponent } from './pages/activity/activity-upload/activity-upload.component'
import { ActivityListComponent } from './pages/activity/activity-list/activity-list.component'
import { ActivityMapComponent } from './pages/activity/activity-map/activity-map.component'

// --- Role Pages ---
import { RoleUploadComponent } from './pages/role/role-upload/role-upload.component'
import { RoleListComponent } from './pages/role/role-list/role-list.component'
import { RoleMapComponent } from './pages/role/role-map/role-map.component'
import { RolePositionAssignComponent } from './pages/role/role-position-assign/role-position-assign.component'

// --- Shared Components ---
import { FracUploadComponent } from './components/frac-upload/frac-upload.component'
import { FracTableComponent } from './components/frac-table/frac-table.component'
import { FracMapperComponent } from './components/frac-mapper/frac-mapper.component'
import { FracCardComponent } from './components/frac-card/frac-card.component'
import { FormsModule } from '@angular/forms'
import { MatSelectModule } from '@angular/material/select'
import { MatCheckboxModule } from '@angular/material/checkbox'

@NgModule({
  declarations: [
    // Layout
    FracComponent,

    // Dashboard
    FracDashboardComponent,

    // Competency
    CompetencyUploadComponent,
    CompetencyListComponent,
    CompetencyDetailComponent,

    // Activity
    ActivityUploadComponent,
    ActivityListComponent,
    ActivityMapComponent,

    // Role
    RoleUploadComponent,
    RoleListComponent,
    RoleMapComponent,
    RolePositionAssignComponent,

    // Shared
    FracUploadComponent,
    FracTableComponent,
    FracMapperComponent,
    FracCardComponent,
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
    FormsModule,
    MatSelectModule,
    MatCheckboxModule,

  ],
})
export class FracModule { }
