import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { FracComponent } from './components/frac/frac.component'

// ✅ Import all components used in routes
import { FracDashboardComponent } from './pages/frac-dashboard/frac-dashboard.component'
import { CompetencyUploadComponent } from './pages/competency/competency-upload/competency-upload.component'
import { ActivityUploadComponent } from './pages/activity/activity-upload/activity-upload.component'
import { MapActivityCompetenciesComponent } from './pages/activity/map-activity-competencies/map-activity-competencies.component'
import { MapRoleActivitiesComponent } from './pages/map-role-activities/map-role-activities.component'
import { RoleUploadComponent } from './pages/role/role-upload/role-upload.component'
import { MapRolePositionComponent } from './pages/map-role-position/map-role-position.component'

const routes: Routes = [
  {
    path: '',
    component: FracComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: FracDashboardComponent, // ✅ normal route
      },
      {
        path: 'competency',
        component: CompetencyUploadComponent, // ✅ with optional query param mode
      },
      {
        path: 'activity',
        component: ActivityUploadComponent, // ✅ with optional query param mode
      },
      {
        path: 'role',
        component: RoleUploadComponent, // ✅ with optional query param mode
      },
      {
        path: 'map-activity',
        component: MapActivityCompetenciesComponent
      },
      {
        path: 'map-role',
        component: MapRoleActivitiesComponent
      },
      {
        path: 'map-role-position',
        component: MapRolePositionComponent
      }
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FracRoutingModule { }
