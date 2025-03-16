import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { InterestComponent } from './interest/interest.component'
import { HorizontalScrollerModule } from '@sunbird-cb/utils'
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card'
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner'
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox'
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button'
import { MatIconModule } from '@angular/material/icon'
import { MatToolbarModule } from '@angular/material/toolbar'
import { BreadcrumbsOrgModule } from '@sunbird-cb/collection'
// import { InterestService } from '../../../profile/routes/interest/services/interest.service'

@NgModule({
  declarations: [InterestComponent],
  imports: [
    CommonModule,
    HorizontalScrollerModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    BreadcrumbsOrgModule,

  ],
  exports: [InterestComponent],
  providers: [
    // InterestService
  ],
})
export class InterestModules { }
