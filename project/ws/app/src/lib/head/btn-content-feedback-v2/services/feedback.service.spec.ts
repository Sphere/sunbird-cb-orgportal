import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'

import { FeedbackService } from './feedback.service'

describe('FeedbackService', () => {
  let service: FeedbackService
  let httpMock: HttpTestingController
  const BASE = '/apis/protected/v8/user/feedbackV2'

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] })
    service = TestBed.inject(FeedbackService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => httpMock.verify())

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('searchFeedback should POST to /search', () => {
    service.searchFeedback({} as any).subscribe()
    const req = httpMock.expectOne(`${BASE}/search`)
    expect(req.request.method).toBe('POST')
    req.flush({})
  })

  it('getFeedbackThread should GET by feedbackId', () => {
    service.getFeedbackThread('f1').subscribe()
    const req = httpMock.expectOne(`${BASE}/f1`)
    expect(req.request.method).toBe('GET')
    req.flush([])
  })

  it('submitPlatformFeedback should POST to /platform', () => {
    service.submitPlatformFeedback({} as any).subscribe()
    const req = httpMock.expectOne(`${BASE}/platform`)
    req.flush({})
  })

  it('contentShareNew should POST to the content-share endpoint', () => {
    service.contentShareNew({} as any).subscribe()
    const req = httpMock.expectOne('/apis/protected/v8/user/share/content')
    req.flush({})
  })

  it('submitContentFeedback should POST by contentId', () => {
    service.submitContentFeedback({ contentId: 'c1' } as any).subscribe()
    const req = httpMock.expectOne(`${BASE}/content/c1`)
    req.flush({})
  })

  it('submitContentRequest should POST to /content-request', () => {
    service.submitContentRequest({} as any).subscribe()
    const req = httpMock.expectOne(`${BASE}/content-request`)
    req.flush({})
  })

  it('submitServiceRequest should POST to /service-request', () => {
    service.submitServiceRequest({} as any).subscribe()
    const req = httpMock.expectOne(`${BASE}/service-request`)
    req.flush({})
  })

  it('getFeedbackSummary should GET /feedback-summary', () => {
    service.getFeedbackSummary().subscribe()
    const req = httpMock.expectOne(`${BASE}/feedback-summary`)
    req.flush({})
  })

  describe('updateFeedbackStatus', () => {
    it('should PATCH without a category query param when none is given', () => {
      service.updateFeedbackStatus('r1').subscribe()
      const req = httpMock.expectOne(`${BASE}/r1`)
      expect(req.request.method).toBe('PATCH')
      req.flush({})
    })

    it('should PATCH with a category query param when given', () => {
      service.updateFeedbackStatus('r1', 'bug').subscribe()
      const req = httpMock.expectOne(`${BASE}/r1?category=bug`)
      req.flush({})
    })
  })

  it('getFeedbackConfig should GET /config', () => {
    service.getFeedbackConfig().subscribe()
    const req = httpMock.expectOne(`${BASE}/config`)
    req.flush({})
  })
})
