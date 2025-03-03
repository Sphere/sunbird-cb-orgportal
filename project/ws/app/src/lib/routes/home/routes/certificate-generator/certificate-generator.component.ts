import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'

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
  errorMessage = ''

  private jsonUrl = 'https://aastar-assets.s3.ap-south-1.amazonaws.com/rc-mdo-templates/MDO-RC-TEMPLATES.json'

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.fetchCertificates()
  }

  fetchCertificates(): void {
    fetch(this.jsonUrl)
      .then(response => {
        if (!response.ok) throw new Error('Failed to load certificates')
        return response.json()
      })
      .then(data => {
        if (data.templates && Array.isArray(data.templates)) {
          this.certificates = data.templates
          this.isLoading = false
        } else {
          throw new Error('Invalid JSON structure')
        }
      })
      .catch(error => {
        console.error('Error fetching templates:', error)
        this.errorMessage = 'Failed to load certificate templates.'
        this.isLoading = false
      })
  }

  selectCertificate(index: number): void {
    this.selectedCertIndex = index
  }



  navigateBack(): void {
    this.router.navigate(['../overview'], { relativeTo: this.route })
  }

}
