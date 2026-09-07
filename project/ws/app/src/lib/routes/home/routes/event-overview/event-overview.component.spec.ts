import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { RouterTestingModule } from '@angular/router/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute, Router } from '@angular/router'
import { Subject, of, throwError } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { EventOverviewComponent } from './event-overview.component'
import { EventService } from '../../services/event.service'
import { ConfigurationsService } from '@sunbird-cb/utils'

describe('EventOverviewComponent', () => {
  let component: EventOverviewComponent
  let fixture: ComponentFixture<EventOverviewComponent>
  let httpMock: HttpTestingController
  let eventService: jest.Mocked<{
    getParticipants: (...args: any[]) => any
    getEventById: (...args: any[]) => any
    updateEvent: (...args: any[]) => any
    downloadCertificates: (...args: any[]) => any
  }> & { currentEvent: any }
  let dialog: jest.Mocked<{ open: (...args: any[]) => any }>
  let router: jest.Mocked<{ navigate: (...args: any[]) => any }>
  let currentEvent$: Subject<any>

  beforeEach(async () => {
    currentEvent$ = new Subject<any>()
    eventService = createSpyObj('EventService', [
      'getParticipants', 'getEventById', 'updateEvent', 'downloadCertificates',
    ])
    eventService.currentEvent = currentEvent$.asObservable()
    dialog = createSpyObj('MatDialog', ['open'])
    router = createSpyObj('Router', ['navigate'])

    await TestBed.configureTestingModule({
      declarations: [EventOverviewComponent],
      imports: [RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: MatDialog, useValue: dialog },
        { provide: EventService, useValue: eventService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: {} },
        {
          provide: ConfigurationsService,
          useValue: {
            instanceConfig: {},
            baseUrl: '',
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(EventOverviewComponent)
    component = fixture.componentInstance
    httpMock = TestBed.inject(HttpTestingController)
    fixture.detectChanges()
  })

  afterEach(() => httpMock.verify())

  const TEMPLATES_URL = 'https://aastar-assets.s3.ap-south-1.amazonaws.com/rc-mdo-templates/MDO-RC-TEMPLATES.json'
  const flushTemplates = (templates: any[] = []) => {
    const req = httpMock.expectOne(TEMPLATES_URL)
    req.flush({ templates })
  }

  it('should create', () => {
    expect(component).toBeTruthy()
    flushTemplates()
  })

  describe('ngOnInit / currentEvent subscription', () => {
    it('should set nonRegistered and use the given participantCount without an extra fetch', () => {
      flushTemplates()
      currentEvent$.next({
        eventId: 'e1',
        registrationType: 'registred without sphere',
        participantCount: 5,
      })
      expect(component.nonRegistered).toBe(true)
      expect(component.participantCount).toBe(5)
      expect(eventService.getParticipants).not.toHaveBeenCalled()
    })

    it('should fetch participant count when not provided on the event', () => {
      flushTemplates()
      eventService.getParticipants.mockReturnValue(of([{ id: 1 }, { id: 2 }]))
      currentEvent$.next({ eventId: 'e1', registrationType: 'registred with sphere' })
      expect(component.participantCount).toBe(2)
      expect(eventService.updateEvent).toHaveBeenCalled()
    })

    it('should check the selected template when the event already has a templateId', () => {
      flushTemplates([{ templateId: 't1', name: 'Tmpl' }])
      currentEvent$.next({ eventId: 'e1', participantCount: 0, templateId: 't1' })
      expect(component.selectedEvent.selectedTemplate).toEqual({ templateId: 't1', name: 'Tmpl' })
    })

    it('should fetch the selected certificate when no templateId is present', () => {
      flushTemplates()
      eventService.getEventById.mockReturnValue(of({ templateId: 't2' }))
      currentEvent$.next({ eventId: 'e1', participantCount: 0 })
      expect(eventService.getEventById).toHaveBeenCalledWith('e1')
      expect(component.selectedEvent.templateId).toBe('t2')
    })
  })

  it('ngOnDestroy should unsubscribe the event subscription', () => {
    flushTemplates()
    currentEvent$.next({ eventId: 'e1', participantCount: 0 })
    const unsubSpy = jest.spyOn((component as any).eventSubscription, 'unsubscribe')
    component.ngOnDestroy()
    expect(unsubSpy).toHaveBeenCalled()
  })

  it('ngOnDestroy should not throw when there is no active subscription', () => {
    flushTemplates()
    ;(component as any).eventSubscription = undefined
    expect(() => component.ngOnDestroy()).not.toThrow()
  })

  describe('loadCertificateTemplates', () => {
    it('should log an error when the templates request fails', () => {
      const req = httpMock.expectOne(TEMPLATES_URL)
      req.flush('fail', { status: 500, statusText: 'Server Error' })
      expect(component.certificateTemplates).toEqual([])
    })
  })

  describe('fetchParticipantsCount', () => {
    it('should do nothing when selectedEvent has no eventId', () => {
      flushTemplates()
      component.selectedEvent = {}
      component.fetchParticipantsCount()
      expect(eventService.getParticipants).not.toHaveBeenCalled()
    })

    it('should log an error when getParticipants fails', () => {
      flushTemplates()
      component.selectedEvent = { eventId: 'e1' }
      eventService.getParticipants.mockReturnValue(throwError(new Error('boom')))
      expect(() => component.fetchParticipantsCount()).not.toThrow()
    })
  })

  describe('checkSelectedTemplate', () => {
    it('should do nothing when there are no templates loaded yet', () => {
      flushTemplates()
      component.selectedEvent = { templateId: 't1' }
      component.certificateTemplates = []
      component.checkSelectedTemplate()
      expect(component.selectedEvent.selectedTemplate).toBeUndefined()
    })

    it('should do nothing when no matching template is found', () => {
      flushTemplates([{ templateId: 'other' }])
      component.selectedEvent = { templateId: 't1' }
      component.checkSelectedTemplate()
      expect(component.selectedEvent.selectedTemplate).toBeUndefined()
    })
  })

  describe('fetchSelectedCertificate', () => {
    it('should log an error and return when selectedEvent has no eventId', () => {
      flushTemplates()
      component.selectedEvent = {}
      expect(() => component.fetchSelectedCertificate()).not.toThrow()
      expect(eventService.getEventById).not.toHaveBeenCalled()
    })

    it('should warn when the event API response has no templateId', () => {
      flushTemplates()
      component.selectedEvent = { eventId: 'e1' }
      eventService.getEventById.mockReturnValue(of({}))
      component.fetchSelectedCertificate()
      expect(component.selectedEvent.templateId).toBeUndefined()
    })

    it('should log an error when the event API call fails', () => {
      flushTemplates()
      component.selectedEvent = { eventId: 'e1' }
      eventService.getEventById.mockReturnValue(throwError(new Error('boom')))
      expect(() => component.fetchSelectedCertificate()).not.toThrow()
    })
  })

  describe('addParticipant', () => {
    beforeEach(() => flushTemplates())

    it('should refresh participant count and switch tabs on save', () => {
      component.selectedEvent = { eventId: 'e1' }
      dialog.open.mockReturnValue({ afterClosed: () => of('saved') })
      eventService.getParticipants.mockReturnValue(of([]))
      const setTabSpy = jest.spyOn(component, 'setTab')

      component.addParticipant()

      expect(eventService.getParticipants).toHaveBeenCalled()
      expect(setTabSpy).toHaveBeenCalledWith('participants')
    })

    it('should do nothing further when the dialog result is an error', () => {
      component.selectedEvent = { eventId: 'e1' }
      dialog.open.mockReturnValue({ afterClosed: () => of('error') })
      expect(() => component.addParticipant()).not.toThrow()
    })
  })

  it('setTab should navigate relative to the current route', () => {
    flushTemplates()
    component.setTab('participants')
    expect(router.navigate).toHaveBeenCalledWith(['../', 'participants'], { relativeTo: expect.anything() })
  })

  it('generateCert should navigate to the certificate route', () => {
    flushTemplates()
    component.generateCert()
    expect(router.navigate).toHaveBeenCalledWith(['../certificate'], { relativeTo: expect.anything() })
  })

  describe('downloadCertificates', () => {
    beforeEach(() => flushTemplates())

    it('should do nothing when already downloading or eventId is missing', () => {
      component.isDownloading = true
      component.downloadCertificates()
      expect(eventService.downloadCertificates).not.toHaveBeenCalled()
    })

    it('should download the zip for a registered-template event', () => {
      // jsdom doesn't implement the URL object-URL APIs the component calls.
      window.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock')
      window.URL.revokeObjectURL = jest.fn()
      component.selectedEvent = { eventId: 'e1', selectedTemplate: { registered: true } }
      const blob = new Blob(['x'])
      eventService.downloadCertificates.mockReturnValue(of(blob))
      component.downloadCertificates()
      expect(component.isDownloading).toBe(false)
    })

    it('should log an error and stop downloading when the zip request fails', () => {
      component.selectedEvent = { eventId: 'e1', selectedTemplate: { registered: true } }
      eventService.downloadCertificates.mockReturnValue(throwError(new Error('boom')))
      component.downloadCertificates()
      expect(component.isDownloading).toBe(false)
    })

    it('should fall back to non-registered generation otherwise', () => {
      component.selectedEvent = { eventId: 'e1', selectedTemplate: { registered: false } }
      const genSpy = jest.spyOn(component, 'generateCertificatesForNonRegisteredUsers').mockImplementation()
      component.downloadCertificates()
      expect(genSpy).toHaveBeenCalled()
    })
  })

  describe('generateCertificatesForNonRegisteredUsers', () => {
    beforeEach(() => flushTemplates())

    it('should stop downloading when selectedEvent has no eventId', () => {
      component.selectedEvent = {}
      component.isDownloading = true
      component.generateCertificatesForNonRegisteredUsers()
      expect(component.isDownloading).toBe(false)
    })

    it('should stop downloading and warn when there are no participants', async () => {
      component.selectedEvent = { eventId: 'e1', eventDate: '2024-01-15' }
      component.isDownloading = true
      eventService.getParticipants.mockReturnValue(of([]))
      component.generateCertificatesForNonRegisteredUsers()
      await Promise.resolve()
      await Promise.resolve()
      expect(component.isDownloading).toBe(false)
    })

    it('should log an error and stop downloading when the participants call fails', () => {
      component.selectedEvent = { eventId: 'e1', eventDate: '2024-01-15' }
      component.isDownloading = true
      eventService.getParticipants.mockReturnValue(throwError(new Error('boom')))
      component.generateCertificatesForNonRegisteredUsers()
      expect(component.isDownloading).toBe(false)
    })
  })

  describe('generatePersonalizedSVG', () => {
    it('should replace the name and date placeholders', () => {
      flushTemplates()
      const result = component.generatePersonalizedSVG('<svg>{{name}} {{date}}</svg>', 'John', '01-01-2024')
      expect(result).toBe('<svg>John 01-01-2024</svg>')
    })
  })

  describe('formatEventDate', () => {
    it('should return an empty string when no date is given', () => {
      flushTemplates()
      expect(component.formatEventDate('')).toBe('')
    })

    it('should format an ISO date as DD-MM-YYYY', () => {
      flushTemplates()
      expect(component.formatEventDate('2024-03-05T00:00:00.000Z')).toMatch(/^\d{2}-\d{2}-2024$/)
    })
  })
})
