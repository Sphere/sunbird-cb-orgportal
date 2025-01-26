import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FaqHomeComponent } from './components/faq-home.component'
import {
  MatToolbarModule
} from '@angular/material/toolbar'
import { MatListModule } from '@angular/material/list'
import { MatSidenavModule } from '@angular/material/sidenav'
import { MatDividerModule } from '@angular/material/divider'
import { MatCardModule } from '@angular/material/card'
import { MatIconModule } from '@angular/material/icon'
import { MatButtonModule } from '@angular/material/button'
import { RouterModule } from '@angular/router'
import { BreadcrumbsOrgModule } from '@sunbird-cb/collection'
import { PipeSafeSanitizerModule } from '@sunbird-cb/utils'

@NgModule({
  declarations: [FaqHomeComponent],
  imports: [
    CommonModule,
    MatToolbarModule,
    MatListModule,
    MatSidenavModule,
    MatCardModule,
    MatDividerModule,
    RouterModule,
    MatIconModule,
    BreadcrumbsOrgModule,
    MatButtonModule,
    PipeSafeSanitizerModule,
  ],
  exports: [FaqHomeComponent],
})
export class FaqModule { }
