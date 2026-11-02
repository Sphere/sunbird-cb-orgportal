import { Injectable } from '@angular/core'
import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import {
  IFormApiResponse,
  IFormListApiItem,
  IFormListApiResponse,
  IFormReadRequest,
  IFormSummary,
  IFormUpdateRequest,
} from '../models/form.model'

const API_END_POINTS = {
  READ_FORM: '/apis/v1/form/read',
  LIST_FORMS: '/apis/v1/form/list',
  FETCH_ALL_FORMS: '/apis/v1/form/fetchAll',
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

/** Keeps only a form's identifying keys — drops the (large) `data` string. */
function toFormSummary(item: IFormListApiItem): IFormSummary {
  return {
    type: item.type,
    subtype: item.subtype,
    action: item.action,
    component: item.component,
    framework: item.framework,
    rootOrgId: item.root_org,
    created_on: item.created_on ?? null,
    last_modified_on: item.last_modified_on ?? null,
  }
}

@Injectable({ providedIn: 'root' })
export class FormApiService {
  constructor(private readonly http: HttpClient) { }

  /**
   * Fetches a form layout config. Appends a cache-busting `v` query param,
   * matching the existing form-service call's `?v=${Date.now()}` pattern.
   * `subtype` falls back to the stored `'*'`; `framework` must match exactly.
   */
  readForm(request: IFormReadRequest): Observable<IFormApiResponse> {
    const url = `${API_END_POINTS.READ_FORM}?v=${Date.now()}`
    return this.http.post<IFormApiResponse>(url, { request })
  }

  /**
   * Lists forms for one org (`rootOrgId`), or — with no org — the public
   * forms (`root_org: '*'`). An org with no forms returns an empty list, so
   * this (not `read`, which errors on a missing form) is the reliable
   * "does this form exist?" check.
   */
  listForms(rootOrgId?: string): Observable<IFormSummary[]> {
    const url = `${API_END_POINTS.LIST_FORMS}?v=${Date.now()}`
    const body = rootOrgId ? { request: { rootOrgId } } : {}
    return this.http.post<IFormListApiResponse>(url, body).pipe(
      map(response => (response?.result?.forms || []).map(toFormSummary)),
    )
  }

  /** Every stored form across all orgs (~2 MB response — only fetched on demand). */
  fetchAllForms(): Observable<IFormSummary[]> {
    const url = `${API_END_POINTS.FETCH_ALL_FORMS}?v=${Date.now()}`
    return this.http.post<IFormListApiResponse>(url, {}).pipe(
      map(response => (response?.result?.forms || []).map(toFormSummary)),
    )
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
   * Fetches the org list for the org pickers (Browse + New Form).
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

/**
 * Best-effort readable message from a form-service / proxy error. The
 * form-service's `params.errmsg` is sometimes a string and sometimes an
 * object (`{ message, stack }`, e.g. a failed read of a missing form).
 */
export function formApiErrorMessage(err: HttpErrorResponse, fallback: string): string {
  if (err?.status === 401 || err?.status === 403) {
    return 'Your session has expired or you are not authorised. Please log in again.'
  }
  const errmsg = err?.error?.params?.errmsg
  if (typeof errmsg === 'string' && errmsg) {
    return errmsg
  }
  if (errmsg && typeof errmsg.message === 'string') {
    return errmsg.message
  }
  return fallback
}
