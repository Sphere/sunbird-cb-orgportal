import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
// import { InitResolver } from './resol./routes/profile-v2/discuss-all.component'
import { HomeResolve } from './resolvers/home-resolve'
import { AboutComponent } from './routes/about/about.component'
import { HomeComponent } from './routes/home/home.component'
// import { PageResolve } from '@sunbird-cb/utils'
import { ApprovalsComponent } from './routes/approvals/approvals.component'
import { WorkallocationComponent } from './routes/workallocation/workallocation.component'
import { WelcomeComponent } from './routes/welcome/welcome.component'
import { ConfigResolveService } from './resolvers/config-resolve.service'
import { SelfAssessmentComponent } from './routes/self-assessment/self-assessment.component'
import { EventDashboardComponent } from './routes/event-dashboard/event-dashboard.component'
import { EventDetailsComponent } from './routes/event-details/event-details.component'
import { EventOverviewComponent } from './routes/event-overview/event-overview.component'
import { ParticipantsComponent } from './routes/participants/participants.component'
import { CertificateGeneratorComponent } from './routes/certificate-generator/certificate-generator.component'
import { GeneralGuard } from '../../../../../../../src/app/guards/general.guard'

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
        path: 'about',
        component: AboutComponent,
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
            redirectTo: 'overview',
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
      {
        path: 'playlist',
        loadChildren: () => import('../playlist/playlist.routes').then(m => m.HOME_PLAYLIST_ROUTES),
      },
      {
        path: 'frac',
        loadChildren: () =>
          import('../frac/frac.module').then((m) => m.FracModule),
      },
      {
        // Role name MUST be lowercase — GeneralGuard tests a lowercased Set without
        // lowercasing the input, so an uppercase entry silently never matches.
        // This gate is for UX; the backend 403 is the real access control.
        path: 'mnc-attendance-report',
        loadChildren: () =>
          import('../report-viewer/report-viewer.module').then((m) => m.ReportViewerModule),
        canActivate: [GeneralGuard],
        data: { requiredRoles: ['mnc_report_viewer'] },
      }
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
  ],
})
export class HomeRoutingModule { }
