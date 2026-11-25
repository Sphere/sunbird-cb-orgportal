import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatDividerModule } from '@angular/material/divider'
import { MatButtonModule } from '@angular/material/button'
import { MatRippleModule } from '@angular/material/core'
import { MatIconModule } from '@angular/material/icon'

import { BreadcrumbsOrgModule } from '@sunbird-cb/collection'

import { NotificationV2RoutingModule } from './notification-v2-routing.module'
import { HomeComponent } from './components/home/home.component'
import { NotificationService } from './services/notification.service'
import { NotificationApiService } from './services/notification-api.service'
import { NotificationEventComponent } from './components/notification-event/notification-event.component'

@NgModule({
  declarations: [HomeComponent, NotificationEventComponent],
  imports: [
    CommonModule,
    NotificationV2RoutingModule,
    MatToolbarModule,
    MatDividerModule,
    MatButtonModule,
    MatRippleModule,
    MatIconModule,
    BreadcrumbsOrgModule,
  ],
  providers: [NotificationApiService, NotificationService],
})
export class NotificationV2Module { }
