import { Component, OnInit, OnDestroy } from '@angular/core'
import { Subscription } from 'rxjs'

@Component({
  standalone: false,
  selector: 'ws-public-logout',
  templateUrl: './public-logout.component.html',
  styleUrls: ['./public-logout.component.scss'],
})
export class PublicLogoutComponent implements OnInit, OnDestroy {
  contactUsMail = ''
  contactPage: any
  platform = 'Learner'
  panelOpenState = false
  private readonly subscriptionContact: Subscription | null = null
  http: any
  redirectUrl: string | undefined

  constructor() { }

  ngOnInit() {
    new Promise<void | Promise<void>>(resolve => {
      resolve(this.deleteAllCookies())
    }).catch(() => { })
  }

  ngOnDestroy() {
    if (this.subscriptionContact) {
      this.subscriptionContact.unsubscribe()
    }
  }

  login() {
    const host = window.location.origin
    window.location.href = `${host}/protected/v8/resource`
  }

  async deleteAllCookies() {
    const cookies = document.cookie.split(';')
    // tslint:disable
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i]
      const eqPos = cookie.indexOf('=')
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }

    this.redirectUrl = document.baseURI + 'openid/keycloak'
    const url = `${document.baseURI}public/home`
    const Keycloakurl = `${document.baseURI}auth/realms/sunbird/protocol/openid-connect/logout?redirect_uri=${encodeURIComponent(url)}`
    console.log("Keycloak url >>>>>>>>>>>." + Keycloakurl)
    window.location.href = Keycloakurl
    await this.http.get('/apis/proxies/v8/logout/user').toPromise()
  }
}

