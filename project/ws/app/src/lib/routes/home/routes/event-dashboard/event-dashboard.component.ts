import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { EventModalComponent } from '../event-modal/event-modal.component'
import { Router } from '@angular/router'

@Component({
  selector: 'ws-app-event-dashboard',
  templateUrl: './event-dashboard.component.html',
  styleUrls: ['./event-dashboard.component.scss']
})
export class EventDashboardComponent implements OnInit {

  constructor(
    public dialog: MatDialog,
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  events = [
    { name: 'Event.1', id: 1 },
    { name: 'Event.2', id: 2 },
  ];

  // createNewEvent() {
  //   const newEvent = { name: `Event.${this.events.length + 1}` }
  //   this.events.push(newEvent)
  // }

  openEventModal(): void {
    const dialogRef = this.dialog.open(EventModalComponent, {
      width: '1000px'
    })

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(result)

        // Generate ID based on the highest existing ID
        const newId = this.events.length > 0
          ? Math.max(...this.events.map(event => event.id)) + 1
          : 1

        this.events.push({ id: newId, name: result.eventName })
      }
    })
  }


  navigateToEvent(event: any): void {
    this.router.navigate(
      ['/app/home//event-dashboard', event.id],
      { state: { name: event.name } }

    )
  }

}
