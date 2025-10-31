import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { FracComponent } from './components/frac/frac.component'

// ✅ Import all components used in routes
import { FracDashboardComponent } from './pages/frac-dashboard/frac-dashboard.component'
import { CompetencyUploadComponent } from './pages/competency/competency-upload/competency-upload.component'
import { ActivityUploadComponent } from './pages/activity/activity-upload/activity-upload.component'
import { RoleUploadComponent } from './pages/role/role-upload/role-upload.component'

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
        component: CompetencyUploadComponent, // ✅ direct component
      },
      {
        path: 'activity',
        component: ActivityUploadComponent, // ✅ direct component
      },
      {
        path: 'role',
        component: RoleUploadComponent, // ✅ direct component
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FracRoutingModule { }
