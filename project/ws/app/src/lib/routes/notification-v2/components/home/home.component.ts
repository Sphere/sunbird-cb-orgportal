import { Component, OnInit, OnDestroy } from '@angular/core'
import { ConfigurationsService, NsPage, TFetchStatus } from '@sunbird-cb/utils'

import { NotificationApiService } from '../../services/notification-api.service'
import { ENotificationType, INotification } from '../../models/notifications.model'
import { NotificationService } from '../../services/notification.service'
import { noop, Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { Router } from '@angular/router'

@Component({
  standalone: false,
  selector: 'ws-app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>()

  showMarkAsRead = false
  pageNavbar: Partial<NsPage.INavBackground> = this.configSvc.pageNavBar
  actionNotifications: INotification[]
  infoNotifications: INotification[]
  actionNotificationsFetchStatus: TFetchStatus
  infoNotificationsFetchStatus: TFetchStatus
  actionNotificationsNextPage?: string
  infoNotificationsNextPage?: string
  private pageSize: number

  constructor(
    private configSvc: ConfigurationsService,
    private notificationApi: NotificationApiService,
    private notificationSvc: NotificationService,
    private router: Router,
  ) {
    this.pageSize = 5
    this.actionNotifications = []
    this.infoNotifications = []
    this.actionNotificationsFetchStatus = 'none'
    this.infoNotificationsFetchStatus = 'none'
  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

  ngOnInit() {
    this.fetchActionNotifications()
    this.fetchInfoNotifications()
    this.getCount()
  }

  fetchActionNotifications() {
    this.actionNotificationsFetchStatus = 'fetching'
    this.notificationApi
      .getNotifications(ENotificationType.Action, this.pageSize, this.actionNotificationsNextPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        notifications => {
          this.actionNotifications = this.actionNotifications.concat(notifications.data)
          this.actionNotificationsNextPage = notifications.page
          this.actionNotificationsFetchStatus = 'done'
        },
        () => {
          this.actionNotificationsFetchStatus = 'error'
        },
      )
  }

  fetchInfoNotifications() {
    this.infoNotificationsFetchStatus = 'fetching'
    this.notificationApi
      .getNotifications(
        ENotificationType.Information,
        this.pageSize,
        this.infoNotificationsNextPage,
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        notifications => {
          this.infoNotifications = this.infoNotifications.concat(notifications.data)
          this.infoNotificationsNextPage = notifications.page
          this.infoNotificationsFetchStatus = 'done'
        },
        () => {
          this.infoNotificationsFetchStatus = 'error'
        },
      )
  }

  onClickNotification(notification: INotification) {
    if (!notification.seen) {
      this.notificationApi
        .updateNotificationSeenStatus(notification.notificationId, notification.classifiedAs)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          notification.seen = true
        },         noop)
    }

    this.notificationSvc.mapRoute(notification)
  }

  getCount() {
    this.notificationApi.getCount().pipe(takeUntil(this.destroy$)).subscribe(count => {
      if (count > 0) {
        this.showMarkAsRead = true
      }
    })
  }

  readAllNotifications() {
    this.notificationApi.updateNotificationSeenStatus().pipe(takeUntil(this.destroy$)).subscribe(_data => {
      this.router.navigate([], { queryParams: { ts: Date.now() } })
      this.showMarkAsRead = false
      this.actionNotifications.forEach((notification: INotification) => {
        notification.seen = true
      })
      this.infoNotifications.forEach((notification: INotification) => {
        notification.seen = true
      })
    })
  }
}
