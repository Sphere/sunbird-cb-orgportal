import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'

@Component({
  selector: 'ws-app-certificate-generator',
  templateUrl: './certificate-generator.component.html',
  styleUrls: ['./certificate-generator.component.scss']
})
export class CertificateGeneratorComponent implements OnInit {

  certificates = [
    { thumbnail: 'mdo-assets/images/cert_1.svg', svgPath: 'mdo-assets/images/cert_1.svg' },
    { thumbnail: 'mdo-assets/images/cert_2.svg', svgPath: 'mdo-assets/images/cert_1.svg' },
    { thumbnail: 'mdo-assets/images/cert_3.svg', svgPath: 'mdo-assets/images/cert_1.svg' },
    { thumbnail: 'mdo-assets/images/cert_1.svg', svgPath: 'mdo-assets/images/cert_1.svg' },
    { thumbnail: 'mdo-assets/images/cert_2.svg', svgPath: 'mdo-assets/images/cert_1.svg' },
    { thumbnail: 'mdo-assets/images/cert_3.svg', svgPath: 'mdo-assets/images/cert_1.svg' }
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

  generateAndDownload(): void {
    const selectedCertificate = this.certificates[this.selectedCertIndex].svgPath
    const link = document.createElement('a')
    link.href = selectedCertificate
    link.download = `certificate_${this.selectedCertIndex + 1}.svg`
    console.log('Downloading:', link.download)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  navigateBack(): void {
    this.router.navigate(['../overview'], { relativeTo: this.route })
  }

}
