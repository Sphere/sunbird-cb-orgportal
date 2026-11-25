import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { PushNotificationService } from './push-notification.service'

describe('PushNotificationService', () => {
  let service: PushNotificationService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PushNotificationService],
    })
    service = TestBed.inject(PushNotificationService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('sendByToken should POST the request wrapped in { request }', () => {
    const request = { title: 'T', body: 'B', userIds: ['u1'] }
    let response: unknown
    service.sendByToken(request).subscribe(res => (response = res))

    const req = httpMock.expectOne('/apis/protected/v8/pushNotification/send-by-token')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual({ request })
    req.flush({ ok: true })
    expect(response).toEqual({ ok: true })
  })

  it('sendByTopic should POST the request as the body', () => {
    const request = { topic: 'org1', title: 'T', body: 'B' }
    service.sendByTopic(request).subscribe()

    const req = httpMock.expectOne('/apis/protected/v8/pushNotification/send-by-topic')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual(request)
    req.flush({})
  })
})
