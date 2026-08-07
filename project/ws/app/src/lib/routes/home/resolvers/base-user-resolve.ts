import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router'
import { Observable, of } from 'rxjs'
import { map, catchError } from 'rxjs/operators'
import { ConfigurationsService, IResolveResponse } from '@sunbird-cb/utils'
import { NSProfileDataV2 } from '../models/profile-v2.model'

export interface IUserByIdService {
  getUserById(userid: string): Observable<any>
}

export abstract class BaseUserResolve implements Resolve<IResolveResponse<NSProfileDataV2.IProfile>> {
  protected abstract readonly usersSvc: IUserByIdService
  constructor(protected readonly configSvc: ConfigurationsService) { }

  resolve(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<IResolveResponse<NSProfileDataV2.IProfile>> {
    const path = _route.routeConfig && _route.routeConfig.path
    let userId = ''
    if (path !== 'me') {
      userId = _route.params.userId
      if (!userId) {
        userId = _route.queryParams.userId
      }
      if (!userId) {
        userId = this.configSvc.userProfile && this.configSvc.userProfile.userId || ''
      }
    } else {
      userId = this.configSvc.userProfile && this.configSvc.userProfile.userId || ''
    }
    return this.usersSvc.getUserById(userId).pipe(
      map(data => ({ data, error: null })),
      catchError(error => of({ error, data: null })),
    )
  }
}
