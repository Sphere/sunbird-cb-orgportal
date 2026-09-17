import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { IFormApiResponse, IFormReadRequest, IFormUpdateRequest } from '../models/form.model'

const API_END_POINTS = {
  READ_FORM: '/apis/v1/form/read',
  UPDATE_FORM: '/apis/proxies/v8/ext-forms/v1/form/create',
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
}
