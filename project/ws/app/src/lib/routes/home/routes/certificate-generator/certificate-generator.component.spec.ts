import { ComponentFixture, TestBed } from '@angular/core/testing'

import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { of } from 'rxjs'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { EventService } from '../../services/event.service'
import { CertificateGeneratorComponent } from './certificate-generator.component'

describe('CertificateGeneratorComponent', () => {
  let component: CertificateGeneratorComponent
  let fixture: ComponentFixture<CertificateGeneratorComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CertificateGeneratorComponent],
    imports: [HttpClientTestingModule],
    providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ pageData: { data: {} }, eventdata: { data: {} } }),
            paramMap: of({ get: () => null }),
            params: of({}),
            snapshot: { paramMap: { get: () => null }, queryParamMap: { get: () => null }, data: {}, params: {} },
            parent: { data: of({ eventdata: { data: {} } }), params: of({}) },
          },
        },
        {
          provide: Router,
          useValue: { navigate: jest.fn() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(CertificateGeneratorComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit / currentEvent subscription', () => {
    it('should ignore emission when event is null', () => {
      // default provider emits null; ngOnInit already ran in outer beforeEach
      expect(component.eventType).toBe('')
      expect(component.eventId).toBe('')
    })

    it('should set eventType/eventId when an event is emitted', () => {
      const eventService: EventService = TestBed.inject(EventService)
      ;(eventService.currentEvent as any) = of({ eventType: 'registred with sphere', eventId: 'ev1' })
      const localFixture = TestBed.createComponent(CertificateGeneratorComponent)
      const localComponent = localFixture.componentInstance
      localFixture.detectChanges()
      expect(localComponent.eventType).toBe('registred with sphere')
      expect(localComponent.eventId).toBe('ev1')
    })
  })

  describe('ngOnDestroy', () => {
    it('should unsubscribe eventSubscription if present', () => {
      const unsubscribeSpy = jest.fn()
      ;(component as any).eventSubscription = { unsubscribe: unsubscribeSpy }
      component.ngOnDestroy()
      expect(unsubscribeSpy).toHaveBeenCalled()
    })

    it('should not throw when eventSubscription is not set', () => {
      ;(component as any).eventSubscription = undefined
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })

  describe('fetchCertificates', () => {
    const templates = [
      { templateId: 't1', registered: true },
      { templateId: 't2', registered: false },
    ]

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should set certificates (all) when eventType is neither registred variant', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ templates }),
      }) as any
      component.eventType = ''
      await component.fetchCertificates()
      expect(component.certificates).toEqual(templates)
    })

    it('should filter registered templates when eventType is "registred with sphere"', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ templates }),
      }) as any
      component.eventType = 'registred with sphere'
      await component.fetchCertificates()
      expect(component.certificates).toEqual([templates[0]])
    })

    it('should filter unregistered templates and set nonRegistered when eventType is "registred without sphere"', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ templates }),
      }) as any
      component.eventType = 'registred without sphere'
      await component.fetchCertificates()
      expect(component.nonRegistered).toBe(true)
      expect(component.certificates).toEqual([templates[1]])
    })

    it('should set errorMessage when response is not ok', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false }) as any
      await component.fetchCertificates()
      expect(component.errorMessage).toBe('Failed to load certificate templates.')
    })

    it('should set errorMessage when templates is not an array', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ templates: 'not-an-array' }),
      }) as any
      await component.fetchCertificates()
      expect(component.errorMessage).toBe('Failed to load certificate templates.')
    })

    it('should set errorMessage when fetch throws', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('network error')) as any
      await component.fetchCertificates()
      expect(component.errorMessage).toBe('Failed to load certificate templates.')
    })

    it('should use configured rcMdoTemplatesUrl when present', async () => {
      const configSvc: ConfigurationsService = TestBed.inject(ConfigurationsService)
      ;(configSvc as any).instanceConfig = { externalUrls: { rcMdoTemplatesUrl: 'https://custom-url/templates.json' } }
      const fetchSpy = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ templates }),
      })
      global.fetch = fetchSpy as any
      await component.fetchCertificates()
      expect(fetchSpy).toHaveBeenCalledWith('https://custom-url/templates.json')
    })
  })

  describe('selectCertificate', () => {
    it('should set selectedCertIndex', () => {
      component.selectCertificate(3)
      expect(component.selectedCertIndex).toBe(3)
    })
  })

  describe('generateCertificate', () => {
    beforeEach(() => {
      component.certificates = [{ templateId: 'tpl-1' } as any]
      component.selectedCertIndex = 0
      component.eventId = 'event-1'
    })

    it('should log an error and return early when selectedTemplate is missing', () => {
      component.certificates = []
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      component.generateCertificate()
      expect(consoleSpy).toHaveBeenCalledWith('Missing required data: eventId or templateId')
    })

    it('should log an error and return early when eventId is missing', () => {
      component.eventId = ''
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      component.generateCertificate()
      expect(consoleSpy).toHaveBeenCalledWith('Missing required data: eventId or templateId')
    })

    it('should call editEvent and navigateBack when nonRegistered is true', () => {
      component.nonRegistered = true
      const eventService: EventService = TestBed.inject(EventService)
      const router: Router = TestBed.inject(Router)
      const updateEventSpy = jest.fn()
      ;(eventService as any).updateEvent = updateEventSpy
      ;(eventService as any).editEvent = jest.fn().mockReturnValue(of({ ok: true }))
      ;(eventService as any).currentEvent = of({ eventId: 'event-1' })

      component.generateCertificate()

      expect(updateEventSpy).toHaveBeenCalled()
      expect((eventService as any).editEvent).toHaveBeenCalledWith({ eventId: 'event-1', templateId: 'tpl-1' })
      expect(router.navigate).toHaveBeenCalledWith(['../overview'], { relativeTo: TestBed.inject(ActivatedRoute) })
    })

    it('should log error when editEvent errors out (nonRegistered path)', () => {
      component.nonRegistered = true
      const eventService: EventService = TestBed.inject(EventService)
      ;(eventService as any).updateEvent = jest.fn()
      ;(eventService as any).editEvent = jest.fn().mockReturnValue(throwErrorObservable())
      ;(eventService as any).currentEvent = of({ eventId: 'event-1' })
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      component.generateCertificate()

      expect(consoleSpy).toHaveBeenCalledWith('Error updating event: non ', 'edit-error')
    })

    it('should generate certificate, update event, edit event and navigate home on success', () => {
      component.nonRegistered = false
      const eventService: EventService = TestBed.inject(EventService)
      const router: Router = TestBed.inject(Router)
      const updateEventSpy = jest.fn()
      ;(eventService as any).updateEvent = updateEventSpy
      ;(eventService as any).generateCertificate = jest.fn().mockReturnValue(of({ success: true }))
      ;(eventService as any).editEvent = jest.fn().mockReturnValue(of({ ok: true }))
      ;(eventService as any).currentEvent = of({ eventId: 'event-1' })

      component.generateCertificate()

      expect((eventService as any).generateCertificate).toHaveBeenCalledWith('event-1', 'tpl-1')
      expect(updateEventSpy).toHaveBeenCalled()
      expect((eventService as any).editEvent).toHaveBeenCalledWith({ eventId: 'event-1', templateId: 'tpl-1' })
      expect(router.navigate).toHaveBeenCalledWith(['/app/home/event-dashboard'])
      expect(component.isGenerating).toBe(false)
    })

    it('should log error when editEvent errors out (registered success path)', () => {
      component.nonRegistered = false
      const eventService: EventService = TestBed.inject(EventService)
      ;(eventService as any).updateEvent = jest.fn()
      ;(eventService as any).generateCertificate = jest.fn().mockReturnValue(of({ success: true }))
      ;(eventService as any).editEvent = jest.fn().mockReturnValue(throwErrorObservable())
      ;(eventService as any).currentEvent = of({ eventId: 'event-1' })
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      component.generateCertificate()

      expect(consoleSpy).toHaveBeenCalledWith('Error updating event:', 'edit-error')
    })

    it('should set isGenerating to false and log error when generateCertificate errors out', () => {
      component.nonRegistered = false
      const eventService: EventService = TestBed.inject(EventService)
      ;(eventService as any).generateCertificate = jest.fn().mockReturnValue(throwErrorObservable('gen-error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      component.generateCertificate()

      expect(consoleSpy).toHaveBeenCalledWith('Error generating certificate:', 'gen-error')
      expect(component.isGenerating).toBe(false)
    })
  })

  describe('navigation helpers', () => {
    it('navigateBack should navigate relative to route', () => {
      const router: Router = TestBed.inject(Router)
      component.navigateBack()
      expect(router.navigate).toHaveBeenCalledWith(['../overview'], { relativeTo: TestBed.inject(ActivatedRoute) })
    })

    it('navigatetoHome should navigate to event-dashboard', () => {
      const router: Router = TestBed.inject(Router)
      component.navigatetoHome()
      expect(router.navigate).toHaveBeenCalledWith(['/app/home/event-dashboard'])
    })
  })
})

function throwErrorObservable(message = 'edit-error') {
  // tslint:disable-next-line
  return new (require('rxjs').Observable)((subscriber: any) => {
    subscriber.error(message)
  })
}
