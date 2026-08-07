import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { Router } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { of, throwError } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { NotificationApiService } from '../../services/notification-api.service'
import { NotificationService } from '../../services/notification.service'

import { HomeComponent } from './home.component'

describe('HomeComponent', () => {
  let component: HomeComponent
  let fixture: ComponentFixture<HomeComponent>
  let notificationApi: ReturnType<typeof createSpyObj>
  let notificationSvc: ReturnType<typeof createSpyObj>
  let router: ReturnType<typeof createSpyObj>

  const build = () => {
    notificationApi = createSpyObj('NotificationApiService', [
      'getNotifications', 'updateNotificationSeenStatus', 'getCount',
    ])
    notificationSvc = createSpyObj('NotificationService', ['mapRoute'])
    router = createSpyObj('Router', ['navigate'])
    notificationApi.getNotifications.mockReturnValue(of({ data: [], page: undefined }))
    notificationApi.getCount.mockReturnValue(of(0))

    TestBed.configureTestingModule({
      declarations: [HomeComponent],
      providers: [
        { provide: NotificationApiService, useValue: notificationApi },
        { provide: NotificationService, useValue: notificationSvc },
        { provide: Router, useValue: router },
        { provide: ConfigurationsService, useValue: { pageNavBar: {} } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(HomeComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  afterEach(() => TestBed.resetTestingModule())

  it('should create and fetch both notification lists plus the count', () => {
    build()
    expect(component).toBeTruthy()
    expect(component.actionNotificationsFetchStatus).toBe('done')
    expect(component.infoNotificationsFetchStatus).toBe('done')
  })

  describe('fetchActionNotifications', () => {
    it('should append data and store the next page on success', () => {
      build()
      notificationApi.getNotifications.mockReturnValue(of({ data: [{ id: 1 }], page: 'p2' }))
      component.fetchActionNotifications()
      expect(component.actionNotifications).toContainEqual({ id: 1 })
      expect(component.actionNotificationsNextPage).toBe('p2')
    })

    it('should mark the status as error on failure', () => {
      build()
      notificationApi.getNotifications.mockReturnValue(throwError(new Error('boom')))
      component.fetchActionNotifications()
      expect(component.actionNotificationsFetchStatus).toBe('error')
    })
  })

  describe('fetchInfoNotifications', () => {
    it('should append data and store the next page on success', () => {
      build()
      notificationApi.getNotifications.mockReturnValue(of({ data: [{ id: 2 }], page: 'p3' }))
      component.fetchInfoNotifications()
      expect(component.infoNotifications).toContainEqual({ id: 2 })
      expect(component.infoNotificationsNextPage).toBe('p3')
    })

    it('should mark the status as error on failure', () => {
      build()
      notificationApi.getNotifications.mockReturnValue(throwError(new Error('boom')))
      component.fetchInfoNotifications()
      expect(component.infoNotificationsFetchStatus).toBe('error')
    })
  })

  describe('onClickNotification', () => {
    it('should mark an unseen notification as seen and route to it', () => {
      build()
      notificationApi.updateNotificationSeenStatus.mockReturnValue(of({}))
      const notification: any = { seen: false, notificationId: 'n1', classifiedAs: 'Action' }
      component.onClickNotification(notification)
      expect(notification.seen).toBe(true)
      expect(notificationApi.updateNotificationSeenStatus).toHaveBeenCalledWith('n1', 'Action')
      expect(notificationSvc.mapRoute).toHaveBeenCalledWith(notification)
    })

    it('should skip the seen-status update for an already-seen notification', () => {
      build()
      const notification: any = { seen: true, notificationId: 'n1' }
      component.onClickNotification(notification)
      expect(notificationApi.updateNotificationSeenStatus).not.toHaveBeenCalled()
      expect(notificationSvc.mapRoute).toHaveBeenCalledWith(notification)
    })
  })

  describe('getCount', () => {
    it('should show the mark-as-read action when count is positive', () => {
      build()
      notificationApi.getCount.mockReturnValue(of(3))
      component.getCount()
      expect(component.showMarkAsRead).toBe(true)
    })

    it('should not show the mark-as-read action when count is zero', () => {
      build()
      notificationApi.getCount.mockReturnValue(of(0))
      component.getCount()
      expect(component.showMarkAsRead).toBe(false)
    })
  })

  it('readAllNotifications should mark everything seen and refresh the route', () => {
    build()
    notificationApi.updateNotificationSeenStatus.mockReturnValue(of({}))
    component.showMarkAsRead = true
    component.actionNotifications = [{ seen: false } as any]
    component.infoNotifications = [{ seen: false } as any]
    component.readAllNotifications()
    expect(router.navigate).toHaveBeenCalledWith([], { queryParams: expect.any(Object) })
    expect(component.showMarkAsRead).toBe(false)
    expect(component.actionNotifications[0].seen).toBe(true)
    expect(component.infoNotifications[0].seen).toBe(true)
  })

  it('ngOnDestroy should complete the destroy subject', () => {
    build()
    const completeSpy = jest.spyOn((component as any).destroy$, 'complete')
    component.ngOnDestroy()
    expect(completeSpy).toHaveBeenCalled()
  })
})
