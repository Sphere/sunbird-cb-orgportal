import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Subscription } from 'rxjs'
import { EventService } from '../../services/event.service'
import * as  _ from 'lodash'

@Component({
  selector: 'ws-app-participants',
  templateUrl: './participants.component.html',
  styleUrls: ['./participants.component.scss'],
})
export class ParticipantsComponent implements OnInit, OnDestroy {
  searchQuery = ''
  participants: any[] = []
  private routeSubscription!: Subscription // Stores the route subscription

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService
  ) { }

  ngOnInit(): void {
    this.routeSubscription = this.route.parent?.params.subscribe(params => {
      const eventId = params['id']
      this.fetchParticipants(eventId)
    }) as Subscription // Store the subscription
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe() // ✅ Unsubscribe to prevent memory leaks
    }
  }

  fetchParticipants(eventId: string): void {
    this.eventService.getParticipants(eventId).subscribe(
      response => {
        console.log('Participants:', response)
        this.participants = response.map((participant: any) => ({
          firstName: participant.firstName,
          lastName: participant.lastName,
          place: participant.location,
        }))
      },
      error => {
        console.error('Error fetching participants:', error)
      }
    )
  }

  filteredParticipants() {
    return _.filter(this.participants, participant =>
      _.some(
        ['firstName', 'lastName', 'place'],
        key => _.toLower(participant[key]).includes(_.toLower(this.searchQuery))
      )
    )
  }
}
