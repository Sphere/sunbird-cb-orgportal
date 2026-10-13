import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { ReportViewerComponent } from './components/report-viewer/report-viewer.component'

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: ReportViewerComponent,
      },
    ]),
  ],
  exports: [RouterModule],
})
export class ReportViewerRoutingModule { }
