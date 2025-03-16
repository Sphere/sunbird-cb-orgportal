import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MobileAppHomeComponent } from './components/mobile-app-home.component'
import {
  MatLegacyCardModule as MatCardModule,
} from '@angular/material/legacy-card'
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatIconModule } from '@angular/material/icon'
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button'
import { BreadcrumbsOrgModule } from '@sunbird-cb/collection'

@NgModule({
  declarations: [MobileAppHomeComponent],
  imports: [
    CommonModule,
    MatToolbarModule,
    MatCardModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    BreadcrumbsOrgModule,
  ],
  exports: [MobileAppHomeComponent],
})
export class MobileAppModule { }
