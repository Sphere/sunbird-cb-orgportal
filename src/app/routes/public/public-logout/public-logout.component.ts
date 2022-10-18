import { Component, OnInit, OnDestroy } from '@angular/core'
import { AuthKeycloakService, ConfigurationsService, NsPage } from '@sunbird-cb/utils'
import { Subscription } from 'rxjs'
// import { ActivatedRoute } from '@angular/router'

@Component({
  selector: 'ws-public-logout',
  templateUrl: './public-logout.component.html',
  styleUrls: ['./public-logout.component.scss'],
})
export class PublicLogoutComponent implements OnInit, OnDestroy {
  contactUsMail = ''
  contactPage: any
  platform = 'Learner'
  panelOpenState = false
  pageNavbar: Partial<NsPage.INavBackground> = this.configSvc.pageNavBar
  private subscriptionContact: Subscription | null = null

  constructor(
    private configSvc: ConfigurationsService,
    // private activateRoute: ActivatedRoute,
    private authSvc: AuthKeycloakService,
  ) { }

  ngOnInit() {
    // this.subscriptionContact = this.activateRoute.data.subscribe(data => {
    //   this.contactPage = data.pageData.data
    // })
    // if (this.configSvc.instanceConfig) {
    //   this.contactUsMail = this.configSvc.instanceConfig.mailIds.contactUs
    // }

    window.onbeforeunload = function (_e) {
      deleteAllCookies()
    }
    this.authSvc.logout().then(() => { })
  }

  ngOnDestroy() {

    if (this.subscriptionContact) {
      this.subscriptionContact.unsubscribe()
    }
  }
  login() {
    const host = window.location.origin
    window.location.href = `${host}/protected/v8/resource`
    // window.location.reload()
  }

}

function deleteAllCookies() {
  const cookies = document.cookie.split(';')

  // tslint:disable
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i]
    const eqPos = cookie.indexOf('=')
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
    // tslint:disable-next-line: prefer-array-literal
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT'
  }
}

