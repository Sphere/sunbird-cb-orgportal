import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { ProfileV2UtillService } from './home-utill.service'

describe('ProfileV2UtillService', () => {
  let service: ProfileV2UtillService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProfileV2UtillService],
    })
    service = TestBed.inject(ProfileV2UtillService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => httpMock.verify())

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('fetchBadges GETs the user badge endpoint for the given wid', () => {
    let result: any
    service.fetchBadges('w1').subscribe(r => (result = r))
    const req = httpMock.expectOne('/apis/protected/v8/user/badge/for/w1')
    expect(req.request.method).toBe('GET')
    req.flush({ badges: [] })
    expect(result).toEqual({ badges: [] })
  })

  it('reCalculateBadges POSTs to the badge update endpoint', () => {
    let result: any
    service.reCalculateBadges().subscribe(r => (result = r))
    const req = httpMock.expectOne('/apis/protected/v8/user/badge/update')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual({})
    req.flush({ ok: true })
    expect(result).toEqual({ ok: true })
  })

  it('fetchRecentBadge GETs the notification endpoint', () => {
    let result: any
    service.fetchRecentBadge().subscribe(r => (result = r))
    const req = httpMock.expectOne('/apis/protected/v8/user/badge/notification')
    expect(req.request.method).toBe('GET')
    req.flush({ notifications: [] })
    expect(result).toEqual({ notifications: [] })
  })
})
