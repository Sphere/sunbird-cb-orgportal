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
  // @Input() selectedEvent: any // ✅ Receiving data from parent
  selectedEvent: any

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private eventService: EventService
  ) { }

  ngOnInit(): void {
    this.eventService.currentEvent.subscribe(event => {
      this.selectedEvent = event
    })
    console.log('Received Event in Overview:', this.selectedEvent)
    // this.route.parent?.data.subscribe(data => {
    //   console.log('Parent Resolver Data:', data)
    //   this.selectedEvent = data['event'] // Getting event details from parent
    // })
  }


  addParticipant(): void {
    const dialogRef = this.dialog.open(AddParticipantsComponent, {
      width: '650px',
      disableClose: false,
      data: { eventId: this.selectedEvent.event_id }
    })

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'saved') {
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
