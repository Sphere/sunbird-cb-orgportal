import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { ConfigurationsService } from '@sunbird-cb/utils'
import {
  FracEntityType,
  FracMapEntityRequest,
  FracMapEntityResponse,
  FracMappingSearchRequest,
  FracMappingSearchResponse,
  FracSearchRequest,
  FracSearchResponse,
  FracUpdateEntityPayload,
  FracUpdateEntityResponse,
  FracUploadApiResponse,
} from '../models/frac-api.models'
import { resolveFracClientConfig } from '../utils/frac-client-config.util'


@Injectable({ providedIn: 'root' })
export class FracApiService {
  private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' })

  constructor(
    private http: HttpClient,
    private configSvc: ConfigurationsService,
  ) { }

  private get apiEndpoints() {
    return resolveFracClientConfig(this.configSvc?.instanceConfig).api.endpoints
  }

  /**
   * Updates one FRAC entity record.
   */
  updateEntity(payload: FracUpdateEntityPayload, userId?: string): Observable<FracUpdateEntityResponse> {
    const params = new HttpParams().set('userId', userId || this.getLoggedInUserIdentifier())
    return this.http.put<FracUpdateEntityResponse>(this.apiEndpoints.updateEntity, payload, { headers: this.headers, params })
  }

  /**
   * Saves mapping between parent and child entities.
   */
  mapEntity(payload: FracMapEntityRequest): Observable<FracMapEntityResponse> {
    return this.http.post<FracMapEntityResponse>(this.apiEndpoints.mapEntity, payload, { headers: this.headers })
  }

  /**
   * Searches saved mapping by entity type + code + language.
   */
  searchEntityMapping(entityType: FracEntityType | string, entityCode: string, language: string = 'English'): Observable<FracMappingSearchResponse> {
    const body: FracMappingSearchRequest = {
      entityType: this.mapEntityType(entityType),
      entityCode: (entityCode || '').trim(),
      entityLanguage: this.mapLanguageToCode(language),
    }

    return this.http.post<FracMappingSearchResponse>(this.apiEndpoints.searchMapping, body, { headers: this.headers })
  }

  /**
   * Uploads FRAC sheet and parses text responses into JSON when possible.
   */
  uploadFile(file: File, language: string = 'English'): Observable<FracUploadApiResponse> {
    const formData = new FormData()
    formData.append('entitySheet', file)

    const params = new HttpParams()
      .set('language', this.mapLanguageToCode(language))
      .set('userId', this.getLoggedInUserIdentifier())

    return this.http.post(this.apiEndpoints.uploadEntity, formData, {
      params,
      observe: 'response',
      responseType: 'text',
    }).pipe(
      map((response) => {
        const responseBody = response?.body
        if (typeof responseBody !== 'string') {
          return (responseBody ?? '') as FracUploadApiResponse
        }

        try {
          return JSON.parse(responseBody) as FracUploadApiResponse
        } catch {
          return responseBody as FracUploadApiResponse
        }
      }),
    )
  }

  private mapLanguageToCode(language: string): string {
    const lang = (language || '').trim().toLowerCase()
    const languageMap: Record<string, string> = {
      english: 'en',
      hindi: 'hi',
      kannada: 'kn',
      tamil: 'ta',
    }

    return languageMap[lang] || ''
  }

  private getLoggedInUserIdentifier(): string {
    const userProfile = (this.configSvc?.userProfile || {}) as Record<string, unknown>
    return (userProfile.userName as string) || (userProfile.userId as string) || (userProfile.wid as string) || 'unknown-user'
  }

  /**
   * Searches FRAC entities by type and keyword.
   */
  searchEntities(type: FracEntityType | string, keyword: string = '', language: string = 'English'): Observable<FracSearchResponse> {
    const query = keyword.trim()
    const body: FracSearchRequest = {
      entityType: this.mapEntityType(type),
      language: this.mapLanguageToCode(language),
      query,
      strict: 'false',
      field: ['code', 'name'],
    }

    return this.http.post<FracSearchResponse>(this.apiEndpoints.searchEntity, body, { headers: this.headers })
  }

  private mapEntityType(type: FracEntityType | string): string {
    const normalized = (type || '').trim().toLowerCase()
    const typeMap: Record<string, string> = {
      competency: 'Competency',
      activity: 'Activity',
      role: 'Role',
      position: 'Position',
    }

    return typeMap[normalized] || 'Competency'
  }
}
