import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { of, throwError } from 'rxjs'
import { createSpyObj } from '../../../../../../../../src/test-utils/create-spy-obj'
import { PushNotificationService } from '../../../../../../../../src/app/services/push-notification.service'
import {
  API_END_POINTS,
  NOTIFICATION_DEFAULT_LOGOS,
  NOTIFICATION_LIMITS,
  NotificationKind,
} from '../constants/notifications.constants'
import { NotificationApiService, NotificationItem, TopicSendResult } from './notification-api.service'

describe('NotificationApiService', () => {
  let service: NotificationApiService
  let httpMock: HttpTestingController
  let pushSvc: jest.Mocked<PushNotificationService>

  const item: NotificationItem = { identifier: 'do_1', name: 'Course 1', image: 'https://img/1.png' }
  /** The push request's `data` payload, or {} when absent. */
  const dataOf = (request: { data?: { [key: string]: string } }) => request.data ?? {}

  beforeEach(() => {
    pushSvc = createSpyObj<PushNotificationService>('PushNotificationService', ['sendByToken', 'sendByTopic'])
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        NotificationApiService,
        { provide: PushNotificationService, useValue: pushSvc },
      ],
    })
    service = TestBed.inject(NotificationApiService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  describe('getOrganisations', () => {
    it('should drop orgs without id, fall back on channel/unknown names and sort by name', () => {
      let result: unknown
      service.getOrganisations().subscribe(res => (result = res))

      const req = httpMock.expectOne(API_END_POINTS.ORG_SEARCH)
      expect(req.request.body.request.limit).toBe(NOTIFICATION_LIMITS.ORG_LIST_LIMIT)
      req.flush({
        result: {
          response: {
            content: [
              { id: '2', orgName: 'Zeta' },
              { orgName: 'No id' },
              { id: '1', channel: 'alpha-channel' },
              { id: '3' },
            ],
          },
        },
      })

      expect(result).toEqual([
        { id: '1', name: 'alpha-channel' },
        { id: '3', name: 'Unknown Organisation' },
        { id: '2', name: 'Zeta' },
      ])
    })

    it('should return an empty list when the response has no content', () => {
      let result: unknown
      service.getOrganisations().subscribe(res => (result = res))
      httpMock.expectOne(API_END_POINTS.ORG_SEARCH).flush({})
      expect(result).toEqual([])
    })
  })

  describe('getCourses', () => {
    it('should search live courses and map poster/app icon images', () => {
      let result: unknown
      service.getCourses().subscribe(res => (result = res))

      const req = httpMock.expectOne(API_END_POINTS.COURSE_SEARCH)
      expect(req.request.body.request.filters).toEqual({ primaryCategory: ['Course'], status: ['Live'] })
      req.flush({
        result: {
          content: [
            { identifier: 'c1', name: 'One', posterImage: 'poster.png', appIcon: 'icon.png' },
            { identifier: 'c2', name: 'Two', appIcon: 'icon2.png' },
            { identifier: 'c3', name: 'Three' },
            { identifier: 'c4' },
            { name: 'No id' },
          ],
        },
      })

      expect(result).toEqual([
        { identifier: 'c1', name: 'One', image: 'poster.png' },
        { identifier: 'c2', name: 'Two', image: 'icon2.png' },
        { identifier: 'c3', name: 'Three', image: '' },
      ])
    })

    it('should return an empty list when the response has no content', () => {
      let result: unknown
      service.getCourses().subscribe(res => (result = res))
      httpMock.expectOne(API_END_POINTS.COURSE_SEARCH).flush(null)
      expect(result).toEqual([])
    })
  })

  describe('getPrograms', () => {
    it('should collect programs from anywhere in the form, dedupe them and sort by name', () => {
      let result: unknown
      service.getPrograms('org1').subscribe(res => (result = res))

      const req = httpMock.expectOne(API_END_POINTS.FORM_READ)
      expect(req.request.body.request.rootOrgId).toBe('org1')
      expect(req.request.body.request.type).toBe('app_layout')
      req.flush({
        result: {
          form: {
            data: {
              schemas: {
                LAYOUT_DATA: {
                  tab1: { contents: { programConfig: { programs: [
                    { playlistConfigId: 'p2', title: ' Zeta ', thumbnail: ' z.png ' },
                    { playlistConfigId: 'p1' },
                    { playlistConfigId: '  ', title: 'Blank id' },
                    null,
                    'not-an-object',
                    { title: 'No playlistConfigId' },
                  ] } } },
                  tab2: [{ contents: { programConfig: { programs: [
                    { playlistConfigId: 'p2', title: 'Zeta', thumbnail: 'z.png' },
                  ] } } }],
                },
              },
              programs: 'not-a-list',
            },
          },
        },
      })

      expect(result).toEqual([
        { identifier: 'p1', name: 'p1', image: '' },
        { identifier: 'p2', name: 'Zeta', image: 'z.png' },
      ])
    })

    it('should return an empty list for an empty response', () => {
      let result: unknown
      service.getPrograms('org1').subscribe(res => (result = res))
      httpMock.expectOne(API_END_POINTS.FORM_READ).flush(null)
      expect(result).toEqual([])
    })
  })

  describe('getCompetencies', () => {
    it('should map entities with the default logo, drop incomplete ones and sort by name', () => {
      let result: unknown
      service.getCompetencies().subscribe(res => (result = res))

      const req = httpMock.expectOne(API_END_POINTS.ENTITY_SEARCH)
      expect(req.request.body).toEqual(expect.objectContaining({ entityType: 'Competency', language: 'en' }))
      req.flush({
        result: {
          entity: [
            { entityId: 12, name: 'Zeta' },
            { id: 'c-1', name: ' Alpha ' },
            { name: 'No id' },
            { entityId: 3 },
          ],
        },
      })

      expect(result).toEqual([
        { identifier: 'c-1', name: 'Alpha', image: NOTIFICATION_DEFAULT_LOGOS.COMPETENCY },
        { identifier: '12', name: 'Zeta', image: NOTIFICATION_DEFAULT_LOGOS.COMPETENCY },
      ])
    })

    it('should pass the language and handle an empty response', () => {
      let result: unknown
      service.getCompetencies('hi').subscribe(res => (result = res))
      const req = httpMock.expectOne(API_END_POINTS.ENTITY_SEARCH)
      expect(req.request.body.language).toBe('hi')
      req.flush({})
      expect(result).toEqual([])
    })
  })

  describe('getPositions', () => {
    it('should return the distinct, non-blank designations sorted', () => {
      let result: unknown
      service.getPositions('org1').subscribe(res => (result = res))

      const req = httpMock.expectOne(API_END_POINTS.USER_SEARCH)
      expect(req.request.body.request).toEqual(expect.objectContaining({
        filters: { rootOrgId: 'org1' },
        fields: ['profileDetails'],
        offset: 0,
      }))
      const designation = (d: string) => ({ profileDetails: { profileReq: { professionalDetails: [{ designation: d }] } } })
      req.flush({
        result: {
          response: {
            count: 5,
            content: [designation('Nurse'), designation('ANM'), designation('Nurse'), designation('  '), { profileDetails: null }],
          },
        },
      })

      expect(result).toEqual(['ANM', 'Nurse'])
    })

    it('should page through users up to the scan limit', () => {
      let result: string[] = []
      service.getPositions('org1').subscribe(res => (result = res))

      const pageSize = NOTIFICATION_LIMITS.USER_PAGE_SIZE
      const designation = (d: string) => ({ profileDetails: { profileReq: { professionalDetails: [{ designation: d }] } } })
      httpMock.expectOne(req => req.body.request.offset === 0).flush({
        result: { response: { count: NOTIFICATION_LIMITS.POSITION_SCAN_MAX_USERS + 500, content: [designation('P0')] } },
      })

      const offsets: number[] = []
      for (let offset = pageSize; offset < NOTIFICATION_LIMITS.POSITION_SCAN_MAX_USERS; offset += pageSize) {
        offsets.push(offset)
      }
      const pages = httpMock.match(API_END_POINTS.USER_SEARCH)
      expect(pages.map(p => p.request.body.request.offset)).toEqual(offsets)
      pages.forEach((page, i) => page.flush({ result: { response: { content: [designation(`P${i + 1}`)] } } }))

      expect(result.length).toBe(offsets.length + 1)
    })

    it('should treat a response without a count as a single page', () => {
      let result: unknown
      service.getPositions('org1').subscribe(res => (result = res))
      httpMock.expectOne(API_END_POINTS.USER_SEARCH).flush({})
      expect(result).toEqual([])
    })
  })

  describe('getOrgUsers', () => {
    it('should map users, fall back on userId/phone/"Unnamed user" and sort by name', () => {
      let result: unknown
      service.getOrgUsers('org1').subscribe(res => (result = res))

      httpMock.expectOne(API_END_POINTS.USER_SEARCH).flush({
        result: {
          response: {
            count: 4,
            content: [
              { id: 'u1', firstName: 'Zara', lastName: ' K ', maskedEmail: 'z***@x.com' },
              { userId: 'u2', firstName: 'Amit', maskedPhone: '******1234' },
              { id: 'u3' },
              { firstName: 'No id' },
            ],
          },
        },
      })

      expect(result).toEqual([
        { id: 'u2', name: 'Amit', contact: '******1234' },
        { id: 'u3', name: 'Unnamed user', contact: '' },
        { id: 'u1', name: 'Zara K', contact: 'z***@x.com' },
      ])
    })
  })

  describe('sendCertificateNotification', () => {
    it('should send by token with the certificate action data', () => {
      pushSvc.sendByToken.mockReturnValue(of({}))
      service.sendCertificateNotification({ item, userIds: ['u1', 'u2'], title: 'T', body: 'B', imageUrl: 'https://img/x.png' })
        .subscribe()

      const request = pushSvc.sendByToken.mock.calls[0][0]
      expect(request).toEqual(expect.objectContaining({ title: 'T', body: 'B', userIds: ['u1', 'u2'], imageUrl: 'https://img/x.png' }))
      expect(request.data).toEqual(expect.objectContaining({ actionType: 'CERTIFICATE', status: '1', header: 'B' }))
      expect(JSON.parse(dataOf(request).actionData)).toEqual({ id: 'do_1', logo: 'https://img/1.png', title: 'Course 1' })
    })

    it('should omit imageUrl when it is empty', () => {
      pushSvc.sendByToken.mockReturnValue(of({}))
      service.sendCertificateNotification({ item, userIds: ['u1'], title: 'T', body: 'B' }).subscribe()
      expect('imageUrl' in pushSvc.sendByToken.mock.calls[0][0]).toBe(false)
    })
  })

  describe('sendNotification', () => {
    const send = (kind: NotificationKind, positions: string[], imageUrl?: string) => {
      let results: TopicSendResult[] = []
      service.sendNotification(kind, { orgId: ' org1 ', item, positions, title: 'T', body: 'B', imageUrl })
        .subscribe(res => (results = res))
      return results
    }

    it('should send one call to the organisation topic when no position is selected', () => {
      pushSvc.sendByTopic.mockReturnValue(of({}))
      const results = send('course', [], 'https://img/x.png')

      expect(results).toEqual([{ topic: 'org1', position: null, success: true }])
      const request = pushSvc.sendByTopic.mock.calls[0][0]
      expect(request).toEqual(expect.objectContaining({ topic: 'org1', title: 'T', body: 'B', imageUrl: 'https://img/x.png' }))
      expect(request.data).toEqual(expect.objectContaining({ actionType: 'COURSE', header: 'B' }))
      expect(JSON.parse(dataOf(request).actionData)).toEqual({
        identifier: 'do_1', id: 'do_1', logo: 'https://img/1.png', title: 'Course 1',
      })
    })

    it('should send one call per sanitised position topic, once per unique topic', () => {
      pushSvc.sendByTopic.mockReturnValue(of({}))
      const results = send('course', ['Bsc nursing', 'Bsc_nursing', 'ANM'])

      expect(results.map(r => r.topic).sort()).toEqual(['org1_ANM', 'org1_Bsc_nursing'])
      expect(pushSvc.sendByTopic).toHaveBeenCalledTimes(2)
      expect('imageUrl' in pushSvc.sendByTopic.mock.calls[0][0]).toBe(false)
    })

    it('should report failed topics without stopping the others', () => {
      pushSvc.sendByTopic.mockImplementation(req => (req.topic === 'org1_ANM' ? throwError(() => new Error('x')) : of({})))
      const results = send('course', ['ANM', 'GNM'])

      expect(results).toEqual(expect.arrayContaining([
        { topic: 'org1_ANM', position: 'ANM', success: false },
        { topic: 'org1_GNM', position: 'GNM', success: true },
      ]))
    })

    it.each([
      { identifier: '42', expectedId: 42 },
      { identifier: 'abc', expectedId: 'abc' },
    ])('should build competency action data with id $expectedId', ({ identifier, expectedId }) => {
      pushSvc.sendByTopic.mockReturnValue(of({}))
      let results: TopicSendResult[] = []
      service.sendNotification('competency', {
        orgId: 'org1', item: { ...item, identifier }, positions: [], title: 'T', body: 'B',
      }).subscribe(res => (results = res))

      expect(results.length).toBe(1)
      const data = dataOf(pushSvc.sendByTopic.mock.calls[0][0])
      expect(data.actionType).toBe('COMPETENCY')
      expect(JSON.parse(data.actionData)).toEqual({ id: expectedId, name: 'Course 1', title: 'Course 1', logo: 'https://img/1.png' })
    })

    it('should build program action data', () => {
      pushSvc.sendByTopic.mockReturnValue(of({}))
      send('program', [])
      const data = dataOf(pushSvc.sendByTopic.mock.calls[0][0])
      expect(data.actionType).toBe('PROGRAM')
      expect(JSON.parse(data.actionData)).toEqual({ id: 'do_1', name: 'Course 1', title: 'Course 1', logo: 'https://img/1.png' })
    })
  })
})
