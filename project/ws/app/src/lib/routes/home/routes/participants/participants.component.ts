import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { EventService } from '../../services/event.service'

@Component({
  selector: 'ws-app-participants',
  templateUrl: './participants.component.html',
  styleUrls: ['./participants.component.scss']
})
export class ParticipantsComponent implements OnInit {
  searchQuery: string = ''
  participants: any[] = []

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService
  ) { }

  ngOnInit(): void {
    this.route.parent?.params.subscribe(params => {
      const eventId = params['id']
      this.fetchParticipants(eventId)
    })
  }

  fetchParticipants(eventId: string): void {
    this.eventService.getParticipants(eventId).subscribe(
      response => {
        console.log('Participants:', response)
        this.participants = response.map((participant: any) => ({
          firstName: participant.firstName,
          lastName: participant.lastName,
          place: participant.place
        }))
      },
      error => {
        console.error('Error fetching participants:', error)
      }
    )
  }

  filteredParticipants() {
    return this.participants.filter(participant =>
      participant.firstName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      participant.lastName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      participant.place.toLowerCase().includes(this.searchQuery.toLowerCase())
    )
  }
}
