import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { Router } from '@angular/router'
import { EventService } from '../../services/event.service'
import { EventModalComponent } from '../event-modal/event-modal.component'
// import { ProfileV2Service } from '../../services/home.servive'
import { WorkallocationService } from '../../services/workallocation.service'

@Component({
  selector: 'ws-app-event-dashboard',
  templateUrl: './event-dashboard.component.html',
  styleUrls: ['./event-dashboard.component.scss']
})
export class EventDashboardComponent implements OnInit {
  events: any[] = []
  filteredEvents: any[] = []
  searchQuery: string = ''

  constructor(
    private eventService: EventService,
    private dialog: MatDialog,
    private router: Router,
    private userService: WorkallocationService

  ) { }

  ngOnInit(): void {
    this.eventService.updateEvent(null)
    this.fetchUserDetails()
    this.fetchEvents()

  }

  fetchUserDetails(): void {
    this.userService.getAllUsers().subscribe(
      (response) => {
        const user = response.result.response
        this.eventService.setUserData(
          {
            userId: user.userId,
            userName: user.userName
          })
        console.log('User Details:', response.result.response.userName)
      },
      (error) => {
        console.error('Error fetching user details:', error)
      })
  }

  fetchEvents(): void {
    this.eventService.getAllEvents().subscribe(
      (response) => {
        console.log('Events:', response)
        this.events = response.map((event: any) => ({
          // id: event.event_id, // Use actual event_id
          // name: event.event_name,
          // description: event.event_description,
          // location: event.event_location,
          // date: event.event_date,
          // organizer: event.organizer_name,
          // registrationType: event.event_status
          id: event.eventId, // Use actual event_id
          name: event.eventName,
          description: event.eventDescription,
          location: event.eventPlace,
          date: event.eventDate,
          organizer: event.createdBy,
          registrationType: event.eventType,
        }))
        this.filteredEvents = this.events



        // id: event.eventId, // Use actual event_id
        // name: event.eventName,
        // description: event.eventDescription,
        // location: event.eventPlace,
        // date: event.eventDate,
        // organizer: event.createdBy
        // registrationType: event.eventType,
      },
      (error) => {
        console.error('Error fetching events:', error)
      }
    )

    this.eventService.currentEvent.subscribe(event => {
      console.log('Event:', event)
    })
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
