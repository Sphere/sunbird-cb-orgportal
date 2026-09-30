import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { IFormApiResponse, IFormReadRequest, IFormUpdateRequest } from '../models/form.model'

const API_END_POINTS = {
  READ_FORM: '/apis/v1/form/read',
  UPDATE_FORM: '/apis/proxies/v8/ext-forms/v1/form/create',
  SEARCH_ORGS: '/apis/proxies/v8/org/v1/search',
}

interface OrgApiItem {
  id: string
  orgName?: string
  channel?: string
}

interface OrgSearchApiResponse {
  result: { response: { content: OrgApiItem[] } }
}

@Injectable({ providedIn: 'root' })
export class FormApiService {
  constructor(private readonly http: HttpClient) { }

  /**
   * Fetches a form layout config. Appends a cache-busting `v` query param,
   * matching the existing form-service call's `?v=${Date.now()}` pattern.
   */
  readForm(request: IFormReadRequest): Observable<IFormApiResponse> {
    const url = `${API_END_POINTS.READ_FORM}?v=${Date.now()}`
    return this.http.post<IFormApiResponse>(url, { request })
  }

  /**
   * Pushes the edited form layout back to the form-service. `request` is the
   * same object shape returned by readForm()'s `result.form` (type, subtype,
   * action, component, framework, rootOrgId, data) with `data` edited —
   * confirmed against the real create curl. Auth/org/rootOrg/wid headers are
   * attached by the app-wide HTTP interceptors, not set here.
   */
  updateForm(request: IFormUpdateRequest): Observable<IFormApiResponse> {
    return this.http.post<IFormApiResponse>(API_END_POINTS.UPDATE_FORM, { request })
  }

  /**
   * Fetches the org list for the Root Org Id dropdown (Private access).
   * Mirrors Playlist's `PlaylistApiService.searchOrganizations()` contract
   * exactly (same endpoint, payload, and response shape) — a single upfront
   * fetch of (effectively) all orgs, not paginated/search-as-you-type against
   * the backend; org/rootOrg/wid headers come from the app's HTTP
   * interceptors, same as the other calls in this service.
   */
  searchOrganizations(): Observable<{ value: string, label: string }[]> {
    const payload = {
      request: {
        filters: {},
        fields: [],
        sortBy: { createdDate: 'Desc' },
        limit: 9999,
      },
    }

    return this.http.post<OrgSearchApiResponse>(API_END_POINTS.SEARCH_ORGS, payload).pipe(
      map(response => {
        const organizations: OrgApiItem[] = response?.result?.response?.content || []
        return organizations.map(org => ({
          value: String(org.id),
          label: org.orgName || org.channel || 'Unknown Organization',
        }))
      }),
    )
  }
}
