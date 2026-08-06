import { HttpErrorResponse } from '@angular/common/http'
import { Component, OnDestroy, OnInit } from '@angular/core'
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'
import { Subscription } from 'rxjs'
import { ReportViewerService } from '../../services/report-viewer.service'

export type TReportError = 'forbidden' | 'generic'

@Component({
  selector: 'ws-app-report-viewer',
  templateUrl: './report-viewer.component.html',
  styleUrls: ['./report-viewer.component.scss'],
  standalone: false,
})
export class ReportViewerComponent implements OnInit, OnDestroy {

  iframeSrc: SafeResourceUrl | null = null
  lastUpdated: string | null = null

  /** True while the cheap metadata probe is in flight. */
  isMetaLoading = true
  /** True from the moment the iframe src is set until the iframe fires `load`. */
  isReportLoading = false
  errorType: TReportError | null = null

  private metaSubscription: Subscription | null = null

  constructor(
    private domSanitizer: DomSanitizer,
    private reportViewerSvc: ReportViewerService,
  ) { }

  ngOnInit() {
    this.loadReport()
  }

  ngOnDestroy() {
    if (this.metaSubscription) {
      this.metaSubscription.unsubscribe()
    }
  }

  /**
   * Probes the report metadata first, then points the iframe at the content URL. Ordering
   * matters: a failed request inside an iframe would render the error body as if it were
   * the report, so authorization is resolved before the src is ever bound.
   */
  loadReport(): void {
    this.resetState()
    this.metaSubscription = this.reportViewerSvc.getReportMeta().subscribe(
      meta => {
        this.lastUpdated = (meta && meta.lastModified) || null
        this.isMetaLoading = false
        this.isReportLoading = true
        this.setIframeSource(this.reportViewerSvc.getReportContentUrl())
      },
      (error: HttpErrorResponse) => {
        this.isMetaLoading = false
        this.errorType = error && error.status === 403 ? 'forbidden' : 'generic'
      },
    )
  }

  /** Bound to the iframe's `load` event — the report body runs to several megabytes. */
  onReportLoaded(): void {
    this.isReportLoading = false
  }

  private resetState(): void {
    this.iframeSrc = null
    this.lastUpdated = null
    this.isMetaLoading = true
    this.isReportLoading = false
    this.errorType = null
  }

  /** Sanitizes the report URL before binding it in the template. */
  private setIframeSource(url: string): void {
    this.iframeSrc = this.domSanitizer.bypassSecurityTrustResourceUrl(url)
  }
}
