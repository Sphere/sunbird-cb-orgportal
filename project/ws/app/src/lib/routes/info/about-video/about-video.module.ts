import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { AboutVideoComponent } from './about-video.component'
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio'
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button'
import { MatToolbarModule } from '@angular/material/toolbar'
import { LocaleTranslatorModule, BreadcrumbsOrgModule } from '@sunbird-cb/collection'
import { WidgetResolverModule } from '@sunbird-cb/resolver'
import { RouterModule } from '@angular/router'

@NgModule({
  declarations: [AboutVideoComponent],
  imports: [
    CommonModule,
    MatRadioModule,
    RouterModule,
    WidgetResolverModule,
    LocaleTranslatorModule,
    MatButtonModule,
    BreadcrumbsOrgModule,
    MatToolbarModule,
  ],
  exports: [AboutVideoComponent],
})
export class AboutVideoModule { }
