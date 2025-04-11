import { Component, OnInit, OnDestroy } from '@angular/core'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { AddParticipantsComponent } from '../add-participants/add-participants.component'
import { ActivatedRoute, Router } from '@angular/router'
import { EventService } from '../../services/event.service'
import { HttpClient, HttpHeaders } from '@angular/common/http'
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

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private eventService: EventService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    // Fetch certificate templates from the JSON file
    this.loadCertificateTemplates()

    //  Get event details
    this.eventService.currentEvent.subscribe(event => {
      this.selectedEvent = event

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
    this.nonRegistered = this.selectedEvent.registrationType === 'registred without sphere' ? true : false


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
    const templateUrl = 'https://aastar-assets.s3.ap-south-1.amazonaws.com/rc-mdo-templates/MDO-RC-TEMPLATES.json'

    this.http.get<{ templates: any[] }>(templateUrl).subscribe(
      data => {
        this.certificateTemplates = data.templates
        this.checkSelectedTemplate()
      },
      error => {
        console.error('Error fetching templates:', error)
      }
    )
  }

  /**
   * ✅ Fetch participants count and templateId, then load the selected template
   */
  fetchParticipantsCount(): void {
    if (this.selectedEvent && this.selectedEvent.eventId) {
      this.eventService.getParticipants(this.selectedEvent.eventId).subscribe(
        response => {
          this.participantCount = response.length
          this.selectedEvent.participantCount = this.participantCount

          // if (response[0].certificateGenerationStatus === 'success') {
          //   this.selectedEvent.templateId = response[0].templateId
          //   this.checkSelectedTemplate()
          // }

          this.eventService.updateEvent(this.selectedEvent)
        },
        error => {
          console.error('Error fetching participants:', error)
        }
      )
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

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'saved') {
        this.fetchParticipantsCount()
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

  downloadCertificates(): void {
    if (!this.selectedEvent?.eventId) {
      console.error('Event ID is missing')
      return
    }
    console.log(this.selectedEvent)
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
          console.log('Certificates downloaded successfully')
        },
        error: error => {
          console.error('Error downloading certificates:', error)
        },
      })
    } else {
      this.generateCertificatesForNonRegisteredUsers()
    }

  }

  // Generate certificates for non-registered users
  generateCertificatesForNonRegisteredUsers(): void {
    console.log('Generating certificates for non-registered users')

    if (!this.selectedEvent?.eventId) {
      console.error('Event ID is missing')
      return
    }

    const formattedDate = this.formatEventDate(this.selectedEvent.eventDate)

    this.eventService.getParticipants(this.selectedEvent.eventId).subscribe({
      next: participants => {
        console.log('Participants received:', participants)
        if (!participants || participants.length === 0) {
          console.warn('No participants found for certificate generation')
          return
        }

        this.downloadAllCertificatesAsZip(participants, formattedDate)
      },
      error: error => {
        console.error('Error fetching participants:', error)
      },
    })
  }

  // Generate & download all certificates as a ZIP file
  async downloadAllCertificatesAsZipold(participants: any[], date: string): Promise<void> {
    if (!this.selectedEvent?.selectedTemplate?.templateLogo) {
      console.error('No certificate template selected')
      return
    }

    try {
      const zip = new JSZip()
      // this.http.get(this.selectedEvent.selectedTemplate.templateLogo, { responseType: 'text' }) - for prod
      // this.http.get('/mdo-assets/images/RMC-Online.svg', { responseType: 'text' }) - local use age
      const svgTemplate = await this.http.get(this.selectedEvent.selectedTemplate.templateLogo,
        {
          responseType: 'text',
          headers: new HttpHeaders({
            'Cache-Control': 'no-store',
            'Access-Control-Allow-Origin': '*',
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "*",
            "content-type": "image/svg+xml"
          })
        }).toPromise()

      fetch(this.selectedEvent.selectedTemplate.templateLogo, { mode: 'no-cors' })
        .then(response => response.text())
        .then(svg => console.log('Fetched SVG:', svg))
        .catch(error => console.error('Fetch error:', error))

      for (const participant of participants) {
        console.log(`Generating certificate for: ${participant.firstName}`)

        // Generate personalized SVG with participant details
        const personalizedSVG = this.generatePersonalizedSVG(svgTemplate, participant.firstName, date)

        // Convert modified SVG to a PDF
        const pdfBlob = await this.generatePDFBlob(personalizedSVG)

        // Add the generated PDF to the ZIP file
        const fileName = `${participant.firstName}-${date}.pdf`
        zip.file(fileName, pdfBlob)
        console.log(`Added ${fileName} to ZIP.`)
      }

      // Generate and download ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      saveAs(zipBlob, 'Certificates.zip')
      console.log('ZIP file downloaded successfully.')

    } catch (error) {
      console.error('Error during certificate generation:', error)
    }
  }

  async downloadAllCertificatesAsZip(participants: any[], date: string) {
    if (!this.selectedEvent?.selectedTemplate?.templateLogo) {
      console.error('No certificate template selected')
      return
    }

    try {
      const zip = new JSZip()
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
        console.log(`Added ${fileName} to ZIP.`)
      }

      // Generate and download ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' })
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
