import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { EventService } from '../../services/event.service'

interface CertificateTemplate {
  templateId: string
  templateLogo: string
  templateName: string
}

@Component({
  selector: 'ws-app-certificate-generator',
  templateUrl: './certificate-generator.component.html',
  styleUrls: ['./certificate-generator.component.scss']
})
export class CertificateGeneratorComponent implements OnInit {

  certificates: CertificateTemplate[] = []
  selectedCertIndex = 0
  isLoading = true
  isGenerating = false
  errorMessage = ''
  eventId: string = '' // Store event ID dynamically
  eventType: string = ''
  // eventDetails: any

  private readonly jsonUrl = 'https://aastar-assets.s3.ap-south-1.amazonaws.com/rc-mdo-templates/MDO-RC-TEMPLATES.json'
  nonRegistered: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private eventService: EventService
  ) { }

  ngOnInit(): void {


    this.eventService.currentEvent.subscribe(event => {
      this.eventType = event.eventType
      this.eventId = event.eventId
    })
    console.log('Received Event in Overview:', this.eventId)
    this.fetchCertificates()
  }

  async fetchCertificates(): Promise<void> {
    this.isLoading = true
    try {
      const response = await fetch(this.jsonUrl)
      if (!response.ok) throw new Error('Failed to load certificates')

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
      this.isLoading = false
    }
  }


  selectCertificate(index: number): void {
    this.selectedCertIndex = index
  }

  generateCertificate(): void {


    if (this.isGenerating) return

    const selectedTemplate = this.certificates[this.selectedCertIndex]
    if (!selectedTemplate || !this.eventId) {
      console.error("Missing required data: eventId or templateId")
      return
    }

    if (this.nonRegistered) {
      this.eventService.currentEvent.subscribe(event => {
        const updatedEvent = { ...event, selectedTemplate }
        this.eventService.updateEvent(updatedEvent)
        let evendata = { "eventId": this.eventId, "templateId": selectedTemplate.templateId }
        this.eventService.editEvent(evendata).subscribe(
          response => {
            console.log('Edit Event updated successfully:', response)
          },
          error => {
            console.error('Error updating event:', error)
          }
        )
      })
      this.navigateBack()
      return
    } else {
      this.isGenerating = true // Show loader

      this.eventService.generateCertificate(this.eventId, selectedTemplate.templateId).subscribe({
        next: (response) => {
          console.log("Certificate generated successfully:", response)
          this.eventService.currentEvent.subscribe(event => {
            const updatedEvent = { ...event, selectedTemplate }
            this.eventService.updateEvent(updatedEvent)
          })
          let evendata = { "eventId": this.eventId, "templateId": selectedTemplate.templateId }
          this.eventService.editEvent(evendata).subscribe(
            response => {
              console.log('Edit Event updated successfully:', response)
            },
            error => {
              console.error('Error updating event:', error)
            }
          )
          this.isGenerating = false
          this.navigateBack() // ✅ Navigate back to overview
          // alert("Certificate generated successfully!") // Replace with better UI feedback
        },
        error: (error) => {
          console.error("Error generating certificate:", error)
          // alert("Failed to generate certificate. Please try again.")
        },
        complete: () => {
          this.isGenerating = false // Hide loader
        }
      })
    }


  }

  navigateBack(): void {
    this.router.navigate(['../overview'], { relativeTo: this.route })
  }
}
