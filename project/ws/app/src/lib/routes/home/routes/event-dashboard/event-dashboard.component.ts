import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { PageEvent } from '@angular/material/paginator'
import { Router } from '@angular/router'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { EventService } from '../../services/event.service'
import { EventModalComponent } from '../event-modal/event-modal.component'
import { WorkallocationService } from '../../services/workallocation.service'
import { getUserIdFromProfile } from '../../../../../../../../../src/app/utils/user-profile-shape'

@Component({
  standalone: false,
  selector: 'ws-app-event-dashboard',
  templateUrl: './event-dashboard.component.html',
  styleUrls: ['./event-dashboard.component.scss'],
})
export class EventDashboardComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>()

  events: any[] = []
  filteredEvents: any[] = []
  searchQuery = ''
  userId: string = ''
  userName: any
  isLoading = true
  readonly skeletonRows = [1, 2, 3, 4, 5]
  readonly skeletonCells = [1, 2, 3, 4, 5]
  filterPanelOpen = false
  @ViewChild('filterWrapper') filterWrapper?: ElementRef<HTMLElement>
  activeStatusFilter = ''
  activeTypeFilter = ''
  pageSize = 10
  currentPage = 0
  readonly pageSizeOptions = [5, 10, 20]

  get pagedEvents(): any[] {
    const start = this.currentPage * this.pageSize
    return this.filteredEvents.slice(start, start + this.pageSize)
  }

  get uniqueStatuses(): string[] {
    return [...new Set(this.events.map(e => e.status).filter(Boolean))] as string[]
  }

  get uniqueRegistrationTypes(): string[] {
    return [...new Set(this.events.map(e => e.registrationType).filter(Boolean))] as string[]
  }

  get activeFilterCount(): number {
    return (this.activeStatusFilter ? 1 : 0) + (this.activeTypeFilter ? 1 : 0)
  }

  constructor(
    private readonly eventService: EventService,
    private readonly dialog: MatDialog,
    private readonly router: Router,
    private readonly userService: WorkallocationService
  ) { }

  // Close the filter panel on any click outside the filter itself. This previously tested
  // containment against the whole component host, so clicking the table, the heading or
  // anywhere else on the page still counted as "inside" and the panel never closed.
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.filterPanelOpen) {
      return
    }
    const wrapper = this.filterWrapper?.nativeElement
    if (wrapper && !wrapper.contains(event.target as Node)) {
      this.filterPanelOpen = false
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.filterPanelOpen = false
  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

  ngOnInit(): void {
    this.eventService.updateEvent(null)
    this.fetchUserDetails()
  }

  fetchUserDetails(): void {
    this.userService.getAllUsers().pipe(takeUntil(this.destroy$)).subscribe({
      next: response => {
        const user = response.result.response
        // Use the shared shape helper (userId -> id -> identifier). Spark's profile read
        // exposes no top-level `userId`, so reading that field alone left this undefined:
        // the events filter below then compared createdBy against undefined and matched
        // nothing ("No events found"), and setUserData fed an undefined createdBy into
        // event creation, which the API rejected as a missing required field.
        const userId = getUserIdFromProfile(user) || ''
        this.userId = userId
        this.userName = user.userName
        this.eventService.setUserData({
          userId,
          userName: user.userName,
        })
        this.fetchEvents()
      },
      error: err => {
        console.error('Error fetching user details:', err)
        // fetchEvents is called from the success path, so without this the table would sit
        // on its loading state forever when the profile call fails.
        this.isLoading = false
      },
    })
  }

  fetchEvents(): void {
    this.eventService.getAllEvents().pipe(takeUntil(this.destroy$)).subscribe({
      next: response => {
        const mapped = response.map((event: any) => ({
          id: event.eventId,
          eventId: event.eventId,
          name: event.eventName,
          description: event.eventDescription,
          location: event.eventPlace,
          date: new Date(event.eventDate),
          organizer: event.createdBy,
          participantCount: event.participantCount,
          registrationType: event.eventType,
          eventType: event.eventType,
          status: event.status,
          templateId: event.templateId,
          createdAt: new Date(event.createdAt),
        }))
        const byUser = mapped.filter((event: any) => event.organizer === this.userId)
        this.events = byUser.toSorted((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
        this.filteredEvents = [...this.events]
        this.currentPage = 0
        this.isLoading = false
      },
      error: err => {
        console.error('Error fetching events:', err)
        this.isLoading = false
      },
    })
  }

  openEventModal(): void {
    const dialogRef = this.dialog.open(EventModalComponent, {
      width: '640px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      disableClose: true,
    })

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe({
      next: result => {
        if (!result) {
          return
        }
        // Go straight into the new event's overview so the user can add participants and
        // pick a certificate, rather than landing back on the list and having to find it.
        const eventId = result.eventId || result.result?.eventId
        if (eventId) {
          this.router.navigate(['/app/home/event-dashboard', eventId])
          return
        }
        this.fetchEvents()
      },
    })
  }

  navigateToEvent(event: any): void {
    this.eventService.updateEvent(event)
    this.router.navigate(['/app/home/event-dashboard', event.id])
  }

  toggleFilter(): void {
    this.filterPanelOpen = !this.filterPanelOpen
  }

  setStatusFilter(status: string): void {
    this.activeStatusFilter = this.activeStatusFilter === status ? '' : status
    this.filterEvents()
  }

  setTypeFilter(type: string): void {
    this.activeTypeFilter = this.activeTypeFilter === type ? '' : type
    this.filterEvents()
  }

  clearAllFilters(): void {
    this.activeStatusFilter = ''
    this.activeTypeFilter = ''
    this.filterEvents()
  }

  filterEvents(): void {
    this.currentPage = 0
    const q = this.searchQuery.toLowerCase()
    this.filteredEvents = this.events.filter(event => {
      const matchesSearch =
        (event.name || '').toLowerCase().includes(q) ||
        (event.location || '').toLowerCase().includes(q) ||
        (event.registrationType || '').toLowerCase().includes(q)
      const matchesStatus = !this.activeStatusFilter || event.status === this.activeStatusFilter
      const matchesType = !this.activeTypeFilter || event.registrationType === this.activeTypeFilter
      return matchesSearch && matchesStatus && matchesType
    })
  }

  /**
   * No-registration events never receive a server-side status: their certificates are
   * rendered in the browser and nothing is reported back, so `status` stays null and the
   * column read as empty forever. Derive the next action instead of showing a blank cell.
   *
   * `participantCount` only exists on newer backends; when it is absent the participant
   * step is skipped rather than reported wrongly as empty.
   */
  statusLabel(event: any): string {
    // The server writes rc_events.status in exactly one place: the end of a certificate
    // GENERATION run ('completed' when every participant succeeded, 'partial_failed'
    // otherwise). It never means "downloaded" — no download is recorded anywhere, for
    // either registration type.
    if (event?.status) {
      return event.status
    }

    const hasCount = typeof event?.participantCount === 'number'
    if (hasCount && event.participantCount === 0) {
      return 'no participants'
    }
    if (!event?.templateId) {
      return 'template pending'
    }

    // Registration-based events get their status from the generation run. With no status,
    // generation has not been run, so nothing has been issued yet — calling that "ready"
    // would wrongly imply certificates exist.
    if (event?.registrationType === 'registred with sphere') {
      return 'not generated'
    }

    // No-registration events are rendered in the browser at download time, so a chosen
    // template is all that is needed. There is still no record of issue or download.
    return 'ready to download'
  }

  statusClass(event: any): string {
    const token = this.statusLabel(event).toLowerCase().replace(/[^a-z0-9]+/g, '-')
    return `status-chip status-${token}`
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex
    this.pageSize = event.pageSize
  }
}
