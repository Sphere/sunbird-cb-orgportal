import { Component, OnInit } from '@angular/core'
import { SafeResourceUrl } from '@angular/platform-browser'
import { ActivatedRoute } from '@angular/router'
import { SanitizerService } from 'src/app/services/sanitizer.service'
import { EiframeUrl } from '../../interfaces/event-details.model'
import { EventService } from '../../services/event.service'

@Component({
  selector: 'ws-app-iframe-loader',
  templateUrl: './iframe-loader.component.html',
  styleUrls: ['./iframe-loader.component.scss'],
})
export class IframeLoaderComponent implements OnInit {
  iframeSrc: SafeResourceUrl | null = null
  iframeUrl: string | null = null
  iframeType: string | null = null
  constructor(
    private readonly sanitizerService: SanitizerService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly appEventSvc: EventService,
  ) { }

  ngOnInit() {
    this.appEventSvc.bannerisEnabled.next(false)
    this.iframeType = this.activatedRoute.snapshot.paramMap.get('iframe')
    if (this.iframeType === EiframeUrl.QUIZ) {
      this.iframeUrl = ''
    } else if (this.iframeType === EiframeUrl.WEBEX) {
      this.iframeUrl = ''
    } else if (this.iframeType === EiframeUrl.VR) {
      this.iframeUrl = ''
    }
    this.iframeSrc = this.iframeUrl ? this.sanitizerService.trustResourceUrl(this.iframeUrl) : null
  }

}
