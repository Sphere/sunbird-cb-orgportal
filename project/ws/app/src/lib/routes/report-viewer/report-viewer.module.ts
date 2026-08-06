import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { ReportViewerComponent } from './components/report-viewer/report-viewer.component'
import { ReportViewerRoutingModule } from './report-viewer-routing.module'

@NgModule({
  declarations: [ReportViewerComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ReportViewerRoutingModule,
  ],
})
export class ReportViewerModule { }
