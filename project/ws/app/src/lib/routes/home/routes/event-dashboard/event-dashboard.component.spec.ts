import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA, ElementRef } from '@angular/core'
import { Router } from '@angular/router'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { of, throwError } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { EventDashboardComponent } from './event-dashboard.component'
import { EventService } from '../../services/event.service'
import { WorkallocationService } from '../../services/workallocation.service'
import { EventModalComponent } from '../event-modal/event-modal.component'

describe('EventDashboardComponent', () => {
  let component: EventDashboardComponent
  let fixture: ComponentFixture<EventDashboardComponent>
  let eventService: ReturnType<typeof createSpyObj>
  let userService: ReturnType<typeof createSpyObj>
  let dialog: ReturnType<typeof createSpyObj>
  let router: ReturnType<typeof createSpyObj>

  beforeEach(async () => {
    eventService = createSpyObj('EventService', ['updateEvent', 'setUserData', 'getAllEvents'])
    userService = createSpyObj('WorkallocationService', ['getAllUsers'])
    dialog = createSpyObj('MatDialog', ['open'])
    router = createSpyObj('Router', ['navigate'])
    userService.getAllUsers.mockReturnValue(of({ result: { response: { userId: 'u1', userName: 'User One' } } }))
    eventService.getAllEvents.mockReturnValue(of([]))

    await TestBed.configureTestingModule({
      declarations: [EventDashboardComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: MatDialog, useValue: dialog },
        { provide: Router, useValue: router },
        { provide: EventService, useValue: eventService },
        { provide: WorkallocationService, useValue: userService },
        { provide: ElementRef, useValue: { nativeElement: { contains: () => true } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(EventDashboardComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create and fetch user details then events on init', () => {
    expect(component).toBeTruthy()
    expect(eventService.updateEvent).toHaveBeenCalledWith(null)
    expect(component.userId).toBe('u1')
    expect(eventService.setUserData).toHaveBeenCalledWith({ userId: 'u1', userName: 'User One' })
    expect(eventService.getAllEvents).toHaveBeenCalled()
  })

  it('should log an error when fetching user details fails', () => {
    userService.getAllUsers.mockReturnValue(throwError(new Error('boom')))
    expect(() => component.fetchUserDetails()).not.toThrow()
  })

  describe('fetchEvents', () => {
    it('should map, filter by current user, and sort events by createdAt desc', () => {
      component.userId = 'u1'
      eventService.getAllEvents.mockReturnValue(of([
        { eventId: 'e1', eventName: 'E1', createdBy: 'u1', createdAt: '2024-01-01', eventDate: '2024-02-01', eventType: 'x', status: 's' },
        { eventId: 'e2', eventName: 'E2', createdBy: 'u2', createdAt: '2024-01-02', eventDate: '2024-02-02', eventType: 'y', status: 's' },
        { eventId: 'e3', eventName: 'E3', createdBy: 'u1', createdAt: '2024-01-03', eventDate: '2024-02-03', eventType: 'x', status: 's' },
      ]))
      component.fetchEvents()
      expect(component.events.map(e => e.id)).toEqual(['e3', 'e1'])
      expect(component.filteredEvents.length).toBe(2)
      expect(component.currentPage).toBe(0)
    })

    it('should log an error when fetching events fails', () => {
      eventService.getAllEvents.mockReturnValue(throwError(new Error('boom')))
      expect(() => component.fetchEvents()).not.toThrow()
    })
  })

  describe('onDocumentClick', () => {
    it('should close the filter panel when the click is outside the element', () => {
      component.filterPanelOpen = true
      ;(component as any).el.nativeElement.contains = () => false
      component.onDocumentClick({ target: {} } as any)
      expect(component.filterPanelOpen).toBe(false)
    })

    it('should keep the panel state when the click is inside the element', () => {
      component.filterPanelOpen = true
      ;(component as any).el.nativeElement.contains = () => true
      component.onDocumentClick({ target: {} } as any)
      expect(component.filterPanelOpen).toBe(true)
    })
  })

  describe('openEventModal', () => {
    it('should refetch events when the dialog closes with a result', () => {
      dialog.open.mockReturnValue({ afterClosed: () => of(true) })
      const fetchSpy = jest.spyOn(component, 'fetchEvents')
      component.openEventModal()
      expect(dialog.open).toHaveBeenCalledWith(EventModalComponent, expect.any(Object))
      expect(fetchSpy).toHaveBeenCalled()
    })

    it('should not refetch when the dialog closes without a result', () => {
      dialog.open.mockReturnValue({ afterClosed: () => of(undefined) })
      const fetchSpy = jest.spyOn(component, 'fetchEvents')
      fetchSpy.mockClear()
      component.openEventModal()
      expect(fetchSpy).not.toHaveBeenCalled()
    })
  })

  it('navigateToEvent should update the current event and navigate', () => {
    component.navigateToEvent({ id: 'e1' })
    expect(eventService.updateEvent).toHaveBeenCalledWith({ id: 'e1' })
    expect(router.navigate).toHaveBeenCalledWith(['/app/home/event-dashboard', 'e1'])
  })

  it('toggleFilter should flip filterPanelOpen', () => {
    component.filterPanelOpen = false
    component.toggleFilter()
    expect(component.filterPanelOpen).toBe(true)
  })

  describe('status/type filters', () => {
    beforeEach(() => {
      component.events = [
        { name: 'Alpha', location: 'Delhi', registrationType: 'open', status: 'active' },
        { name: 'Beta', location: 'Mumbai', registrationType: 'closed', status: 'ended' },
      ]
    })

    it('setStatusFilter should toggle the active filter on and off', () => {
      component.setStatusFilter('active')
      expect(component.activeStatusFilter).toBe('active')
      expect(component.filteredEvents.length).toBe(1)
      component.setStatusFilter('active')
      expect(component.activeStatusFilter).toBe('')
    })

    it('setTypeFilter should toggle the active filter on and off', () => {
      component.setTypeFilter('open')
      expect(component.activeTypeFilter).toBe('open')
      component.setTypeFilter('open')
      expect(component.activeTypeFilter).toBe('')
    })

    it('clearAllFilters should reset both filters', () => {
      component.activeStatusFilter = 'active'
      component.activeTypeFilter = 'open'
      component.clearAllFilters()
      expect(component.activeStatusFilter).toBe('')
      expect(component.activeTypeFilter).toBe('')
      expect(component.filteredEvents.length).toBe(2)
    })

    it('filterEvents should match on search query across name/location/registrationType', () => {
      component.searchQuery = 'delhi'
      component.filterEvents()
      expect(component.filteredEvents.map(e => e.name)).toEqual(['Alpha'])
    })
  })

  it('onPageChange should update currentPage and pageSize', () => {
    component.onPageChange({ pageIndex: 2, pageSize: 20 } as any)
    expect(component.currentPage).toBe(2)
    expect(component.pageSize).toBe(20)
  })

  describe('getters', () => {
    it('pagedEvents should slice by currentPage/pageSize', () => {
      component.filteredEvents = Array.from({ length: 15 }, (_, i) => ({ id: i }))
      component.currentPage = 1
      component.pageSize = 10
      expect(component.pagedEvents.length).toBe(5)
    })

    it('uniqueStatuses/uniqueRegistrationTypes should dedupe and drop falsy values', () => {
      component.events = [{ status: 'a', registrationType: 'x' }, { status: 'a', registrationType: '' }, { status: '' }]
      expect(component.uniqueStatuses).toEqual(['a'])
      expect(component.uniqueRegistrationTypes).toEqual(['x'])
    })

    it('activeFilterCount should count the active filters', () => {
      component.activeStatusFilter = ''
      component.activeTypeFilter = ''
      expect(component.activeFilterCount).toBe(0)
      component.activeStatusFilter = 'a'
      component.activeTypeFilter = 'b'
      expect(component.activeFilterCount).toBe(2)
    })
  })

  it('ngOnDestroy should complete the destroy subject', () => {
    const completeSpy = jest.spyOn((component as any).destroy$, 'complete')
    component.ngOnDestroy()
    expect(completeSpy).toHaveBeenCalled()
  })
})
