import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { EventService } from '../../services/event.service'
import { ICertificateTemplate } from '../../interface/events'
import { take } from 'rxjs/operators'
import { Subscription } from 'rxjs'

@Component({
  selector: 'ws-app-certificate-generator',
  templateUrl: './certificate-generator.component.html',
  styleUrls: ['./certificate-generator.component.scss'],
})
export class CertificateGeneratorComponent implements OnInit, OnDestroy {

  certificates: ICertificateTemplate[] = []
  selectedCertIndex = 0
  isGenerating = false
  errorMessage = ''
  eventId = ''
  eventType = ''

  private readonly jsonUrl = 'https://aastar-assets.s3.ap-south-1.amazonaws.com/rc-mdo-templates/MDO-RC-TEMPLATES.json'
  nonRegistered = false
  private eventSubscription!: Subscription

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private eventService: EventService
  ) { }

  ngOnInit(): void {
    this.eventSubscription = this.eventService.currentEvent.subscribe(event => {
      if (!event) { return }
      this.eventType = event.eventType
      this.eventId = event.eventId
    })
    this.fetchCertificates()
  }

  ngOnDestroy(): void {
    if (this.eventSubscription) {
      this.eventSubscription.unsubscribe()
    }
  }

  async fetchCertificates(): Promise<void> {
    // this.isLoading = true
    try {
      const response = await fetch(this.jsonUrl)
      if (!response.ok) { throw new Error('Failed to load certificates') }

      const data = await response.json()
      if (!Array.isArray(data.templates)) {
        throw new Error('Invalid JSON structure')
      }

      // Filter certificates based on event type
      if (this.eventType === 'registred with sphere') {
        this.certificates = data.templates.filter((template: { registered: boolean }) => template.registered)
      } else if (this.eventType === 'registred without sphere') {
        this.nonRegistered = true
        this.certificates = data.templates.filter((template: { registered: boolean }) => !template.registered)
      } else {
        this.certificates = data.templates
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      this.errorMessage = 'Failed to load certificate templates.'
    } finally {
      // this.isLoading = false
    }
  }

  selectCertificate(index: number): void {
    this.selectedCertIndex = index
  }

  generateCertificate(): void {
    console.log('Generating certificate...')
    this.isGenerating = true
    // if (this.isGenerating) { return }

    const selectedTemplate = this.certificates[this.selectedCertIndex]
    if (!selectedTemplate || !this.eventId) {
      console.error('Missing required data: eventId or templateId')
      return
    }


    if (this.nonRegistered) {
      // this.isGenerating = true // Show loader
      this.eventService.currentEvent
        .pipe(take(1)) // 👈 Only take one emission
        .subscribe(event => {
          const updatedEvent = { ...event, selectedTemplate }
          this.eventService.updateEvent(updatedEvent)
        })

      console.log('Selected Template:', selectedTemplate)
      const evendata = { eventId: this.eventId, templateId: selectedTemplate.templateId }
      // localStorage.setItem('certificate', JSON.stringify(evendata))
      this.eventService.editEvent(evendata).subscribe(
        response => {
          console.log('Edit Event updated successfully:', response)
        },
        error => {
          console.error('Error updating event: non ', error)
        }
      )
      // this.isGenerating = false // Hide loader
      this.navigateBack()
      return
    } else {
      this.eventService.generateCertificate(this.eventId, selectedTemplate.templateId).subscribe({
        next: response => {
          console.log('Certificate generated successfully:', response)
          this.eventService.currentEvent
            .pipe(take(1)) // 👈 Only take one emission
            .subscribe(event => {
              const updatedEvent = { ...event, selectedTemplate }
              this.eventService.updateEvent(updatedEvent)
            })
          const evendata = { eventId: this.eventId, templateId: selectedTemplate.templateId }
          // localStorage.setItem('certificate', JSON.stringify(evendata))
          this.eventService.editEvent(evendata).subscribe({
            next: res => console.log('Edit Event updated successfully:', res),
            error: err => console.error('Error updating event:', err)
          })
          this.navigatetoHome() // ✅ Navigate back to overview
        },
        error: error => {
          console.error('Error generating certificate:', error)
          this.isGenerating = false
        },
        complete: () => {
          this.isGenerating = false

        },
      })
    }



  }

  navigateBack(): void {
    this.router.navigate(['../overview'], { relativeTo: this.route })
  }

  navigatetoHome(): void {
    this.router.navigate(['/app/home/event-dashboard'])
  }
}
