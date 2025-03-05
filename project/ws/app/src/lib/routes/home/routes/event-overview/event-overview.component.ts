import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { AddParticipantsComponent } from '../add-participants/add-participants.component'
import { ActivatedRoute, Router } from '@angular/router'
import { EventService } from '../../services/event.service'
import { HttpClient } from '@angular/common/http'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import jsPDF from 'jspdf'
// import { SVG } from '@svgdotjs/svg.js'
import { svg2pdf } from 'svg2pdf.js'
// import { HttpClient } from '@angular/common/http'

@Component({
  selector: 'ws-app-event-overview',
  templateUrl: './event-overview.component.html',
  styleUrls: ['./event-overview.component.scss']
})
export class EventOverviewComponent implements OnInit {
  selectedEvent: any
  participantCount: number = 0
  certificateTemplates: any[] = []

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private eventService: EventService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    // ✅ Fetch certificate templates from the JSON file
    this.loadCertificateTemplates()

    // ✅ Get event details
    this.eventService.currentEvent.subscribe(event => {
      this.selectedEvent = event

      if (this.selectedEvent?.participantCount !== undefined) {
        this.participantCount = this.selectedEvent.participantCount
      } else {
        this.fetchParticipantsCount()
      }
    })

    console.log('Received Event in Overview:', this.selectedEvent, this.participantCount)
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

          if (response[0].certificateGenerationStatus === 'success') {
            this.selectedEvent.templateId = response[0].templateId
            this.checkSelectedTemplate()
          }

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

  addParticipant(): void {
    const dialogRef = this.dialog.open(AddParticipantsComponent, {
      width: '650px',
      disableClose: true,
      data: { eventId: this.selectedEvent.eventId }
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
        next: (blob) => {
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
        error: (error) => {
          console.error('Error downloading certificates:', error)
        }
      })
    } else {
      this.generateCertificatesForNonRegisteredUsers()
    }




  }


  generateCertificatesForNonRegisteredUsersold(): void {
    console.log('Generating certificates for non-registered users')
    if (!this.selectedEvent?.eventId) {
      console.error('Event ID is missing')
      return
    }

    const formattedDate = this.formatEventDate(this.selectedEvent.eventDate)

    this.eventService.getParticipants(this.selectedEvent.eventId).subscribe({
      next: (participants) => {
        console.log('Participants received:', participants) // Debugging
        if (!participants || participants.length === 0) {
          console.warn('No participants found for certificate generation')
          return
        }

        this.downloadAllCertificatesAsZip(participants, formattedDate)
      },
      error: (error) => {
        console.error('Error fetching participants:', error)
      }
    })
  }

  /**
   * ✅ Fetches SVG template, inserts participant details, converts to PDF, and zips all files.
   */
  downloadAllCertificatesAsZipold(participants: any[], date: string): void {
    if (!this.selectedEvent?.selectedTemplate?.templateLogo) {
      console.error('No certificate template selected')
      return
    }

    const zip = new JSZip()
    this.http.get('/mdo-assets/images/RMC-Online.svg', { responseType: 'text' }).subscribe(
      (svgTemplate) => {
        const promises = participants.map(participant =>
          this.generateCertificatePDF(svgTemplate, participant.firstName, date).then(pdfBlob => {
            console.log(`Generated PDF Blob for :`, pdfBlob)
            const fileName = `${participant.name}-${date}.pdf`
            zip.file(fileName, pdfBlob)
          })
        )


        Promise.all(promises).then(() => {
          console.log("All PDFs added to ZIP. Generating ZIP file...")
          zip.generateAsync({ type: 'blob' }).then(content => {
            console.log('ZIP generated:', content) // Debugging
            saveAs(content, 'Certificates.zip')
            console.log('ZIP file downloaded successfully')
          }).catch(error => console.error('Error generating ZIP:', error))
        })
      },
      (error) => {
        console.error('Error fetching SVG template:', error)
      }
    )
  }



  async generateCertificatePDF(svgTemplate: string, userName: string, date: string): Promise<Blob> {
    const modifiedSvg = svgTemplate.replace('{{name}}', userName).replace('{{date}}', date)
    console.log(`Generating PDF for: ${userName}`) // Debugging

    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF({ orientation: 'landscape' })
    const img = new Image()
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(modifiedSvg)

    return new Promise(resolve => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(modifiedSvg)

      img.onload = () => {
        console.log(`Image loaded for ${userName}`)

        // Set canvas size (adjust as needed)
        canvas.width = 1080
        canvas.height = 720

        // Draw SVG as an image on canvas
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)

        // Convert canvas to base64 PNG
        const imgData = canvas.toDataURL("image/png")

        // Add image to PDF
        pdf.addImage(imgData, 'PNG', 10, 10, 270, 190)

        // Generate and resolve the Blob
        const pdfBlob = pdf.output('blob')
        console.log(`Final PDF Blob for ${userName}:`, pdfBlob)
        resolve(pdfBlob)
      }

      img.onerror = (err) => {
        console.error(`Error loading image for ${userName}:`, err)
        // reject(err)
      }

      // img.onerror = (err) => {
      //   console.error(`Error loading image for ${userName}:`, err)
      //   console.error(`Error loading SVG for ${userName}`)
      // }
    })
  }


  /**
   * ✅ Converts ISO date to "DD/MM/YYYY" format
   */
  formatEventDateold(eventDate: string): string {
    if (!eventDate) return ''
    const dateObj = new Date(eventDate)
    return dateObj.toLocaleDateString('en-GB') // Converts to "DD/MM/YYYY"
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
      next: (participants) => {
        console.log('Participants received:', participants)
        if (!participants || participants.length === 0) {
          console.warn('No participants found for certificate generation')
          return
        }

        this.downloadAllCertificatesAsZip(participants, formattedDate)
      },
      error: (error) => {
        console.error('Error fetching participants:', error)
      }
    })
  }

  // Generate & download all certificates as a ZIP file
  async downloadAllCertificatesAsZip(participants: any[], date: string): Promise<void> {
    if (!this.selectedEvent?.selectedTemplate?.templateLogo) {
      console.error('No certificate template selected')
      return
    }

    try {
      const zip = new JSZip()
      const svgTemplate = await this.http.get('/mdo-assets/images/RMC-Online.svg', { responseType: 'text' }).toPromise()

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

  // Modify SVG by replacing placeholders with participant details
  generatePersonalizedSVG(svgTemplate: string, userName: string, date: string): string {
    return svgTemplate
      .replace('{{name}}', userName)
      .replace('{{date}}', date)
  }

  // Convert modified SVG to a high-quality PDF using svg2pdf.js
  async generatePDFBlob(svgString: string): Promise<Blob> {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = svgString
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    document.body.appendChild(tempDiv)

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    const svgElement = tempDiv.querySelector('svg') as SVGSVGElement
    if (svgElement) {
      await svg2pdf(svgElement, pdf, { x: 10, y: 10, width: 270, height: 190 })
    }

    document.body.removeChild(tempDiv)
    return pdf.output('blob')
  }

  // Converts ISO date to "DD/MM/YYYY" format
  formatEventDate(eventDate: string): string {
    if (!eventDate) return ''

    const dateObj = new Date(eventDate)
    const day = String(dateObj.getDate()).padStart(2, '0') // Ensure two digits
    const month = String(dateObj.getMonth() + 1).padStart(2, '0') // Months are 0-based
    const year = dateObj.getFullYear()

    return `${day}-${month}-${year}` // Returns "DD-MM-YYYY"
  }



}
