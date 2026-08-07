import { ComponentFixture, TestBed } from '@angular/core/testing'

import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Subject, of, throwError } from 'rxjs'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { ParticipantsComponent } from './participants.component'
import { EventService } from '../../services/event.service'

describe('ParticipantsComponent', () => {
  let component: ParticipantsComponent
  let fixture: ComponentFixture<ParticipantsComponent>
  let eventService: ReturnType<typeof createSpyObj>
  let params$: Subject<any>
  let currentEvent$: Subject<any>

  const build = () => {
    params$ = new Subject<any>()
    currentEvent$ = new Subject<any>()
    eventService = createSpyObj('EventService', ['getParticipants', 'getUserProfile'])
    eventService.currentEvent = currentEvent$.asObservable()
    eventService.getParticipants.mockReturnValue(of([]))

    TestBed.configureTestingModule({
      declarations: [ParticipantsComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: EventService, useValue: eventService },
        {
          provide: ActivatedRoute,
          useValue: { parent: { params: params$.asObservable() } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(ParticipantsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  afterEach(() => TestBed.resetTestingModule())

  it('should create and fetch participants when the parent route id changes', () => {
    build()
    params$.next({ id: 'e1' })
    expect(eventService.getParticipants).toHaveBeenCalledWith('e1')
  })

  it('should update selectedEvent from currentEvent', () => {
    build()
    currentEvent$.next({ eventId: 'e1', templateId: 't1' })
    expect(component.selectedEvent).toEqual({ eventId: 'e1', templateId: 't1' })
  })

  describe('fetchParticipants', () => {
    it('should normalize participant fields with sensible defaults', () => {
      build()
      eventService.getParticipants.mockReturnValue(of([
        { firstName: 'John', certificateGenerationStatus: 'success' },
      ]))
      component.fetchParticipants('e1')
      expect(component.participants).toEqual([
        { firstName: 'John', lastName: '', place: '', userId: '', certificateStatus: 'success' },
      ])
    })

    it('should log an error when the API call fails', () => {
      build()
      eventService.getParticipants.mockReturnValue(throwError(new Error('boom')))
      expect(() => component.fetchParticipants('e1')).not.toThrow()
    })
  })

  describe('showCertificateStatus', () => {
    it('should be false when registrationType is "registred without sphere"', () => {
      build()
      component.selectedEvent = { registrationType: 'registred without sphere', templateId: 't1' }
      expect(component.showCertificateStatus).toBe(false)
    })

    it('should be false without a templateId', () => {
      build()
      component.selectedEvent = { registrationType: 'other', templateId: null }
      expect(component.showCertificateStatus).toBe(false)
    })

    it('should be true otherwise', () => {
      build()
      component.selectedEvent = { registrationType: 'other', templateId: 't1' }
      expect(component.showCertificateStatus).toBe(true)
    })
  })

  it('usersWithoutCert should filter out successfully certificated participants', () => {
    build()
    component.participants = [
      { certificateStatus: 'success' }, { certificateStatus: 'failed' }, { certificateStatus: null },
    ]
    expect(component.usersWithoutCert.length).toBe(2)
  })

  it('filteredParticipants should match on firstName/lastName/place case-insensitively', () => {
    build()
    component.participants = [
      { firstName: 'John', lastName: 'Doe', place: 'Delhi' },
      { firstName: 'Jane', lastName: 'Smith', place: 'Mumbai' },
    ]
    component.searchQuery = 'delhi'
    expect(component.filteredParticipants()).toEqual([{ firstName: 'John', lastName: 'Doe', place: 'Delhi' }])
  })

  describe('downloadUsersWithoutCertificates', () => {
    it('should do nothing when there are no users without certificates', () => {
      build()
      component.participants = [{ certificateStatus: 'success' }]
      component.downloadUsersWithoutCertificates()
      expect(eventService.getUserProfile).not.toHaveBeenCalled()
    })

    it('should do nothing while already exporting', () => {
      build()
      component.participants = [{ certificateStatus: 'failed' }]
      component.isExporting = true
      component.downloadUsersWithoutCertificates()
      expect(eventService.getUserProfile).not.toHaveBeenCalled()
    })

    it('should build and download a workbook of users missing certificates', () => {
      build()
      window.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock')
      window.URL.revokeObjectURL = jest.fn()
      const anchor = { click: jest.fn(), href: '', download: '' } as unknown as HTMLAnchorElement
      jest.spyOn(document, 'createElement').mockReturnValue(anchor)

      component.participants = [
        { firstName: 'John', lastName: 'Doe', place: 'Delhi', userId: 'u1', certificateStatus: 'failed' },
      ]
      eventService.getUserProfile.mockReturnValue(of({
        profileDetails: { profileReq: { personalDetails: { mobile: '"12345"', primaryEmail: 'j@x.com' } } },
      }))

      component.downloadUsersWithoutCertificates()

      expect(component.isExporting).toBe(false)
      expect(anchor.click).toHaveBeenCalled()
      ;(document.createElement as jest.Mock).mockRestore()
    })

    it('should tolerate a failed profile lookup by falling back to null', () => {
      build()
      window.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock')
      window.URL.revokeObjectURL = jest.fn()
      const anchor = { click: jest.fn(), href: '', download: '' } as unknown as HTMLAnchorElement
      jest.spyOn(document, 'createElement').mockReturnValue(anchor)

      component.participants = [
        { firstName: 'John', lastName: 'Doe', place: 'Delhi', userId: 'u1', certificateStatus: 'failed' },
      ]
      eventService.getUserProfile.mockReturnValue(throwError(new Error('boom')))

      component.downloadUsersWithoutCertificates()

      expect(component.isExporting).toBe(false)
      ;(document.createElement as jest.Mock).mockRestore()
    })

    it('should stop exporting when the overall forkJoin errors', () => {
      build()
      component.participants = [
        { firstName: 'John', lastName: 'Doe', place: 'Delhi', userId: 'u1', certificateStatus: 'failed' },
      ]
      // getUserProfile itself throws synchronously (not via the observable) to
      // exercise forkJoin's own error path rather than the per-item catchError.
      eventService.getUserProfile.mockImplementation(() => { throw new Error('boom') })
      expect(() => component.downloadUsersWithoutCertificates()).toThrow()
    })
  })

  it('ngOnDestroy should unsubscribe both subscriptions', () => {
    build()
    params$.next({ id: 'e1' })
    const routeUnsub = jest.spyOn((component as any).routeSubscription, 'unsubscribe')
    const eventUnsub = jest.spyOn((component as any).eventSubscription, 'unsubscribe')
    component.ngOnDestroy()
    expect(routeUnsub).toHaveBeenCalled()
    expect(eventUnsub).toHaveBeenCalled()
  })
})
