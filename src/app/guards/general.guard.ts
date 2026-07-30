import { Injectable } from '@angular/core'
import {
  ActivatedRouteSnapshot, Router, RouterStateSnapshot,
  UrlTree
} from '@angular/router'
import { ConfigurationsService, AuthKeycloakService } from '@sunbird-cb/utils'
import _ from 'lodash'
@Injectable({
  providedIn: 'root',
})
export class GeneralGuard {
  constructor(
    private router: Router,
    private configSvc: ConfigurationsService,
    private authSvc: AuthKeycloakService,
  ) { }

  async canActivate(
    next: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Promise<boolean | UrlTree> {
    const requiredFeatures = (next.data && next.data.requiredFeatures) || []
    const requiredRoles = (next.data && next.data.requiredRoles) || []
    return await this.shouldAllow<boolean | UrlTree>(_state, requiredFeatures, requiredRoles)
  }

  hasRole(role: string[]): boolean {
    let returnValue = false
    role.forEach(v => {
      if ((this.configSvc.userRoles || new Set()).has((v || '').toLocaleLowerCase())) {
        returnValue = true
      }
    })
    return returnValue
  }
  private async shouldAllow<T>(
    state: RouterStateSnapshot,
    requiredFeatures: string[],
    requiredRoles: string[],
  ): Promise<T | UrlTree | boolean> {
    if (
      this.configSvc.userProfile === null &&
      this.configSvc.instanceConfig &&
      !Boolean(this.configSvc.instanceConfig.disablePidCheck)
    ) {
      return this.router.parseUrl('/app/invalid-user')
    }
    /**
     * Test IF User Tnc Is Accepted
     */
    if (!this.configSvc.hasAcceptedTnc) {
      if (
        state.url &&
        !state.url.includes('/app/setup/') &&
        !state.url.includes('/app/tnc') &&
        !state.url.includes('/')
      ) {
        this.configSvc.userUrl = state.url
      }
    }
    if (_.get(this.configSvc, 'unMappedUser.isDeleted')) {
      this.router.navigateByUrl('/error-access-forbidden')
      this.authSvc.logout()
      return false
    }

    /**
     * Test IF User has requried role to access the page
     */
    if (requiredRoles && requiredRoles.length && this.configSvc.userRoles) {
      const requiredRolePreset = requiredRoles.some(item =>
        (this.configSvc.userRoles || new Set()).has(item),
      )

      if (!requiredRolePreset) {
        return this.router.parseUrl('/page/home')
      }
    }

    // check if feature is restricted
    if (requiredFeatures && requiredFeatures.length && this.configSvc.restrictedFeatures) {
      const requiredFeaturesMissing = requiredFeatures.some(item =>
        (this.configSvc.restrictedFeatures || new Set()).has(item),
      )

      if (requiredFeaturesMissing) {
        return this.router.parseUrl('/app/home')
      }
    }

    return true
  }
}
