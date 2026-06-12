import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { forkJoin, of, Subscription } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { EventService } from '../../services/event.service'
import * as _ from 'lodash'
import * as XLSX from 'xlsx'

@Component({
  standalone: false,
  selector: 'ws-app-participants',
  templateUrl: './participants.component.html',
  styleUrls: ['./participants.component.scss'],
})
export class ParticipantsComponent implements OnInit, OnDestroy {
  searchQuery = ''
  participants: any[] = []
  selectedEvent: any
  isExporting = false
  private routeSubscription!: Subscription
  private eventSubscription!: Subscription

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService
  ) { }

  ngOnInit(): void {
    this.routeSubscription = this.route.parent?.params.subscribe(params => {
      const eventId = params['id']
      this.fetchParticipants(eventId)
    }) as Subscription

    this.eventSubscription = this.eventService.currentEvent.subscribe(event => {
      this.selectedEvent = event
    })
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe()
    this.eventSubscription?.unsubscribe()
  }

  fetchParticipants(eventId: string): void {
    this.eventService.getParticipants(eventId).subscribe(
      response => {
        this.participants = response.map((participant: any) => ({
          firstName: participant.firstName,
          lastName: participant.lastName || '',
          place: participant.place || '',
          userId: participant.userId || '',
          certificateStatus: participant.certificateGenerationStatus || null,
        }))
      },
      error => {
        console.error('Error fetching participants:', error)
      }
    )
  }

  get showCertificateStatus(): boolean {
    return (
      this.selectedEvent?.registrationType !== 'registred without sphere' &&
      !!this.selectedEvent?.templateId
    )
  }

  get usersWithoutCert(): any[] {
    return this.participants.filter(p => p.certificateStatus !== 'success')
  }

  filteredParticipants() {
    return _.filter(this.participants, participant =>
      _.some(
        ['firstName', 'lastName', 'place'],
        key => _.toLower(participant[key]).includes(_.toLower(this.searchQuery))
      )
    )
  }

  downloadUsersWithoutCertificates(): void {
    const users = this.usersWithoutCert
    if (users.length === 0 || this.isExporting) { return }
    this.isExporting = true

    const profileRequests = users.map(u =>
      this.eventService.getUserProfile(u.userId).pipe(catchError(() => of(null)))
    )

    forkJoin(profileRequests).subscribe({
      next: profiles => {
        const data = users.map((p, i) => {
          const profile = profiles[i] || {}
          const personal = profile?.profileDetails?.profileReq?.personalDetails || {}
          const rawPhone = personal.mobile || profile.phone || ''
          const email = personal.primaryEmail || profile.email || ''
          return {
            'First Name': p.firstName,
            'Last Name': p.lastName,
            'Phone': rawPhone.replace(/"/g, ''),
            'Email': email,
            'Place': p.place,
            'Certificate Status': p.certificateStatus || 'Not Generated',
          }
        })

        const ws = XLSX.utils.json_to_sheet(data)
        const wb: XLSX.WorkBook = {
          Sheets: { 'Users Without Certificates': ws },
          SheetNames: ['Users Without Certificates'],
        }
        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'Users_Without_Certificates.xlsx'
        a.click()
        window.URL.revokeObjectURL(url)
        this.isExporting = false
      },
      error: () => { this.isExporting = false },
    })
  }
}
