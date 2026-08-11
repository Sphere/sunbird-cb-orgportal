import { Component, OnDestroy, OnInit } from '@angular/core'
import { SafeUrl } from '@angular/platform-browser'
import { ActivatedRoute } from '@angular/router'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { Subscription } from 'rxjs'
import { SanitizerService } from '../../services/sanitizer.service'
import { ILoginDescriptiveFooterConfig, IWSPublicLoginConfig } from './login.model'

@Component({
  standalone: false,
  selector: 'ws-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  objectKeys = Object.keys
  productLogo = ''
  contactUs = false
  productLogoWidth: string | undefined = ''
  showIconBackground = false
  developedBy = ''
  appIcon: SafeUrl | null = null
  isClientLogin = false
  loginConfig: IWSPublicLoginConfig | null = null
  welcomeFooter: ILoginDescriptiveFooterConfig | null = null
  title = ''
  subTitle = ''
  private subscriptionLogin: Subscription | null = null

  constructor(
    private readonly activateRoute: ActivatedRoute,
    private readonly configSvc: ConfigurationsService,
    private readonly sanitizerSvc: SanitizerService,
  ) {
    const instanceConfig = this.configSvc.instanceConfig
    if (instanceConfig) {
      this.appIcon = this.sanitizerSvc.trustResourceUrl(
        instanceConfig.logos.appTransparent,
      )
      this.productLogo = instanceConfig.logos.company
      this.developedBy = instanceConfig.logos.developedBy
    }
  }

  ngOnInit() {
    this.subscriptionLogin = this.activateRoute.data.subscribe(data => {
      this.loginConfig = data.pageData.data
      this.isClientLogin = data.pageData.data.isClient
      this.welcomeFooter = data.pageData.data.footer.descriptiveFooter
      this.title = data.pageData.data.topbar.title
      this.subTitle = data.pageData.data.topbar.subTitle
      this.contactUs = data.pageData.data.footer.contactUs
    })
  }

  ngOnDestroy() {
    if (this.subscriptionLogin) {
      this.subscriptionLogin.unsubscribe()
    }
  }
}
