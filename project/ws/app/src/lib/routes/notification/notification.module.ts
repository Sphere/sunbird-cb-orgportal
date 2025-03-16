import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatIconModule } from '@angular/material/icon'
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button'
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list'
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card'
import { MatDividerModule } from '@angular/material/divider'
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner'
import { NotificationRoutingModule } from './notification-routing.module'
import { NotificationComponent } from './components/notification/notification.component'
import { PipeLimitToModule } from '@sunbird-cb/utils'
import { BreadcrumbsOrgModule } from '@sunbird-cb/collection'

@NgModule({
  declarations: [NotificationComponent],
  imports: [
    CommonModule,
    NotificationRoutingModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatCardModule,
    MatDividerModule,

    BreadcrumbsOrgModule,
    PipeLimitToModule,
    MatProgressSpinnerModule,
  ],
})
export class NotificationModule { }
