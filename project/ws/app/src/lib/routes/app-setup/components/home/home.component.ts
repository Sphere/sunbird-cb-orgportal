import { Component, OnInit } from '@angular/core'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { SafeUrl } from '@angular/platform-browser'
import { Event, NavigationEnd, Router } from '@angular/router'
import { SanitizerService } from 'src/app/services/sanitizer.service'

@Component({
  selector: 'ws-app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  appIcon: SafeUrl = ''
  stepCount = 1
  appName = ''
  showStepCount = false
  constructor(private configSvc: ConfigurationsService, private sanitizerService: SanitizerService, private router: Router) {
    this.router.events.subscribe((e: Event) => {
      if (e instanceof NavigationEnd) {
        if (e.url.includes('lang')) {
          this.stepCount = 1
          this.showStepCount = true
        } else if (e.url.includes('tnc')) {
          this.stepCount = 2
          this.showStepCount = true
        } else if (e.url.includes('about-video')) {
          this.stepCount = 3
          this.showStepCount = true
        } else if (e.url.includes('interest')) {
          this.stepCount = 4
          this.showStepCount = true
        } else {
          this.showStepCount = false
        }

      }
    })
  }

  ngOnInit() {
    if (this.configSvc.instanceConfig) {
      this.appName = this.configSvc.instanceConfig.details.appName
      this.appIcon = this.sanitizerService.trustResourceUrl(
        this.configSvc.instanceConfig.logos.appTransparent,
      )
    }
  }

}
