import { Component, OnInit, OnDestroy } from '@angular/core'
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout'
import { SafeResourceUrl, SafeStyle } from '@angular/platform-browser'
import { map } from 'rxjs/operators'
import { ConfigurationsService, NsPage } from '@sunbird-cb/utils'
import { Subscription } from 'rxjs'
import { ActivatedRoute } from '@angular/router'
import { SanitizerService } from '../../../services/sanitizer.service'
import { IAboutObject } from './about.model'

@Component({
  selector: 'ws-public-about',
  templateUrl: './public-about.component.html',
  styleUrls: ['./public-about.component.scss'],
})
export class PublicAboutComponent implements OnInit, OnDestroy {
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
    private breakpointObserver: BreakpointObserver,
    private sanitizerSvc: SanitizerService,
    private configSvc: ConfigurationsService,
    private activateRoute: ActivatedRoute,
  ) { }

  ngOnInit() {
    this.subscriptionAbout = this.activateRoute.data.subscribe(data => {
      this.aboutPage = data.pageData.data
      if (this.aboutPage && this.aboutPage.banner && this.aboutPage.banner.videoLink) {
        this.videoLink = this.sanitizerSvc.trustResourceUrl(
          this.aboutPage.banner.videoLink,
        )
      }
    })

    if (this.configSvc.instanceConfig) {
      (this.headerBanner = this.sanitizerSvc.trustStyleUrl(
        this.configSvc.instanceConfig.logos.aboutHeader,
      )),
        (this.footerBanner = this.sanitizerSvc.trustStyleUrl(
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
