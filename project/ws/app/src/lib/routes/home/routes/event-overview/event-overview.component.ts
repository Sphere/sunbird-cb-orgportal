import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { AddParticipantsComponent } from '../add-participants/add-participants.component'
import { ActivatedRoute, Router } from '@angular/router'
import { EventService } from '../../services/event.service'

@Component({
  selector: 'ws-app-event-overview',
  templateUrl: './event-overview.component.html',
  styleUrls: ['./event-overview.component.scss']
})
export class EventOverviewComponent implements OnInit {
  selectedEvent: any
  participantCount: number = 0

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private eventService: EventService
  ) { }

  ngOnInit(): void {
    this.eventService.currentEvent.subscribe(event => {
      this.selectedEvent = event
      this.fetchParticipantsCount()
    })
    console.log('Received Event in Overview:', this.selectedEvent)
  }

  fetchParticipantsCount(): void {
    if (this.selectedEvent && this.selectedEvent.eventId) {
      this.eventService.getParticipants(this.selectedEvent.eventId).subscribe(
        response => {
          this.participantCount = response.length
        },
        error => {
          console.error('Error fetching participants:', error)
        }
      )
    }
  }

  addParticipant(): void {
    const dialogRef = this.dialog.open(AddParticipantsComponent, {
      width: '650px',
      disableClose: false,
      data: { eventId: this.selectedEvent.eventId }
    })

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'saved') {
        this.fetchParticipantsCount() // Update the count after adding participants
        this.setTab('participants')
      }
      if (result === 'error') {
        console.log('Cancelled')
      }
    })
  }

  setTab(tab: string): void {
    this.router.navigate(['../', tab], { relativeTo: this.route })
  }

  generateCert() {
    this.router.navigate(['../certificate'], { relativeTo: this.route })
  }

}
