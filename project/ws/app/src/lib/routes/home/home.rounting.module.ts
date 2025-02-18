import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
// import { InitResolver } from './resol./routes/profile-v2/discuss-all.component'
import { HomeResolve } from './resolvers/home-resolve'
import { AboutComponent } from './routes/about/about.component'
import { HomeComponent } from './routes/home/home.component'
import { UsersViewComponent } from './routes/users-view/users-view.component'
import { RolesAccessComponent } from './routes/roles-access/roles-access.component'
// import { PageResolve } from '@sunbird-cb/utils'
import { ApprovalsComponent } from './routes/approvals/approvals.component'
import { WorkallocationComponent } from './routes/workallocation/workallocation.component'
import { WelcomeComponent } from './routes/welcome/welcome.component'
import { ConfigResolveService } from './resolvers/config-resolve.service'
import { UsersListResolve } from './resolvers/users-list-resolve.service'
import { CompetenciesComponent } from './routes/competencies/competencies.component'
import { SelfAssessmentComponent } from './routes/self-assessment/self-assessment.component'
import { UserCompetencyComponent } from '../../../../../../../src/app/plugins/skill/components'
import { EventDashboardComponent } from './routes/event-dashboard/event-dashboard.component'
import { EventDetailsComponent } from './routes/event-details/event-details.component'
import { EventOverviewComponent } from './routes/event-overview/event-overview.component'
import { ParticipantsComponent } from './routes/participants/participants.component'
import { CertificateGeneratorComponent } from './routes/certificate-generator/certificate-generator.component'

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'welcome',
  },
  {
    path: '',
    component: HomeComponent,
    resolve: {
      // department: DepartmentResolve,
      configService: ConfigResolveService,
      tabs: HomeResolve,
    },
    children: [
      {
        path: 'welcome',
        component: WelcomeComponent,
      },
      {
        path: 'users',
        component: UsersViewComponent,
        resolve: {
          usersList: UsersListResolve,
        },
      },
      {
        path: 'about',
        component: AboutComponent,
      },
      {
        path: 'roles-access',
        component: RolesAccessComponent,
        resolve: {
          usersList: UsersListResolve,
        },
      },
      {
        path: 'approvals',
        component: ApprovalsComponent,
      },
      {
        path: 'workallocation',
        component: WorkallocationComponent,
      },
      {
        path: 'competencies',
        component: CompetenciesComponent,
        resolve: {
          usersList: UsersListResolve,
        },
      },
      {
        path: 'competencies/:id',
        component: UserCompetencyComponent,
        resolve: {
          usersList: UsersListResolve,
        },
      },
      {
        path: 'self-assessment',
        component: SelfAssessmentComponent,
      },
      {
        path: 'event-dashboard',
        component: EventDashboardComponent,
      },
      {
        path: 'event-dashboard/:id',
        component: EventDetailsComponent,
        children: [
          {
            path: '',
            pathMatch: 'full',  // Redirect empty path to 'overview'
            redirectTo: 'overview'
          },
          {
            path: 'overview',
            component: EventOverviewComponent,
          },
          {
            path: 'participants',
            component: ParticipantsComponent,
          },
          {
            path: 'certificate',
            component: CertificateGeneratorComponent,
          },
        ],
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [
    HomeResolve,
    // DepartmentResolve,
    ConfigResolveService,
    UsersListResolve,
  ],
})
export class HomeRoutingModule { }
