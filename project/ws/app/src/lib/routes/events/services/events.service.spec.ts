import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'

import { EventsService } from './events.service'

describe('EventsService', () => {
  let service: EventsService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] })
    service = TestBed.inject(EventsService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => httpMock.verify())

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('crreateAsset should POST', () => {
    service.crreateAsset({ a: 1 }).subscribe()
    const req = httpMock.expectOne('apis/proxies/v8/action/content/v3/create')
    expect(req.request.method).toBe('POST')
    req.flush({})
  })

  it('uploadFile should POST (the first internal post() call is never subscribed, so only the returned one fires)', () => {
    service.uploadFile('v1', { f: 1 }).subscribe()
    const req = httpMock.expectOne('apis/proxies/v8/upload/action/content/v3/upload/v1')
    req.flush({})
  })

  it('createEvent should POST', () => {
    service.createEvent({}).subscribe()
    const req = httpMock.expectOne('/apis/proxies/v8/event/v4/create')
    req.flush({})
  })

  it('updateEvent should POST', () => {
    service.updateEvent({}).subscribe()
    const req = httpMock.expectOne('/apis/authApi/action/content/v2/hierarchy/update?rootOrg=igot&org=dopt')
    req.flush({})
  })

  it('publishEvent should POST by eventId', () => {
    service.publishEvent('e1').subscribe()
    const req = httpMock.expectOne('/apis/proxies/v8/event/v4/publish/e1')
    expect(req.request.method).toBe('POST')
    req.flush({})
  })

  it('searchEvent should POST', () => {
    service.searchEvent({}).subscribe()
    const req = httpMock.expectOne('/apis/proxies/v8/sunbirdigot/read')
    req.flush({})
  })

  it('getEventsList should POST', () => {
    service.getEventsList({}).subscribe()
    const req = httpMock.expectOne('/apis/proxies/v8/sunbirdigot/search')
    req.flush({})
  })

  it('getParticipants should GET', () => {
    service.getParticipants().subscribe()
    const req = httpMock.expectOne('/apis/protected/v8/portal/mdo/mydepartment?allUsers=true')
    expect(req.request.method).toBe('GET')
    req.flush({})
  })

  it('uploadCoverImage should POST to artifacts endpoint', () => {
    service.uploadCoverImage({}, 'e1').subscribe()
    const req = httpMock.expectOne('/apis/authContent/upload/igot/dopt/Public/e1/artifacts')
    req.flush({})
  })

  it('getEvents should GET', () => {
    service.getEvents().subscribe()
    const req = httpMock.expectOne('/apis/proxies/v8/sunbirdigot/read')
    expect(req.request.method).toBe('GET')
    req.flush({})
  })

  it('searchUser should GET by value', () => {
    service.searchUser('john').subscribe()
    const req = httpMock.expectOne('/apis/proxies/v8/user/v1/autocomplete/john')
    req.flush({})
  })

  it('getEventDetails should GET by eventID', () => {
    service.getEventDetails('e1').subscribe()
    const req = httpMock.expectOne('/apis/proxies/v8/event/v4/read/e1')
    req.flush({})
  })
})
