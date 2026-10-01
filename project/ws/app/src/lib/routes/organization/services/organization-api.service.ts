import { Injectable } from '@angular/core'
import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import {
  IOrganization,
  IOrgApiResponse,
  IOrgCreateRequest,
  IOrgSearchResponse,
  IOrgUpdateRequest,
} from '../models/organization.model'

const API_END_POINTS = {
  SEARCH_ORGS: '/apis/proxies/v8/org/v1/search',
  CREATE_ORG: '/apis/proxies/v8/org/v1/create',
  // Update / status-update follow the standard Sunbird org API — not yet confirmed against a real curl.
  UPDATE_ORG: '/apis/proxies/v8/org/v1/update',
  UPDATE_ORG_STATUS: '/apis/proxies/v8/org/v1/status/update',
}

/**
 * CRUD calls for the Organization page. org/rootOrg/wid headers come from the
 * app-wide HTTP interceptors, same as FormApiService.
 */
@Injectable({ providedIn: 'root' })
export class OrganizationApiService {
  constructor(private readonly http: HttpClient) { }

  /** Single upfront fetch of (effectively) all orgs, newest first — same payload as FormApiService. */
  searchOrganizations(): Observable<IOrganization[]> {
    const payload = {
      request: {
        filters: {},
        fields: [],
        sortBy: { createdDate: 'Desc' },
        limit: 9999,
      },
    }
    return this.http.post<IOrgSearchResponse>(API_END_POINTS.SEARCH_ORGS, payload).pipe(
      map(response => response?.result?.response?.content || []),
    )
  }

  createOrganization(request: IOrgCreateRequest): Observable<IOrgApiResponse> {
    return this.http.post<IOrgApiResponse>(API_END_POINTS.CREATE_ORG, { request })
  }

  updateOrganization(request: IOrgUpdateRequest): Observable<IOrgApiResponse> {
    return this.http.patch<IOrgApiResponse>(API_END_POINTS.UPDATE_ORG, { request })
  }

  /** Soft delete (status 0) or reactivate (status 1). */
  updateOrganizationStatus(organisationId: string, status: number): Observable<IOrgApiResponse> {
    return this.http.patch<IOrgApiResponse>(API_END_POINTS.UPDATE_ORG_STATUS, { request: { organisationId, status } })
  }
}

/** Best-effort readable message from a Sunbird / proxy error response. */
export function orgApiErrorMessage(err: HttpErrorResponse, fallback: string): string {
  return err?.error?.params?.errmsg || err?.error?.message || fallback
}
