import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core'
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'
import { IFrac } from '../../interfaces/frac.model'
import { CustomSnackbarComponent } from '../custom-snackbar/custom-snackbar.component'
import { CustomSnackbarService } from '../../services/custom-snackbar.service'
import { FracService } from '../../services/frac.service'

const FRAC_LOCAL_FALLBACK_PATH = '/frac'

@Component({
  selector: 'ws-app-frac',
  templateUrl: './frac.component.html',
  styleUrls: ['./frac.component.scss'],
})

export class FracComponent implements OnInit, OnDestroy, AfterViewInit {
  widgetData: IFrac = {
    iframeId: 'fracData',
    title: 'Frac',
    containerStyle: '',
    containerClass: '',
    iframeSrc: FRAC_LOCAL_FALLBACK_PATH,
  }
  iframeSrc: SafeResourceUrl | null = null
  @ViewChild(CustomSnackbarComponent) snackbar!: CustomSnackbarComponent
  constructor(
    private domSanitizer: DomSanitizer,
    private fracService: FracService,
    private snackService: CustomSnackbarService
  ) { }

  /**
   * Registers the custom snackbar after the child view is ready.
   */
  ngAfterViewInit(): void {
    this.snackService.register(this.snackbar)
  }

  /**
   * Loads FRAC iframe config from server and applies a fallback if config is missing.
   */
  ngOnInit(): void {
    this.fracService.fetchFrac().then((result: IFrac) => {
      if (result) {
        this.widgetData = result
        if (this.widgetData && this.widgetData.iframeSrc) {
          this.setIframeSource(this.widgetData.iframeSrc)
        }
      } else {
        this.setIframeSource(`${window.location.origin}${FRAC_LOCAL_FALLBACK_PATH}`)
      }
    })
  }

  /**
   * Lifecycle hook kept for future cleanup work.
   */
  ngOnDestroy(): void {
    // No active subscriptions in this component.
  }

  /** Sanitizes iframe URL before binding it in template. */
  private setIframeSource(url: string): void {
    this.iframeSrc = this.domSanitizer.bypassSecurityTrustResourceUrl(url)
  }
}
