import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { EventModalComponent } from '../event-modal/event-modal.component'
import { Router } from '@angular/router'
import { EventService } from '../../services/event.service'

@Component({
  selector: 'ws-app-event-dashboard',
  templateUrl: './event-dashboard.component.html',
  styleUrls: ['./event-dashboard.component.scss']
})
export class EventDashboardComponent implements OnInit {

  events = [];

  constructor(
    public dialog: MatDialog,
    private router: Router,
    private eventService: EventService
  ) { }

  ngOnInit(): void {
    this.fetchEvents()
  }


  fetchEvents() {
    this.eventService.getAllEvents().subscribe(
      (response) => {
        console.log('Events:', response)
        // this.events = response
        this.events = response.map((event: any) => ({
          id: event.event_id, // Use actual event_id
          name: event.event_name,
          description: event.event_description,
          location: event.event_location,
          date: event.event_date,
          organizer: event.organizer_name


          // id: event.eventId, // Use actual event_id
          // name: event.eventName,
          // description: event.eventDescription,
          // location: event.eventPlace,
          // date: event.eventDate,
          // organizer: event.createdBy
        }))
      },
      (error) => {
        console.error('Error fetching events:', error)
      }
    )
  }

  openEventModal(): void {
    const dialogRef = this.dialog.open(EventModalComponent, {
      width: '1000px'
    })

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(result)
        this.fetchEvents()// Refresh the list of events
      }
    })
  }


  navigateToEvent(event: any): void {
    this.router.navigate(['/app/home/event-dashboard', event.id])
  }


}
