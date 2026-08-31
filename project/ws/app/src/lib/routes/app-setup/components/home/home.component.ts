import { Component, OnInit, OnDestroy } from '@angular/core'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { SafeUrl } from '@angular/platform-browser'
import { Event, NavigationEnd, Router } from '@angular/router'
import { SanitizerService } from 'src/app/services/sanitizer.service'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

@Component({
  standalone: false,
  selector: 'ws-app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>()
  appIcon: SafeUrl = ''
  stepCount = 1
  appName = ''
  showStepCount = false
  constructor(private readonly configSvc: ConfigurationsService, private readonly sanitizerService: SanitizerService, private readonly router: Router) {
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((e: Event) => {
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

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
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
