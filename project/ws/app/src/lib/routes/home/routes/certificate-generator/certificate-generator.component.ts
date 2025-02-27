import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import jsPDF from 'jspdf'
// import html2canvas from 'html2canvas'
// import { Canvg } from "canvg"
import { SVG } from '@svgdotjs/svg.js'

@Component({
  selector: 'ws-app-certificate-generator',
  templateUrl: './certificate-generator.component.html',
  styleUrls: ['./certificate-generator.component.scss']
})
export class CertificateGeneratorComponent implements OnInit {

  certificates = [
    { thumbnail: 'mdo-assets/images/Active-Birth.svg', svgPath: 'mdo-assets/images/Active-Birth.svg' },
    { thumbnail: 'mdo-assets/images/Biomechanics-of-birth.svg', svgPath: 'mdo-assets/images/Biomechanics-of-birth.svg' },
    { thumbnail: 'mdo-assets/images/Biomechanics-rebozo.svg', svgPath: 'mdo-assets/images/Biomechanics-rebozo.svg' },
    { thumbnail: 'mdo-assets/images/Evidence-based-practice.svg', svgPath: 'mdo-assets/images/Evidence-based-practice.svg' },
    { thumbnail: 'mdo-assets/images/Faculty-development-pro.svg', svgPath: 'mdo-assets/images/Faculty-development-pro.svg' },
    { thumbnail: 'mdo-assets/images/Helping babies breathe.svg', svgPath: 'mdo-assets/images/Helping babies breathe.svg' },
    { thumbnail: 'mdo-assets/images/Rebozo.svg', svgPath: 'mdo-assets/images/Rebozo.svg' },
    { thumbnail: 'mdo-assets/images/RMC-main.svg', svgPath: 'mdo-assets/images/RMC-main.svg' },
    { thumbnail: 'mdo-assets/images/RMC-Online.svg', svgPath: 'mdo-assets/images/RMC-Online.svg' },
    { thumbnail: 'mdo-assets/images/Vaginal-Breech-Birth.svg', svgPath: 'mdo-assets/images/Vaginal-Breech-Birth.svg' }
  ];
  selectedCertIndex = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
  }

  selectCertificate(index: number): void {
    this.selectedCertIndex = index
  }

  generateAndDownloadSVGold(userName: string, date: string): void {
    const selectedCertificatePath = this.certificates[this.selectedCertIndex].svgPath

    fetch(selectedCertificatePath)
      .then(response => response.text()) // Fetch the SVG as a text string
      .then(svgData => {
        console.log("SVG Loaded Successfully")

        // Insert dynamic values (Modify SVG text dynamically)
        svgData = svgData.replace("{{NAME}}", userName)  // Replace with actual name
        svgData = svgData.replace("{{DATE}}", date)      // Replace with actual date

        // High-resolution settings
        const scaleFactor = 3 // Adjust for higher clarity
        const canvasWidth = 1000 * scaleFactor
        const canvasHeight = 600 * scaleFactor

        // Create an SVG.js instance
        const draw = SVG().size(1000, 600)
        draw.svg(svgData)

        // Convert SVG to canvas
        const canvas = document.createElement("canvas")
        canvas.width = canvasWidth
        canvas.height = canvasHeight
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          console.error("Could not get canvas context.")
          return
        }

        // Create an image from SVG
        const img = new Image()
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
        const url = URL.createObjectURL(svgBlob)

        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
          URL.revokeObjectURL(url)

          // Convert to PNG
          const imgData = canvas.toDataURL("image/png")

          // Create PDF
          const pdf = new jsPDF("landscape")
          const pdfWidth = pdf.internal.pageSize.getWidth()
          const pdfHeight = pdf.internal.pageSize.getHeight()

          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
          pdf.save(`certificate_${userName.replace(/\s+/g, "_")}_${date}.pdf`)
        }

        img.src = url
      })
      .catch(error => console.error("Error loading SVG:", error))
  }


  generateAndDownloadSVG(userName: string, date: string): void {
    const selectedCertificatePath = this.certificates[this.selectedCertIndex].svgPath

    fetch(selectedCertificatePath)
      .then(response => response.text())
      .then(svgData => {
        console.log("SVG Loaded Successfully")

        // Replace placeholders dynamically
        svgData = svgData.replace("{{NAME}}", userName)
        svgData = svgData.replace("{{DATE}}", date)

        // High-resolution settings
        const scaleFactor = 3 // Adjust for higher clarity
        const canvasWidth = 1000 * scaleFactor
        const canvasHeight = 600 * scaleFactor

        // Create an SVG.js instance
        const draw = SVG().size(canvasWidth, canvasHeight)
        draw.svg(svgData)

        // Create high-resolution canvas
        const canvas = document.createElement("canvas")
        canvas.width = canvasWidth
        canvas.height = canvasHeight
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          console.error("Could not get canvas context.")
          return
        }

        // Create an image from SVG
        const img = new Image()
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
        const url = URL.createObjectURL(svgBlob)

        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
          URL.revokeObjectURL(url)

          // Convert to high-quality PNG
          const imgData = canvas.toDataURL("image/png", 1.0) // 1.0 for best quality

          // Create PDF with higher quality
          const pdf = new jsPDF("landscape", "mm", [canvasWidth / 4, canvasHeight / 4]) // Adjust PDF size
          pdf.addImage(imgData, "PNG", 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight())
          pdf.save(`certificate_${userName.replace(/\s+/g, "_")}_${date}.pdf`)
        }

        img.src = url
      })
      .catch(error => console.error("Error loading SVG:", error))
  }


  navigateBack(): void {
    this.router.navigate(['../overview'], { relativeTo: this.route })
  }

}
