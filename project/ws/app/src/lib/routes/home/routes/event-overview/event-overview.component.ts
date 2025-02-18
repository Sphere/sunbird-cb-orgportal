import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { AddParticipantsComponent } from '../add-participants/add-participants.component'
import { ActivatedRoute, Router } from '@angular/router'

@Component({
  selector: 'ws-app-event-overview',
  templateUrl: './event-overview.component.html',
  styleUrls: ['./event-overview.component.scss']
})
export class EventOverviewComponent implements OnInit {
  @Output() navigateToParticipants = new EventEmitter<void>();
  @Input() selectedEvent: any

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // const eventId = this.route.snapshot.paramMap.get('id')
    // console.log('Event ID:', this.route)

    this.route.parent?.params.subscribe(params => {
      const eventId = params['id']
      console.log('Event ID:', eventId)
      this.loadEventDetails(eventId)
    })

    // this.loadEventDetails(eventId)
  }

  loadEventDetails(id: string | null) {
    if (!id) return

    // Fetch event details (mock data for now)
    this.selectedEvent = {
      id: id,
      name: `New Event.${id}`,
      date: '11/11/23',
      location: 'Delhi',
      createdBy: 'Admin.name.1',
      description: 'volutpat ac tincidunt vitae semper quis lectus nulla at volutpat diam ut venenatis tellus in metus vulputate eu scelerisque felis imperdiet proin fermentum leo vel orci porta non pulvinar neque laoreet suspendisse interdum consectetur libero id faucibus nisl tincidunt eget nullam non nisi consectetur libero id faucibus nisl tincidunt eget nullam non nisi fermentum leo vel orci porta non pulvinar neque laoreet suspendisse interdum consecte  non pulvinar neque laoreet suspendisse interdum consect',
      participants: []
    }
  }

  addParticipant() {
    const dialogRef = this.dialog.open(AddParticipantsComponent, {
      width: '650px',
      disableClose: false
    })

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'saved') {
        this.navigateToParticipants.emit()
      }
    })
  }

  generateCert() {
    this.router.navigate(['../certificate'], { relativeTo: this.route })
  }

}
