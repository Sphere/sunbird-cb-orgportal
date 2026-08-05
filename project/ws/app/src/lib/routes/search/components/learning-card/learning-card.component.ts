import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core'
import { NsContent } from '@sunbird-cb/collection'
import { ConfigurationsService, EventService } from '@sunbird-cb/utils'
@Component({
  selector: 'ws-app-learning-card',
  templateUrl: './learning-card.component.html',
  styleUrls: ['./learning-card.component.scss'],
})
export class LearningCardComponent implements OnInit, OnChanges {
  @Input()
  displayType: 'basic' | 'advanced' = 'basic'
  @Input()
  content: NsContent.IContent = {} as NsContent.IContent
  contentProgress = 0
  isExpanded = false
  defaultThumbnail = ''
  /**
   * Bound as a plain string (not SafeHtml) so Angular's default [innerHTML]
   * sanitizer still strips scripts/handlers from this CMS-sourced text;
   * bypassing sanitization here would let a compromised content record
   * execute arbitrary markup in the viewer's browser.
   */
  description = ''
  constructor(
    private readonly events: EventService,
    private readonly configSvc: ConfigurationsService,
  ) { }

  ngOnInit() {
    const instanceConfig = this.configSvc.instanceConfig
    if (instanceConfig && instanceConfig.logos.defaultContent) {
      this.defaultThumbnail = instanceConfig.logos.defaultContent || ''
    }

  }
  ngOnChanges(changes: SimpleChanges) {
    for (const prop in changes) {
      if (prop === 'content' && this.content.description) {
        this.content.description = this.content.description.replace(/<br>/g, '')
        this.description = this.content.description
      }
    }
  }

  raiseTelemetry() {
    this.events.raiseInteractTelemetry(
      {
        type: 'click',
        subType: 'cardSearch',
      },
      {
        contentId: this.content.identifier,
      },
    )
  }
}
