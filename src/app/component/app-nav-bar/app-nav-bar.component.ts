import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core'
import { SafeUrl } from '@angular/platform-browser'
import { IBtnAppsConfig, CustomTourService } from '@sunbird-cb/collection'
import { NsWidgetResolver } from '@sunbird-cb/resolver'
import { ConfigurationsService, NsPage } from '@sunbird-cb/utils'
import { Router, NavigationStart, NavigationEnd, Event } from '@angular/router'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { SanitizerService } from 'src/app/services/sanitizer.service'

@Component({
  standalone: false,
  selector: 'ws-app-nav-bar',
  templateUrl: './app-nav-bar.component.html',
  styleUrls: ['./app-nav-bar.component.scss'],
})
export class AppNavBarComponent implements OnInit, OnChanges, OnDestroy {
  private readonly destroy$ = new Subject<void>()
  isDashboardReport: boolean = false
  @Input() mode: 'top' | 'bottom' = 'top'
  // @Input()
  // @HostBinding('id')
  // public id!: string
  basicBtnAppsConfig: NsWidgetResolver.IRenderConfigWithTypedData<IBtnAppsConfig> = {
    widgetType: 'actionButton',
    widgetSubType: 'actionButtonApps',
    widgetData: { allListingUrl: '/app/features' },
  }
  instanceVal = ''
  btnAppsConfig!: NsWidgetResolver.IRenderConfigWithTypedData<IBtnAppsConfig>
  appIcon: SafeUrl | null = null
  appBottomIcon?: SafeUrl
  primaryNavbarBackground: Partial<NsPage.INavBackground> | null = null
  primaryNavbarConfig: any | null = null
  pageNavbar: Partial<NsPage.INavBackground> | null = null
  featureApps: string[] = []
  isHelpMenuRestricted = false
  isTourGuideAvailable = false
  isTourGuideClosed = false
  showAppNavBar = false
  popupTour: any
  constructor(
    private readonly sanitizerService: SanitizerService,
    private readonly configSvc: ConfigurationsService,
    private readonly tourService: CustomTourService,
    private readonly router: Router,
  ) {
    this.btnAppsConfig = { ...this.basicBtnAppsConfig }
    if (this.configSvc.restrictedFeatures) {
      this.isHelpMenuRestricted = this.configSvc.restrictedFeatures.has('helpNavBarMenu')
    }
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.cancelTour()
      } else if (event instanceof NavigationEnd) {
        this.cancelTour()
      }
    })
  }

  ngOnInit() {
    const roles = this.configSvc.unMappedUser?.roles || []
    const hasDashboardViewerRole = roles.includes('MDO_DASHBOARD_VIEWER')
    const hasAdminRole = roles.includes('MDO_ADMIN')

    this.isDashboardReport = hasDashboardViewerRole

    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((e: Event) => {
      if (e instanceof NavigationEnd) {
        if (
          e.url.includes('/app/setup') &&
          this.configSvc.instanceConfig &&
          !this.configSvc.instanceConfig.showNavBarInSetup
        ) {
          this.showAppNavBar = false
        } else {
          this.showAppNavBar = true
        }
      }
    })

    if (this.configSvc.instanceConfig) {
      this.appIcon = this.sanitizerService.trustResourceUrl(
        'https://aastar-assets.s3.ap-south-1.amazonaws.com/mdo-frac/icons/Foundation-secondary.svg',
      )
      this.instanceVal = this.configSvc.rootOrg || ''
      if (this.configSvc.instanceConfig.logos.appBottomNav) {
        this.appBottomIcon = this.sanitizerService.trustResourceUrl(
          this.configSvc.instanceConfig.logos.appBottomNav,
        )
      }
      this.primaryNavbarBackground = this.configSvc.primaryNavBar
      this.pageNavbar = this.configSvc.pageNavBar
      this.primaryNavbarConfig = this.configSvc.primaryNavBarConfig

      if (this.primaryNavbarConfig?.mediumScreen?.right) {
        this.primaryNavbarConfig.mediumScreen.right =
          this.primaryNavbarConfig.mediumScreen.right.filter((item: any) => {
            if (item.type === 'featureButton') {
              const id = item.config?.actionBtnId

              if (id === 'feature_home') {
                return hasAdminRole
              }
              if (id === 'feature_mydashboard') {
                return hasDashboardViewerRole
              }
              if (id === 'feature_notification') {
                return false // Hide notification
              }
            }
            return true
          })
      }
    }

    if (this.configSvc.appsConfig) {
      this.featureApps = Object.keys(this.configSvc.appsConfig.features)
    }
    this.configSvc.tourGuideNotifier.pipe(takeUntil(this.destroy$)).subscribe(canShow => {

      if (
        this.configSvc.restrictedFeatures &&
        !this.configSvc.restrictedFeatures.has('tourGuide')
      ) {
        this.isTourGuideAvailable = canShow
        this.popupTour = this.tourService.createPopupTour()
      }
    })
  }

  getFeatureUrl(actionBtnId: string): string {
    return (this.configSvc.appsConfig as any)?.features?.[actionBtnId]?.url || '/'
  }

  getFeatureIcon(actionBtnId: string): string {
    return (this.configSvc.appsConfig as any)?.features?.[actionBtnId]?.icon || 'home'
  }

  getUserInitials(): string {
    const first = this.configSvc.userProfile?.firstName?.charAt(0) || 'G'
    const last = this.configSvc.userProfile?.lastName?.charAt(0) || 'U'
    return (first + last).toUpperCase()
  }

  logout(): void {
    globalThis.location.href = '/public/logout'
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const property in changes) {
      if (property === 'mode') {
        if (this.mode === 'bottom') {
          this.btnAppsConfig = {
            ...this.basicBtnAppsConfig,
            widgetData: {
              ...this.basicBtnAppsConfig.widgetData,
              showTitle: true,
            },
          }
        } else {
          this.btnAppsConfig = {
            ...this.basicBtnAppsConfig,
          }
        }
      }
    }
  }

  startTour() {
    this.tourService.startTour()
    this.tourService.isTourComplete.pipe(takeUntil(this.destroy$)).subscribe((result: boolean) => {
      if ((result)) {
        this.tourService.startPopupTour()
        this.configSvc.completedTour = true
        this.configSvc.prefChangeNotifier.next({ completedTour: this.configSvc.completedTour })
        // this.tour = tour
        setTimeout(
          () => {
            this.tourService.cancelPopupTour()
          },
          3000,
        )
      }
    })
  }
  cancelTour() {
    if (this.popupTour) {
      this.tourService.cancelPopupTour()
      this.isTourGuideClosed = false
    }

  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
