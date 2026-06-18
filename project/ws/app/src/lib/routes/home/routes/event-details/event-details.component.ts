import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router'
import { MatDialog } from '@angular/material/dialog'
import { filter } from 'rxjs/operators'
import { EventService } from '../../services/event.service'
import { EventModalComponent } from '../event-modal/event-modal.component'

@Component({
  standalone: false,
  selector: 'ws-app-event-details',
  templateUrl: './event-details.component.html',
  styleUrls: ['./event-details.component.scss'],
})
export class EventDetailsComponent implements OnInit {

  event: any // Stores the fetched event details
  activeTab = 'overview'
  isCertificateRoute = false

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly eventService: EventService
  ) { }

  ngOnInit(): void {

    this.route.paramMap.subscribe(params => {
      console.log('Route Params:', params)
      const eventId = params.get('id')
      if (eventId) {
        console.log('Fetching event data for ID:', eventId)
        this.eventService.getEventById(eventId).subscribe(data => {
          console.log('Event Data:', data)
          this.event = data
          this.eventService.updateEvent(this.event) // ✅ Store event globally
        })
      }
    })

    // ✅ Detect if the current route is 'certificate'
    this.route.url.subscribe(urlSegments => {
      console.log('URL Segments:', urlSegments)
      this.isCertificateRoute = urlSegments.some(segment => segment.path === 'certificate')
    })

    // ✅ Update on navigation change
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {

      this.isCertificateRoute = this.route.firstChild?.snapshot.url[0]?.path === 'certificate'
      const currentRoute = this.route.snapshot.firstChild?.routeConfig?.path
      this.activeTab = currentRoute || 'overview' // Default to overview
    })
  }

  setTab(tab: string): void {
    this.activeTab = tab
    this.router.navigate([tab], { relativeTo: this.route })
  }

  editEvent(eventData: any): void {
    const dialogRef = this.dialog.open(EventModalComponent, {
      width: '1000px',
      disableClose: true,
      data: { event: eventData },
    })

    dialogRef.afterClosed().subscribe({
      next: result => {
        if (result) {
          this.event = result
        }
      },
    })
  }

  onNavigateToParticipants(): void {
    this.setTab('participants')
  }
}
