import { TestBed } from '@angular/core/testing'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient } from '@angular/common/http'

import { NotificationApiService } from './notification-api.service'
import { ENotificationType } from '../models/notifications.model'

describe('NotificationApiService', () => {
  let service: NotificationApiService
  let httpMock: HttpTestingController
  const BASE = '/apis/protected/v8/user/notifications'

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NotificationApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    })
    service = TestBed.inject(NotificationApiService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => httpMock.verify())

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getNotifications', () => {
    it('should GET with no query params when none are given', () => {
      service.getNotifications().subscribe()
      const req = httpMock.expectOne(r => r.url === BASE)
      expect(req.request.params.keys().length).toBe(0)
      req.flush({})
    })

    it('should GET with classification/size/page params when given', () => {
      service.getNotifications('Action', 5, 'p2').subscribe()
      const req = httpMock.expectOne(r => r.url === BASE)
      expect(req.request.params.get('classification')).toBe('Action')
      expect(req.request.params.get('size')).toBe('5')
      expect(req.request.params.get('page')).toBe('p2')
      req.flush({})
    })
  })

  it('getCount should GET the badge count endpoint', () => {
    service.getCount().subscribe()
    const req = httpMock.expectOne('/apis/protected/v8/user/iconBadge/unseenNotificationCount')
    req.flush(3)
  })

  describe('updateNotificationSeenStatus', () => {
    it('should PATCH the classification-specific endpoint with the seen status', () => {
      service.updateNotificationSeenStatus('n1', ENotificationType.Action, false).subscribe()
      const req = httpMock.expectOne(`${BASE}/n1/${ENotificationType.Action}`)
      expect(req.request.method).toBe('PATCH')
      expect(req.request.body).toEqual({ seen: false })
      req.flush({})
    })

    it('should default status to true', () => {
      service.updateNotificationSeenStatus('n1', ENotificationType.Information).subscribe()
      const req = httpMock.expectOne(`${BASE}/n1/${ENotificationType.Information}`)
      expect(req.request.body).toEqual({ seen: true })
      req.flush({})
    })

    it('should PATCH the base endpoint with an empty body when id/classification are missing', () => {
      service.updateNotificationSeenStatus().subscribe()
      const req = httpMock.expectOne(BASE)
      expect(req.request.body).toEqual({})
      req.flush({})
    })
  })
})
