import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA, ElementRef } from '@angular/core'
import { Router } from '@angular/router'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { MatDialog } from '@angular/material/dialog'
import { of, throwError } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { EventDashboardComponent } from './event-dashboard.component'
import { EventService } from '../../services/event.service'
import { WorkallocationService } from '../../services/workallocation.service'
import { EventModalComponent } from '../event-modal/event-modal.component'

describe('EventDashboardComponent', () => {
  let component: EventDashboardComponent
  let fixture: ComponentFixture<EventDashboardComponent>
  let eventService: jest.Mocked<{ updateEvent: (...args: any[]) => any, setUserData: (...args: any[]) => any, getAllEvents: (...args: any[]) => any }>
  let userService: jest.Mocked<{ getAllUsers: (...args: any[]) => any }>
  let dialog: jest.Mocked<{ open: (...args: any[]) => any }>
  let router: jest.Mocked<{ navigate: (...args: any[]) => any }>

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
    // Containment is now tested against the filter wrapper rather than the component host,
    // so a click anywhere else on the page closes the panel.
    const setWrapper = (contains: boolean) => {
      ;(component as any).filterWrapper = { nativeElement: { contains: () => contains } }
    }

    it('should close the filter panel when the click is outside the filter', () => {
      component.filterPanelOpen = true
      setWrapper(false)
      component.onDocumentClick({ target: {} } as any)
      expect(component.filterPanelOpen).toBe(false)
    })

    it('should keep the panel open when the click is inside the filter', () => {
      component.filterPanelOpen = true
      setWrapper(true)
      component.onDocumentClick({ target: {} } as any)
      expect(component.filterPanelOpen).toBe(true)
    })

    it('should do nothing when the panel is already closed', () => {
      component.filterPanelOpen = false
      setWrapper(false)
      component.onDocumentClick({ target: {} } as any)
      expect(component.filterPanelOpen).toBe(false)
    })

    it('should close the panel on escape', () => {
      component.filterPanelOpen = true
      component.onEscape()
      expect(component.filterPanelOpen).toBe(false)
    })
  })

  describe('statusLabel', () => {
    it('should use the server status when present', () => {
      expect(component.statusLabel({ status: 'completed' })).toBe('completed')
    })

    it('should report no participants before anyone is uploaded', () => {
      expect(component.statusLabel({ participantCount: 0 })).toBe('no participants')
      expect(component.statusLabel({ participantCount: 0, templateId: 'WaterBirth' })).toBe('no participants')
    })

    it('should report template pending once participants exist but no template is chosen', () => {
      expect(component.statusLabel({ participantCount: 12 })).toBe('template pending')
    })

    it('should report ready when participants and a template are both present', () => {
      expect(component.statusLabel({ participantCount: 12, templateId: 'WaterBirth' })).toBe('ready')
    })

    it('should skip the participant step when the backend does not send a count', () => {
      // participantCount is absent on older backends; do not claim "no participants".
      expect(component.statusLabel({})).toBe('template pending')
      expect(component.statusLabel({ templateId: 'WaterBirth' })).toBe('ready')
    })

    it('should build a css-safe class from the label', () => {
      expect(component.statusClass({ participantCount: 0 })).toBe('status-chip status-no-participants')
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
