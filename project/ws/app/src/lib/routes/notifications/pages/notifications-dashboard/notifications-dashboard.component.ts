import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { NOTIFICATION_CARDS, NotificationCard } from '../../constants/notifications.constants'

@Component({
  selector: 'ws-app-notifications-dashboard',
  templateUrl: './notifications-dashboard.component.html',
  styleUrls: ['./notifications-dashboard.component.scss'],
  standalone: false,
})
export class NotificationsDashboardComponent {
  readonly cards: NotificationCard[] = NOTIFICATION_CARDS

  constructor(private readonly router: Router) { }

  open(card: NotificationCard): void {
    if (!card.redirectLink) {
      return
    }
    this.router.navigateByUrl(card.redirectLink)
  }
}
