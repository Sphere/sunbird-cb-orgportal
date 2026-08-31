import { Component, OnInit, OnDestroy } from '@angular/core'
import { Router, Event, NavigationEnd, ActivatedRoute } from '@angular/router'
import { ILeftMenuWithoutLogo } from '@sunbird-cb/collection'
import { NsWidgetResolver } from '@sunbird-cb/resolver'
import { ValueService } from '@sunbird-cb/utils'
import { map } from 'rxjs/operators'
/* tslint:disable */
import _ from 'lodash'
/* tslint:enable */
@Component({
  standalone: false,
  selector: 'ws-app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  currentRoute = 'roles-access'
  myRoles!: Set<string>
  widgetData!: NsWidgetResolver.IWidgetData<ILeftMenuWithoutLogo>
  isLtMedium$ = this.valueSvc.isLtMedium$
  mode$ = this.isLtMedium$.pipe(map(isMedium => (isMedium ? 'over' : 'side')))
  private defaultSideNavBarOpenedSubscription: any
  public screenSizeIsLtMedium = false
  sideNavBarOpened = true
  role: any
  constructor(private readonly valueSvc: ValueService,
    // tslint:disable-next-line:align
    private readonly router: Router,
    // tslint:disable-next-line:align
    private readonly activeRoute: ActivatedRoute,
  ) {
    if (_.get(this.activeRoute, 'snapshot.data.configService.userRoles')) {
      this.myRoles = _.get(this.activeRoute, 'snapshot.data.configService.userRoles')
    }

    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        this.bindUrl(event.urlAfterRedirects.replace('/app/roles-access/', ''))
        const fullProfile = _.get(this.activeRoute.snapshot, 'data.configService')
        const departmentName = fullProfile ? fullProfile.unMappedUser.channel : ''
        // if (this.activeRoute.snapshot.data.department.data) {
        if (fullProfile) {
          const leftData = this.activeRoute.snapshot.data.pageData.data.menus
          _.set(leftData, 'widgetData.logo', true)
          _.set(leftData, 'widgetData.logoPath', 'https://aastar-assets.s3.ap-south-1.amazonaws.com/mdo-frac/icons/aastrika_menu_logo.svg')
          _.set(leftData, 'widgetData.name', departmentName)
          _.set(leftData, 'widgetData.userRoles', this.myRoles)
          this.widgetData = leftData
        } else {
          this.widgetData = this.activeRoute.snapshot.data.pageData.data.menus
        }
      }
    })
  }

  ngOnInit() {
    this.defaultSideNavBarOpenedSubscription = this.isLtMedium$.subscribe(isLtMedium => {
      this.sideNavBarOpened = !isLtMedium
      this.screenSizeIsLtMedium = isLtMedium
    })
    const url = this.router.url.split('/')
    this.role = url[url.length - 2]
    this.role = this.role.replaceAll('%20', ' ')
  }

  ngOnDestroy() {
    if (this.defaultSideNavBarOpenedSubscription) {
      this.defaultSideNavBarOpenedSubscription.unsubscribe()
    }
  }

  bindUrl(path: string) {
    if (path) {
      this.currentRoute = path
    }
  }
}
