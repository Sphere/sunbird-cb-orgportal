import { ComponentFixture, TestBed } from '@angular/core/testing'

import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router'
import { Subject, of } from 'rxjs'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { EventDetailsComponent } from './event-details.component'
import { EventService } from '../../services/event.service'
import { EventModalComponent } from '../event-modal/event-modal.component'

describe('EventDetailsComponent', () => {
  let component: EventDetailsComponent
  let fixture: ComponentFixture<EventDetailsComponent>
  let paramMap$: Subject<any>
  let url$: Subject<any>
  let routerEvents$: Subject<any>
  let dialog: ReturnType<typeof createSpyObj>
  let eventService: ReturnType<typeof createSpyObj>
  let route: any

  const build = () => {
    paramMap$ = new Subject<any>()
    url$ = new Subject<any>()
    routerEvents$ = new Subject<any>()
    dialog = createSpyObj('MatDialog', ['open'])
    eventService = createSpyObj('EventService', ['getEventById', 'updateEvent'])
    eventService.getEventById.mockReturnValue(of({ id: 'e1' }))

    route = {
      paramMap: paramMap$.asObservable(),
      url: url$.asObservable(),
      firstChild: { snapshot: { url: [{ path: 'overview' }] } },
      snapshot: { firstChild: { routeConfig: { path: 'overview' } } },
    }

    TestBed.configureTestingModule({
      declarations: [EventDetailsComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: MatDialog, useValue: dialog },
        { provide: EventService, useValue: eventService },
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: { navigate: jest.fn(), events: routerEvents$.asObservable() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(EventDetailsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  afterEach(() => TestBed.resetTestingModule())

  it('should create', () => {
    build()
    expect(component).toBeTruthy()
  })

  it('should fetch and store the event when an id param is present', () => {
    build()
    paramMap$.next({ get: () => 'e1' })
    expect(eventService.getEventById).toHaveBeenCalledWith('e1')
    expect(component.event).toEqual({ id: 'e1' })
    expect(eventService.updateEvent).toHaveBeenCalledWith({ id: 'e1' })
  })

  it('should not fetch when there is no id param', () => {
    build()
    paramMap$.next({ get: () => null })
    expect(eventService.getEventById).not.toHaveBeenCalled()
  })

  it('should detect the certificate route from url segments', () => {
    build()
    url$.next([{ path: 'certificate' }])
    expect(component.isCertificateRoute).toBe(true)
  })

  it('should not flag non-certificate routes', () => {
    build()
    url$.next([{ path: 'overview' }])
    expect(component.isCertificateRoute).toBe(false)
  })

  it('should update activeTab and isCertificateRoute on NavigationEnd', () => {
    build()
    route.firstChild.snapshot.url[0].path = 'certificate'
    route.snapshot.firstChild.routeConfig.path = 'participants'
    routerEvents$.next(new NavigationEnd(1, '/x', '/x'))
    expect(component.isCertificateRoute).toBe(true)
    expect(component.activeTab).toBe('participants')
  })

  it('should default activeTab to overview when there is no matching route config', () => {
    build()
    route.snapshot.firstChild = undefined
    routerEvents$.next(new NavigationEnd(1, '/x', '/x'))
    expect(component.activeTab).toBe('overview')
  })

  it('should ignore non-NavigationEnd router events', () => {
    build()
    expect(() => routerEvents$.next({})).not.toThrow()
  })

  it('setTab should update activeTab and navigate', () => {
    build()
    component.setTab('participants')
    expect(component.activeTab).toBe('participants')
  })

  describe('editEvent', () => {
    it('should update the event on a successful dialog close', () => {
      build()
      dialog.open.mockReturnValue({ afterClosed: () => of({ id: 'updated' }) })
      component.editEvent({ id: 'e1' })
      expect(dialog.open).toHaveBeenCalledWith(EventModalComponent, expect.any(Object))
      expect(component.event).toEqual({ id: 'updated' })
    })

    it('should leave the event unchanged when the dialog is dismissed', () => {
      build()
      component.event = { id: 'original' }
      dialog.open.mockReturnValue({ afterClosed: () => of(undefined) })
      component.editEvent({ id: 'e1' })
      expect(component.event).toEqual({ id: 'original' })
    })
  })

  it('onNavigateToParticipants should switch to the participants tab', () => {
    build()
    const setTabSpy = jest.spyOn(component, 'setTab')
    component.onNavigateToParticipants()
    expect(setTabSpy).toHaveBeenCalledWith('participants')
  })

  it('ngOnDestroy should complete the destroy subject', () => {
    build()
    const completeSpy = jest.spyOn((component as any).destroy$, 'complete')
    component.ngOnDestroy()
    expect(completeSpy).toHaveBeenCalled()
  })
})
