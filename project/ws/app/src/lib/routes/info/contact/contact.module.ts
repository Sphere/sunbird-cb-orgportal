import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ContactHomeComponent } from './components/contact-home.component'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card'
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button'
import { BreadcrumbsOrgModule } from '@sunbird-cb/collection'

@NgModule({
  declarations: [ContactHomeComponent],
  imports: [CommonModule, MatToolbarModule, MatCardModule, BreadcrumbsOrgModule, MatButtonModule],
  exports: [ContactHomeComponent],
})
export class ContactModule { }
