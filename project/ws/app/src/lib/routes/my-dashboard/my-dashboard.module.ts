import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button'
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card'
import { MatIconModule } from '@angular/material/icon'
import { MatToolbarModule } from '@angular/material/toolbar'
import { BreadcrumbsOrgModule } from '@sunbird-cb/collection'
import { MyDashboardHomeComponent } from './components/my-dashboard-home/my-dashboard-home.component'
import { MyDashboardRoutingModule } from './my-dashboard-routing.module'
// import { RainDashboardsModule } from '@sunbird-cb/rain-dashboards'
import { SafeUrlPipe } from './components/my-dashboard-home/my-dashboard.pipe'
import { ComponentSharedModule } from '../workallocation-v2/components/component-shared.module'
import { MatTabsModule } from '@angular/material/tabs'

@NgModule({
  declarations: [MyDashboardHomeComponent, SafeUrlPipe],
  imports: [
    CommonModule,
    MatTabsModule,
    MyDashboardRoutingModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    BreadcrumbsOrgModule,
    ComponentSharedModule,
    // RainDashboardsModule,
  ], exports: [MyDashboardHomeComponent],
})
export class MyDashboardModule { }
