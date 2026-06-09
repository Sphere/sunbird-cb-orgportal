import { Component, OnInit } from '@angular/core'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { Router } from '@angular/router'
import { EventService } from '../../services/event.service'
import { EventModalComponent } from '../event-modal/event-modal.component'
// import { ProfileV2Service } from '../../services/home.servive'
import { WorkallocationService } from '../../services/workallocation.service'

@Component({
  selector: 'ws-app-event-dashboard',
  templateUrl: './event-dashboard.component.html',
  styleUrls: ['./event-dashboard.component.scss'],
})
export class EventDashboardComponent implements OnInit {
  events: any[] = []
  filteredEvents: any[] = []
  searchQuery = ''
  userId: string = ''
  userName: any

  constructor(
    private eventService: EventService,
    private dialog: MatDialog,
    private router: Router,
    private userService: WorkallocationService

  ) { }

  ngOnInit(): void {
    this.eventService.updateEvent(null)
    this.fetchUserDetails()


  }

  fetchUserDetails(): void {
    this.userService.getAllUsers().subscribe(response => {
      const user = response.result.response
      this.userId = user.userId
      this.userName = user.userName
      this.eventService.setUserData(
        {
          userId: user.userId,
          userName: user.userName,
        })
      console.log('User Details:', this.userId, this.userName)
      this.fetchEvents() // Fetch events after getting user details
    }, error => {
      console.error('Error fetching user details:', error)
    })
  }

  fetchEvents(): void {
    this.eventService.getAllEvents().subscribe(response => {
      console.log('Events:', response)
      this.events = response.map((event: any) => ({
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

      //Filter by current user (organizer)
      const filteredByUser = this.events.filter(event => event.organizer === this.userId)
      console.log('Filtered Events by User:', filteredByUser)

      // 👉 Sort by date (latest first)
      this.events = filteredByUser.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      console.log('Sorted Events:', this.events)

      // 👉 Assign to filteredEvents if needed for UI
      this.filteredEvents = [...this.events]
      console.log('Filtered Events:', this.filteredEvents)
    }, error => {
      console.error('Error fetching events:', error)
    }
    )
  }

  openEventModal(): void {
    const dialogRef = this.dialog.open(EventModalComponent, {
      width: '1000px',
      disableClose: true,
    })

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(result)
        this.fetchEvents()// Refresh the list of events
      }
    })
  }

  navigateToEvent(event: any): void {
    this.eventService.updateEvent(event)
    this.router.navigate(['/app/home/event-dashboard', event.id])
  }

  filterEvents(): void {
    this.filteredEvents = this.events.filter(event =>
      event.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      event.registrationType.toLowerCase().includes(this.searchQuery.toLowerCase())
    )
  }

}
