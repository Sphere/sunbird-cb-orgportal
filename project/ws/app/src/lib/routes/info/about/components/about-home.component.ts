import { Component, OnInit, OnDestroy } from '@angular/core'
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout'
import {
  SafeResourceUrl,
  SafeStyle,
} from '@angular/platform-browser'
import { map } from 'rxjs/operators'
import { ConfigurationsService, NsPage } from '@sunbird-cb/utils'
import { ActivatedRoute } from '@angular/router'
import { SanitizerService } from 'src/app/services/sanitizer.service'
import { IAboutObject } from '../../../../../../../../../src/app/routes/public/public-about/about.model'
import { Subscription } from 'rxjs'

@Component({
  selector: 'ws-app-about-home',
  templateUrl: './about-home.component.html',
  styleUrls: ['./about-home.component.scss'],
})
export class AboutHomeComponent implements OnInit, OnDestroy {
  objectKeys = Object.keys
  headerBanner: SafeStyle | null = null
  footerBanner: SafeStyle | null = null
  pageNavbar: Partial<NsPage.INavBackground> = this.configSvc.pageNavBar
  aboutPage: IAboutObject | null = null
  private subscriptionAbout: Subscription | null = null

  isSmallScreen$ = this.breakpointObserver
    .observe(Breakpoints.XSmall)
    .pipe(map(breakPointState => breakPointState.matches))

  videoLink: SafeResourceUrl | null = null

  constructor(
    private readonly breakpointObserver: BreakpointObserver,
    private readonly sanitizerService: SanitizerService,
    private readonly configSvc: ConfigurationsService,
    private readonly activateRoute: ActivatedRoute,
  ) { }

  ngOnInit() {
    this.subscriptionAbout = this.activateRoute.data.subscribe(data => {
      this.aboutPage = data.pageData.data
      if (this.aboutPage && this.aboutPage.banner && this.aboutPage.banner.videoLink) {
        this.videoLink = this.sanitizerService.trustResourceUrl(
          this.aboutPage.banner.videoLink,
        )
      }
    })

    if (this.configSvc.instanceConfig) {
      (this.headerBanner = this.sanitizerService.trustStyleUrl(
        this.configSvc.instanceConfig.logos.aboutHeader,
      )),
        (this.footerBanner = this.sanitizerService.trustStyleUrl(
          this.configSvc.instanceConfig.logos.aboutFooter,
        ))
    }
  }

  ngOnDestroy() {
    if (this.subscriptionAbout) {
      this.subscriptionAbout.unsubscribe()
    }
  }
}
