import { Component, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { forkJoin, of, Subscription } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { EventService } from '../../services/event.service'
import _ from 'lodash'
import * as XLSX from 'xlsx'

@Component({
  standalone: false,
  selector: 'ws-app-participants',
  templateUrl: './participants.component.html',
  styleUrls: ['./participants.component.scss'],
})
export class ParticipantsComponent implements OnInit, OnDestroy {
  searchQuery = ''
  filterStatus = ''
  showFilterPanel = false
  participants: any[] = []
  isLoading = true
  readonly skeletonRows = [1, 2, 3, 4, 5]
  selectedEvent: any
  isExporting = false
  private routeSubscription!: Subscription
  private eventSubscription!: Subscription

  constructor(
    private readonly route: ActivatedRoute,
    private readonly eventService: EventService,
    private readonly elementRef: ElementRef
  ) { }

  ngOnInit(): void {
    if (this.route.parent) {
      this.routeSubscription = this.route.parent.params.subscribe(params => {
        this.fetchParticipants(params['id'])
      })
    }
    this.eventSubscription = this.eventService.currentEvent.subscribe(event => {
      this.selectedEvent = event
    })
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe()
    this.eventSubscription?.unsubscribe()
  }

  // Close the filter panel when clicking outside the component
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.showFilterPanel && !this.elementRef.nativeElement.contains(event.target)) {
      this.showFilterPanel = false
    }
  }

  fetchParticipants(eventId: string): void {
    this.isLoading = true
    this.eventService.getParticipants(eventId).subscribe({
      next: response => {
        this.participants = response.map((participant: any) => ({
          firstName: participant.firstName,
          lastName: participant.lastName || '',
          place: participant.place || '',
          userId: participant.userId || '',
          isNonQr: participant.userId === 'Non-QR-User',
          certificateStatus: participant.certificateGenerationStatus || null,
        }))
        this.isLoading = false
      },
      error: error => {
        console.error('Error fetching participants:', error)
        this.isLoading = false
      },
    })
  }

  get showCertificateStatus(): boolean {
    return (
      this.selectedEvent?.registrationType !== 'registred without sphere' &&
      !!this.selectedEvent?.templateId
    )
  }

  get usersWithoutCert(): any[] {
    // Non-QR users are excluded — their cert is generated manually from the UI,
    // not via the userId-based profile download flow.
    return this.participants.filter(p => !p.isNonQr && p.certificateStatus !== 'success')
  }

  toggleFilterPanel(event: MouseEvent): void {
    event.stopPropagation()
    this.showFilterPanel = !this.showFilterPanel
  }

  setFilter(status: string): void {
    // Clicking the active chip clears it; clicking a new chip sets it
    this.filterStatus = this.filterStatus === status ? '' : status
  }

  clearFilters(): void {
    this.searchQuery = ''
    this.filterStatus = ''
    this.showFilterPanel = false
  }

  filteredParticipants() {
    return _.filter(this.participants, participant => {
      const matchesSearch = !this.searchQuery || _.some(
        ['firstName', 'lastName', 'place'],
        key => _.toLower(participant[key]).includes(_.toLower(this.searchQuery))
      )
      const matchesStatus = !this.filterStatus || (() => {
        if (this.filterStatus === 'nonqr') { return participant.isNonQr }
        if (this.filterStatus === 'pending') {
          return !participant.isNonQr &&
            participant.certificateStatus !== 'success' &&
            participant.certificateStatus !== 'failed'
        }
        return participant.certificateStatus === this.filterStatus
      })()
      return matchesSearch && matchesStatus
    })
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
            'Phone': rawPhone.replaceAll('"', ''),
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
        const url = globalThis.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'Users_Without_Certificates.xlsx'
        a.click()
        globalThis.URL.revokeObjectURL(url)
        this.isExporting = false
      },
      error: () => { this.isExporting = false },
    })
  }
}
