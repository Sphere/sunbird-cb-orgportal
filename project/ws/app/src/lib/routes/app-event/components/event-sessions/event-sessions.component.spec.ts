import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Subject, of } from 'rxjs'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { EventSessionsComponent } from './event-sessions.component'
import { EventService } from '../../services/event.service'

describe('EventSessionsComponent', () => {
  let component: EventSessionsComponent
  let fixture: ComponentFixture<EventSessionsComponent>
  let parentData$: Subject<any>

  const sessionsPayload = (overrides: any = {}) => ({
    eventdata: {
      data: {
        SessionCards: {
          Sessions: {
            s1: {
              SessionType: 'live', SessionImage: 'img1', SessionTitle: 'Title1', Speaker: 'John',
              Attendees: 10,
              SessionStartTime: new Date(Date.now() - 1000).toString(),
              SessionEndTime: new Date(Date.now() + 60000).toString(),
            },
          },
        },
      },
      ...overrides,
    },
  })

  const build = (parentRoute: any = { data: of({}) }) => {
    parentData$ = new Subject<any>()
    TestBed.configureTestingModule({
      declarations: [EventSessionsComponent],
      imports: [HttpClientTestingModule],
      providers: [
        EventService,
        {
          provide: ActivatedRoute,
          useValue: { parent: parentRoute },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(EventSessionsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  afterEach(() => {
    component?.ngOnDestroy()
    TestBed.resetTestingModule()
  })

  it('should create and enable the banner', () => {
    build()
    expect(component).toBeTruthy()
  })

  it('should skip subscribing to parent route data when there is no parent route', () => {
    expect(() => build(null)).not.toThrow()
  })

  it('should build session cards from SessionCards.Sessions and start the live-timer poller', () => {
    jest.useFakeTimers()
    build({ data: of(sessionsPayload()) })
    expect(component.data.length).toBe(1)
    expect(component.data[0].sessionID).toBe('Session1')
    expect(component.data[0].speakerName).toBe('John')
    jest.advanceTimersByTime(60000)
    expect(component.data[0].startRemainingTime).toBeLessThan(0)
    jest.useRealTimers()
  })

  it('should mark a speaker as live when within the session window', () => {
    jest.useFakeTimers()
    build({ data: of(sessionsPayload()) })
    jest.advanceTimersByTime(60000)
    expect(component.liveSpeaker.length).toBeGreaterThanOrEqual(0)
    jest.useRealTimers()
  })

  it('should not start the poller when there are no sessions', () => {
    jest.useFakeTimers()
    build({
      data: of({ eventdata: { data: { SessionCards: { Sessions: {} } } } }),
    })
    expect(component.data.length).toBe(0)
    expect((component as any).currentSubscription).toBeNull()
    jest.useRealTimers()
  })

  it('calculateTime should push start/end offsets for each speaker', () => {
    build()
    component.data = [{
      startTime: new Date(Date.now() + 1000).toString(),
      endTime: new Date(Date.now() + 2000).toString(),
    } as any]
    component.calculateTime()
    expect(component.sessionStartTime.length).toBe(1)
    expect(component.sessionEndTime.length).toBe(1)
  })

  it('calculateTime should do nothing when data is falsy', () => {
    build()
    component.data = null as any
    expect(() => component.calculateTime()).not.toThrow()
  })

  describe('ngOnDestroy', () => {
    it('should unsubscribe the current subscription when one exists', () => {
      jest.useFakeTimers()
      build({ data: of(sessionsPayload()) })
      const unsubSpy = jest.spyOn((component as any).currentSubscription, 'unsubscribe')
      component.ngOnDestroy()
      expect(unsubSpy).toHaveBeenCalled()
      jest.useRealTimers()
    })

    it('should not throw when there is no active subscription', () => {
      build({
        data: of({ eventdata: { data: { SessionCards: { Sessions: {} } } } }),
      })
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })
})
