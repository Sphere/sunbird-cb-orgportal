import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ReactiveFormsModule } from '@angular/forms'
import { MatCardModule } from '@angular/material/card'
import { MatIconModule } from '@angular/material/icon'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { NotificationsRoutingModule } from './notifications-routing.module'
import { NotificationsDashboardComponent } from './pages/notifications-dashboard/notifications-dashboard.component'
import { SendNotificationComponent } from './pages/send-notification/send-notification.component'

@NgModule({
  declarations: [
    NotificationsDashboardComponent,
    SendNotificationComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    NotificationsRoutingModule,
  ],
})
export class NotificationsModule { }
