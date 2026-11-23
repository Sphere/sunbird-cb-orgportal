import { Component } from '@angular/core'
import { Router } from '@angular/router'
import {
  NOTIFICATION_CARDS,
  NOTIFICATION_SECTIONS,
  NotificationCard,
} from '../../constants/notifications.constants'

@Component({
  selector: 'ws-app-notifications-dashboard',
  templateUrl: './notifications-dashboard.component.html',
  styleUrls: ['./notifications-dashboard.component.scss'],
  standalone: false,
})
export class NotificationsDashboardComponent {
  /** Cards grouped by delivery type: topic-based first, then token-based. */
  readonly sections = NOTIFICATION_SECTIONS.map(section => ({
    ...section,
    cards: NOTIFICATION_CARDS.filter(card => card.delivery === section.delivery),
  }))

  constructor(private readonly router: Router) { }

  open(card: NotificationCard): void {
    if (!card.redirectLink) {
      return
    }
    this.router.navigateByUrl(card.redirectLink)
  }
}
