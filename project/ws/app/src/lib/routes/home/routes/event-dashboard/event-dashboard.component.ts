import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { PageEvent } from '@angular/material/paginator'
import { Router } from '@angular/router'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { EventService } from '../../services/event.service'
import { EventModalComponent } from '../event-modal/event-modal.component'
import { WorkallocationService } from '../../services/workallocation.service'

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
  filterPanelOpen = false
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
    private readonly userService: WorkallocationService,
    private readonly el: ElementRef
  ) { }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.filterPanelOpen = false
    }
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
        this.userId = user.userId
        this.userName = user.userName
        this.eventService.setUserData({
          userId: user.userId,
          userName: user.userName,
        })
        this.fetchEvents()
      },
      error: err => console.error('Error fetching user details:', err),
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
          registrationType: event.eventType,
          eventType: event.eventType,
          status: event.status,
          createdAt: new Date(event.createdAt),
        }))
        const byUser = mapped.filter((event: any) => event.organizer === this.userId)
        this.events = byUser.toSorted((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
        this.filteredEvents = [...this.events]
        this.currentPage = 0
      },
      error: err => console.error('Error fetching events:', err),
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
        if (result) {
          this.fetchEvents()
        }
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

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex
    this.pageSize = event.pageSize
  }
}
