import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, HostListener, ViewChild } from '@angular/core'
import { Router, Event, NavigationEnd, ActivatedRoute } from '@angular/router'
import { ConfigurationsService, ValueService } from '@sunbird-cb/utils'
import { map } from 'rxjs/operators'
import { NsWidgetResolver } from '@sunbird-cb/resolver'
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
    private valueSvc: ValueService,
    private router: Router,
    private activeRoute: ActivatedRoute,
    private configService: ConfigurationsService
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
          console.log('Original Menu Data:', leftData)
          // Ensure leftData.widgetData exists before filtering
          if (leftData.widgetData && Array.isArray(leftData.widgetData.menus)) {
            // Only keep menus that contain "certificate_manager" in requiredRoles
            // Insert the new menu object
            // this.insertFracMenuIfNotExists(leftData.widgetData.menus)
            leftData.widgetData.menus = leftData.widgetData.menus.filter((menu: { requiredRoles: any[] }) => {
              console.log('Menu Roles:', menu.requiredRoles, this.myRoles)
              if (this.myRoles.has('certificate_manager')) {
                return menu.requiredRoles.includes('certificate_manager') // Keep only certificate_manager menus
              }
              return true // Keep all menus if the role is NOT "certificate_manager"
            })
          }
          console.log('Filtered Menu Data:', leftData)
          // Modify widgetData
          _.set(leftData, 'widgetData.logo', true)
          _.set(leftData, 'widgetData.name', this.departmentName)
          _.set(leftData, 'widgetData.userRoles', this.myRoles)

          this.widgetData = leftData
          console.log('Modified Menu Data:', this.widgetData)
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
  /**
   * Inserts a Frac menu item into the provided menus array if it doesn't already exist.
   *
   * @description This method checks if a menu item with the key 'Frac' exists in the menus array.
   * If not found, it creates and appends a new Frac menu configuration with predefined properties
   * including router link, required roles, and badge settings.
   *
   * @param menus - The array of menu items to check and potentially modify
   * @returns void
   * @private
   */
  // private insertFracMenuIfNotExists(menus: any[]): void {
  //   const fracMenuExists = menus.some(menu => menu.key === 'Frac')
  //   if (!fracMenuExists) {
  //     const fracMenu = {
  //       name: 'Frac',
  //       key: 'Frac',
  //       fragment: false,
  //       render: true,
  //       badges: {
  //         enabled: false,
  //         uri: ''
  //       },
  //       enabled: true,
  //       routerLink: '/app/home/frac/dashboard',
  //       requiredRoles: ['admin', 'mdo_admin', "FRAC_ADMIN"]
  //     }

  //     menus.push(fracMenu)
  //   }
  // }

}
