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
          userId: participant.user_id,
          name: participant.user_name,
          designation: participant.designation || 'N/A',
          state: participant.state,
          city: participant.city,
          block: participant.block,
          role: participant.role
        }))
      },
      error => {
        console.error('Error fetching participants:', error)
      }
    )
  }

  filteredParticipants() {
    return this.participants.filter(participant =>
      participant.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      participant.designation.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      participant.state.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      participant.city.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      participant.block.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      participant.role.toLowerCase().includes(this.searchQuery.toLowerCase())
    )
  }
}
