import { Component, OnInit, OnDestroy } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { AddParticipantsComponent } from '../add-participants/add-participants.component'
import { ActivatedRoute, Router } from '@angular/router'
import { EventService } from '../../services/event.service'
import { HttpClient } from '@angular/common/http'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { saveAs } from 'file-saver'
import { svg2pdf } from 'svg2pdf.js'
import JSZip from 'jszip'
import jsPDF from 'jspdf'
import { Subscription } from 'rxjs/internal/Subscription'
// @ts-ignore
import montserratBase64 from '../../../../../../../../../src//mdo-assets/fonts/montserrat/montserrat-base64.js'
// @ts-ignore
import montserratRegularBase64 from '../../../../../../../../../src/mdo-assets/fonts/montserrat/montserrat-regular-base64.js'
// import { Console } from 'console'
@Component({
  standalone: false,
  selector: 'ws-app-event-overview',
  templateUrl: './event-overview.component.html',
  styleUrls: ['./event-overview.component.scss'],
})
export class EventOverviewComponent implements OnInit, OnDestroy {
  selectedEvent: any
  participantCount = 0
  certificateTemplates: any[] = []
  private eventSubscription!: Subscription
  nonRegistered = false
  isDownloading = false
  // Certificates for no-registration events are rendered one per participant in the browser,
  // so this can run for a long time. Track progress rather than showing a bare spinner.
  downloadDone = 0
  downloadTotal = 0

  constructor(
    private readonly dialog: MatDialog,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly eventService: EventService,
    private readonly http: HttpClient,
    private readonly configSvc: ConfigurationsService
  ) { }

  ngOnInit(): void {
    // Fetch certificate templates from the JSON file
    this.loadCertificateTemplates()

    //  Get event details
    this.eventSubscription = this.eventService.currentEvent.subscribe(event => {
      this.selectedEvent = event
      this.nonRegistered = this.selectedEvent?.registrationType === 'registred without sphere'

      if (this.selectedEvent?.participantCount !== undefined) {
        this.participantCount = this.selectedEvent.participantCount
      } else {
        this.fetchParticipantsCount()
      }

      if (this.selectedEvent?.templateId) {
        this.checkSelectedTemplate()
      } else {
        //  Fetch already selected certificate from Event API
        this.fetchSelectedCertificate()
      }
    })


    console.log('Received Event in Overview:', this.selectedEvent, this.participantCount)
  }

  ngOnDestroy(): void {
    if (this.eventSubscription) {
      this.eventSubscription.unsubscribe()
      console.log('Unsubscribed from getEventById')
    }
  }

  /**
   * ✅ Fetch all certificate templates from JSON
   */
  loadCertificateTemplates(): void {
    const templateUrl = (this.configSvc.instanceConfig as any)?.externalUrls?.rcMdoTemplatesUrl
      || 'https://aastar-assets.s3.ap-south-1.amazonaws.com/rc-mdo-templates/MDO-RC-TEMPLATES.json'

    this.http.get<{ templates: any[] }>(templateUrl).subscribe({
      next: data => {
        this.certificateTemplates = data.templates
        this.checkSelectedTemplate()
      },
      error: err => console.error('Error fetching templates:', err),
    })
  }

  /**
   * ✅ Fetch participants count and templateId, then load the selected template
   */
  fetchParticipantsCount(): void {
    if (this.selectedEvent && this.selectedEvent.eventId) {
      this.eventService.getParticipants(this.selectedEvent.eventId).subscribe({
        next: response => {
          this.participantCount = response.length
          this.selectedEvent.participantCount = this.participantCount
          this.eventService.updateEvent(this.selectedEvent)
        },
        error: err => console.error('Error fetching participants:', err),
      })
    }
  }

  /**
   * ✅ Check if selected templateId exists and fetch the full template details
   */
  checkSelectedTemplate(): void {
    if (this.selectedEvent?.templateId && this.certificateTemplates.length > 0) {
      const foundTemplate = this.certificateTemplates.find(
        template => template.templateId === this.selectedEvent.templateId
      )

      if (foundTemplate) {
        this.selectedEvent.selectedTemplate = foundTemplate
      }
    }
  }

  fetchSelectedCertificate(): void {

    if (this.eventSubscription) {
      this.eventSubscription.unsubscribe()
    }

    if (!this.selectedEvent?.eventId) {
      console.error('Event ID is missing')
      return
    }

    this.eventSubscription = this.eventService.getEventById(this.selectedEvent.eventId).subscribe({
      next: eventData => {
        console.log('Event Data:', eventData)

        if (eventData?.templateId) {
          this.selectedEvent.templateId = eventData.templateId
          this.checkSelectedTemplate() // ✅ Fetch the full template details from S3 JSON
        } else {
          console.warn('No templateId found in event API response')
        }
      },
      error: error => {
        console.error('Error fetching event details:', error)
      },
    })
  }

  addParticipant(): void {
    const dialogRef = this.dialog.open(AddParticipantsComponent, {
      width: '650px',
      disableClose: true,
      data: {
        eventId: this.selectedEvent.eventId,
        eventType: this.nonRegistered
      },
    })

    dialogRef.afterClosed().subscribe({
      next: result => {
        if (result === 'saved') {
          this.fetchParticipantsCount()
          this.setTab('participants')
        }
      },
    })
  }

  setTab(tab: string): void {
    this.router.navigate(['../', tab], { relativeTo: this.route })
  }

  generateCert() {
    this.router.navigate(['../certificate'], { relativeTo: this.route })
  }

  downloadCertificates(): void {
    if (this.isDownloading || !this.selectedEvent?.eventId) { return }
    this.isDownloading = true

    if (this.selectedEvent?.selectedTemplate?.registered === true) {
      this.eventService.downloadCertificates(this.selectedEvent.eventId).subscribe({
        next: blob => {
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'certificates.zip'
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
          this.isDownloading = false
        },
        error: error => {
          console.error('Error downloading certificates:', error)
          this.isDownloading = false
        },
      })
    } else {
      this.generateCertificatesForNonRegisteredUsers()
    }
  }

  // Generate certificates for non-registered users
  generateCertificatesForNonRegisteredUsers(): void {
    if (!this.selectedEvent?.eventId) {
      this.isDownloading = false
      return
    }

    const formattedDate = this.formatEventDate(this.selectedEvent.eventDate)

    this.eventService.getParticipants(this.selectedEvent.eventId).subscribe({
      next: participants => {
        void (async () => {
        if (!participants || participants.length === 0) {
          console.warn('No participants found for certificate generation')
          this.isDownloading = false
          return
        }
        try {
          await this.downloadAllCertificatesAsZip(participants, formattedDate)
        } finally {
          this.isDownloading = false
        }
        })()
      },
      error: error => {
        console.error('Error fetching participants:', error)
        this.isDownloading = false
      },
    })
  }

  async downloadAllCertificatesAsZip(participants: any[], date: string) {
    if (!this.selectedEvent?.selectedTemplate?.templateLogo) {
      console.error('No certificate template selected')
      return
    }

    try {
      const zip = new JSZip()
      this.downloadDone = 0
      this.downloadTotal = participants.length
      const templateUrl = this.selectedEvent.selectedTemplate.templateLogo
      // const templateUrl = "/mdo-assets/images/RMC-Online.svg"

      // Fetch the SVG template
      const response = await fetch(templateUrl, { cache: 'no-store' })
      if (!response.ok) {
        throw new Error(`Failed to fetch template: ${response.statusText}`)
      }
      const svgTemplate = await response.text()

      for (const participant of participants) {
        console.log(`Generating certificate for: ${participant.firstName} Surname: ${participant.lastName}`)
        let userName = participant.firstName
        if (participant.lastName) {
          userName += ` ${participant.lastName}`
        }
        // Generate personalized SVG with participant details
        const personalizedSVG = this.generatePersonalizedSVG(svgTemplate, userName, date)

        // Convert modified SVG to a PDF
        const pdfBlob = await this.generatePDFBlob(personalizedSVG)

        // Add the generated PDF to the ZIP file
        const fileName = `${participant.firstName}-${date}.pdf`
        zip.file(fileName, pdfBlob)
        this.downloadDone += 1
        // svg2pdf/jsPDF work is synchronous CPU, so without yielding the browser never gets
        // a frame: the spinner freezes and the counter never updates until the whole run
        // finishes. Handing control back each iteration keeps the UI responsive.
        await new Promise((resolve) => setTimeout(resolve, 0))
        console.log(`Added ${fileName} to ZIP.`)
      }

      // Generate and download ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      this.downloadTotal = 0
      saveAs(zipBlob, 'Certificates.zip')
      console.log('ZIP file downloaded successfully.')
    } catch (error) {
      console.error('Error during certificate generation:', error)
    }
  }


  // Modify SVG by replacing placeholders with participant details
  generatePersonalizedSVG(svgTemplate: string, userName: string, date: string): string {
    return svgTemplate
      .replace('{{name}}', userName)
      .replace('{{date}}', date)
  }

  // Convert modified SVG to a high-quality PDF using svg2pdf.js
  async generatePDFBlob(svgString: string): Promise<Blob> {

    // const simpleSvg = `
    //   <svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
    //     <text xmlns="http://www.w3.org/2000/svg" x="10" y="50" id="i0yd1c-2" font-family="Montserrat" font-size="24">Sumit</text>
    //     <text x="10" y="80" font-family="Montserrat" font-size="30">
    // Vishali sakar
    //     </text>
    //   </svg>
    // `

    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = svgString
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    document.body.appendChild(tempDiv)
    // console.log(svgString)

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    pdf.addFileToVFS('Montserrat-Regular.ttf', montserratBase64)
    pdf.addFont('Montserrat-Regular.ttf', 'Montserrat', 'normal')
    pdf.setFont('Montserrat', 'normal')
    const svgElement = tempDiv.querySelector('svg') as SVGSVGElement
    if (svgElement) {
      await svg2pdf(svgElement, pdf, { x: 10, y: 10, width: 270, height: 190 })
    }

    document.body.removeChild(tempDiv)
    return pdf.output('blob')
  }

  // Converts ISO date to "DD/MM/YYYY" format
  formatEventDate(eventDate: string): string {
    if (!eventDate) { return '' }

    const dateObj = new Date(eventDate)
    const day = String(dateObj.getDate()).padStart(2, '0') // Ensure two digits
    const month = String(dateObj.getMonth() + 1).padStart(2, '0') // Months are 0-based
    const year = dateObj.getFullYear()

    return `${day}-${month}-${year}` // Returns "DD-MM-YYYY"
  }

}
