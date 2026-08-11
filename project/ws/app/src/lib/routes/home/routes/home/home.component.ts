import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, HostListener, ViewChild } from '@angular/core'
import { Router, Event, NavigationEnd, ActivatedRoute } from '@angular/router'
import { ConfigurationsService, ValueService } from '@sunbird-cb/utils'
import { map } from 'rxjs/operators'
import { NsWidgetResolver } from '@sunbird-cb/resolver'
import { MenuConfigService } from '../../services/menu-config.service'
/* tslint:disable */
import _ from 'lodash'
import { ILeftMenu } from '@sunbird-cb/collection'
/* tslint:enable */

@Component({
  selector: 'ws-app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  /* tslint:disable */
  host: { class: 'margin-top-l' },
  /* tslint:enable */
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  sideNavBarOpened = true
  panelOpenState = false
  titles = [{ title: 'NETWORK', url: '/app/network-v2', icon: 'group' }]
  widgetData!: NsWidgetResolver.IWidgetData<ILeftMenu>
  unread = 0
  myRoles!: Set<string>
  currentRoute = 'home'
  banner!: NsWidgetResolver.IWidgetData<any>
  private bannerSubscription: any
  public screenSizeIsLtMedium = false
  isLtMedium$ = this.valueSvc.isLtMedium$
  mode$ = this.isLtMedium$.pipe(map(isMedium => (isMedium ? 'over' : 'side')))
  userRouteName = ''
  @ViewChild('stickyMenu', { static: true }) menuElement!: ElementRef
  elementPosition: any
  sticky = false
  private defaultSideNavBarOpenedSubscription: any
  department: any = {}
  departmentName = ''

  @HostListener('window:scroll', ['$event'])
  handleScroll() {
    const windowScroll = window.pageYOffset
    if (windowScroll >= this.elementPosition) {
      this.sticky = true
    } else {
      this.sticky = false
    }
  }
  constructor(
    private readonly valueSvc: ValueService,
    private readonly router: Router,
    private readonly activeRoute: ActivatedRoute,
    private readonly configService: ConfigurationsService,
    private readonly menuConfig: MenuConfigService
  ) {
    if (_.get(this.activeRoute, 'snapshot.data.configService.userRoles')) {
      this.myRoles = _.get(this.activeRoute, 'snapshot.data.configService.userRoles')
    }

    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        this.bindUrl(event.urlAfterRedirects.replace('/app/home/', ''))

        const fullProfile = _.get(this.activeRoute.snapshot, 'data.configService')
        this.department = fullProfile?.unMappedUser?.rootOrgId
        this.departmentName = fullProfile ? fullProfile.unMappedUser.channel : ''

        if (fullProfile) {
          let leftData = _.get(this.activeRoute.snapshot, 'data.pageData.data.menus', [])
          // Ensure leftData.widgetData exists before filtering
          if (leftData.widgetData && Array.isArray(leftData.widgetData.menus)) {
            // Merge locally-configured menus (not yet in the page API) with the API menus
            leftData.widgetData.menus = this.menuConfig.mergeMenus(leftData.widgetData.menus)
            console.log('After merge:', leftData.widgetData.menus.map((m: any) => ({ name: m.name, key: m.key, routerLink: m.routerLink })))
            // Filter menus based on user roles
            leftData.widgetData.menus = leftData.widgetData.menus.filter((menu: { requiredRoles: any[] }) => {
              if (this.myRoles.has('certificate_manager')) {
                return menu.requiredRoles.includes('certificate_manager') // Keep only certificate_manager menus
              }
              return true // Keep all menus if the role is NOT "certificate_manager"
            })
          }
          // Modify widgetData
          _.set(leftData, 'widgetData.logo', true)
          _.set(leftData, 'widgetData.name', this.departmentName)
          _.set(leftData, 'widgetData.userRoles', this.myRoles)

          this.widgetData = leftData
        } else {
          this.widgetData = _.get(this.activeRoute.snapshot, 'data.pageData.data.menus', [])
        }

        if (this.configService.userProfile && this.configService.userProfile.departmentName) {
          this.configService.userProfile.departmentName = this.departmentName || 'Not Available'
        }
      }
    })

  }
  ngOnInit() {
    this.defaultSideNavBarOpenedSubscription = this.isLtMedium$.subscribe(isLtMedium => {
      this.sideNavBarOpened = !isLtMedium
      this.screenSizeIsLtMedium = isLtMedium
    })
  }
  ngAfterViewInit() {
    // this.elementPosition = this.menuElement.nativeElement.offsetTop
  }
  bindUrl(path: string) {
    if (path) {
      this.currentRoute = path
    }
  }

  ngOnDestroy() {
    if (this.defaultSideNavBarOpenedSubscription) {
      this.defaultSideNavBarOpenedSubscription.unsubscribe()
    }
    if (this.bannerSubscription) {
      this.bannerSubscription.unsubscribe()
    }
  }

}
