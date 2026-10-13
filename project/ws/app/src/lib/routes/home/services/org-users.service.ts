import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'

const API_END_POINTS = {
  SEARCH_USERS: '/apis/proxies/v8/user/v1/search',
}

/**
 * Searches users within an organisation.
 *
 * Extracted from the deleted Users feature's service, which self-assessment depended on for
 * this one call. Only the method still in use was carried over rather than restoring all 19.
 */
@Injectable({
  providedIn: 'root',
})
export class OrgUsersService {

  constructor(private readonly http: HttpClient) { }

  /** Returns every user under the given root organisation. */
  getAllKongUsers(rootOrgId: string): Observable<any> {
    const reqBody = {
      request: {
        filters: {
          rootOrgId,
        },
      },
    }
    return this.http.post<any>(API_END_POINTS.SEARCH_USERS, reqBody)
  }
}
