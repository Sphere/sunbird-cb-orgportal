import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { NotificationsDashboardComponent } from './pages/notifications-dashboard/notifications-dashboard.component'
import { SendNotificationComponent } from './pages/send-notification/send-notification.component'

const routes: Routes = [
  {
    path: '',
    component: NotificationsDashboardComponent,
  },
  {
    path: 'course',
    component: SendNotificationComponent,
    data: { kind: 'course' },
  },
  {
    path: 'competency',
    component: SendNotificationComponent,
    data: { kind: 'competency' },
  },
  {
    path: 'program',
    component: SendNotificationComponent,
    data: { kind: 'program' },
  },
  {
    path: 'certificate',
    component: SendNotificationComponent,
    data: { kind: 'certificate' },
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NotificationsRoutingModule { }
