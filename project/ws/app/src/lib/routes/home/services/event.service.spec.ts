import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'

import { EventService } from './event.service'

describe('EventService', () => {
  let service: EventService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
    service = TestBed.inject(EventService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should get all events', () => {
    service.getAllEvents().subscribe(res => expect(res).toEqual({ a: 1 }))
    const req = httpMock.expectOne('/apis/protected/v8/sunbirdrRcCertificate/events')
    expect(req.request.method).toBe('GET')
    req.flush({ a: 1 })
  })

  it('should get event by id', () => {
    service.getEventById('e1').subscribe(res => expect(res).toEqual({ id: 'e1' }))
    const req = httpMock.expectOne('/apis/protected/v8/sunbirdrRcCertificate/events/e1')
    expect(req.request.method).toBe('GET')
    req.flush({ id: 'e1' })
  })

  it('should create event', () => {
    const payload = { name: 'evt' }
    service.createEvent(payload).subscribe(res => expect(res).toEqual({ ok: true }))
    const req = httpMock.expectOne('/apis/protected/v8/sunbirdrRcCertificate/events')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual(payload)
    req.flush({ ok: true })
  })

  it('should edit event', () => {
    const payload = { id: 'e1', name: 'evt2' }
    service.editEvent(payload).subscribe(res => expect(res).toEqual({ ok: true }))
    const req = httpMock.expectOne('/apis/protected/v8/sunbirdrRcCertificate/events/edit')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual(payload)
    req.flush({ ok: true })
  })

  it('should add participants with eventId/users payload', () => {
    const users = [{ id: 'u1' }]
    service.addParticipants('e1', users).subscribe(res => expect(res).toEqual({ ok: true }))
    const req = httpMock.expectOne('/apis/protected/v8/sunbirdrRcCertificate/events/users')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual({ eventId: 'e1', users })
    req.flush({ ok: true })
  })

  it('should get participants', () => {
    service.getParticipants('e1').subscribe(res => expect(res).toEqual({ users: [] }))
    const req = httpMock.expectOne('/apis/protected/v8/sunbirdrRcCertificate/events/e1/users')
    expect(req.request.method).toBe('GET')
    req.flush({ users: [] })
  })

  it('should generate certificate with eventId/templateId payload', () => {
    service.generateCertificate('e1', 't1').subscribe(res => expect(res).toEqual({ ok: true }))
    const req = httpMock.expectOne('/apis/protected/v8/sunbirdrRcCertificate/events/generateCertificates')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual({ eventId: 'e1', templateId: 't1' })
    req.flush({ ok: true })
  })

  it('should download certificates as blob', () => {
    const blob = new Blob(['data'])
    service.downloadCertificates('e1').subscribe(res => expect(res).toBe(blob))
    const req = httpMock.expectOne('/apis/protected/v8/sunbirdrRcCertificate/downloadCertificates/e1')
    expect(req.request.method).toBe('GET')
    expect(req.request.responseType).toBe('blob')
    req.flush(blob)
  })

  it('should get user profile and extract result.response', () => {
    service.getUserProfile('u1').subscribe(res => expect(res).toEqual({ name: 'John' }))
    const req = httpMock.expectOne('/apis/proxies/v8/api/user/v2/read/u1')
    expect(req.request.method).toBe('GET')
    req.flush({ result: { response: { name: 'John' } } })
  })

  it('should return undefined for user profile when result/response is missing', () => {
    service.getUserProfile('u1').subscribe(res => expect(res).toBeUndefined())
    const req = httpMock.expectOne('/apis/proxies/v8/api/user/v2/read/u1')
    req.flush({})
  })

  it('should update currentEvent via updateEvent', done => {
    const evt = { id: 'e1' }
    service.currentEvent.subscribe(val => {
      if (val) {
        expect(val).toEqual(evt)
        done()
      }
    })
    service.updateEvent(evt)
  })

  it('should update currentUserData via setUserData', done => {
    const data = { id: 'u1' }
    service.currentUserData.subscribe(val => {
      if (val) {
        expect(val).toEqual(data)
        done()
      }
    })
    service.setUserData(data)
  })
})
