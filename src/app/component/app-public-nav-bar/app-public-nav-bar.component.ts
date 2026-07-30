import { Component, OnInit } from '@angular/core'
import { SafeUrl } from '@angular/platform-browser'
import { ConfigurationsService, NsPage } from '@sunbird-cb/utils'
import { SanitizerService } from '../../services/sanitizer.service'

@Component({
  selector: 'ws-app-public-nav-bar',
  templateUrl: './app-public-nav-bar.component.html',
  styleUrls: ['./app-public-nav-bar.component.scss'],
})
export class AppPublicNavBarComponent implements OnInit {
  appIcon: SafeUrl | null = null
  logo = ''
  appName = ''
  navBar: Partial<NsPage.INavBackground> | null = null
  constructor(private sanitizerSvc: SanitizerService, private configSvc: ConfigurationsService) { }

  public get showPublicNavbar(): boolean {
    return true
  }

  ngOnInit() {
    if (this.configSvc.instanceConfig) {
      this.appIcon = this.sanitizerSvc.trustResourceUrl(
        this.configSvc.instanceConfig.logos.appTransparent,
      )
      this.appName = this.configSvc.instanceConfig.details.appName
      this.navBar = this.configSvc.primaryNavBar
    }
  }
}
