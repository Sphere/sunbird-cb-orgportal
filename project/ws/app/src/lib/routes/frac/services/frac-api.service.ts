import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { ConfigurationsService } from '@sunbird-cb/utils'

const API_END_POINTS = {
  UPDATE_ENTITY: '/apis/proxies/v8/entity/v1/update',
  UPLOAD_ENTITY: '/apis/proxies/v8/entity/v1/upload',
  SEARCH_ENTITY: '/apis/proxies/v8/entity/v1/search',
  MAP_ENTITY: '/apis/proxies/v8/entity/v1/mapping',
  SEARCH_MAPPING: '/apis/proxies/v8/entity/v1/mapping/search',
}


@Injectable({ providedIn: 'root' })
export class FracApiService {
  private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  // private httpClientNoInterceptors: HttpClient

  constructor(
    private http: HttpClient,
    private configSvc: ConfigurationsService,
  ) {
    // Create HttpClient without interceptors for direct API calls
    // this.httpClientNoInterceptors = new HttpClient(httpBackend)
  }

  /** ✅ Update entity API */
  updateEntity(payload: any, userId?: string): Observable<any> {
    const params = new HttpParams().set('userId', userId || this.getLoggedInUserIdentifier())
    return this.http.put(API_END_POINTS.UPDATE_ENTITY, payload, { headers: this.headers, params })
  }

  /** ✅ Entity mapping API */
  mapEntity(payload: any): Observable<any> {
    return this.http.post(API_END_POINTS.MAP_ENTITY, payload, { headers: this.headers })
  }

  /** ✅ Mapping search API */
  searchEntityMapping(entityType: string, entityCode: string, language: string = 'English'): Observable<any> {
    const body = {
      entityType: this.mapEntityType(entityType),
      entityCode: (entityCode || '').trim(),
      entityLanguage: this.mapLanguageToCode(language),
    }

    return this.http.post(API_END_POINTS.SEARCH_MAPPING, body, { headers: this.headers })
  }

  /** ✅ Upload file API */
  uploadFile(file: File, language: string = 'English'): Observable<any> {
    console.log('📤 FracApiService.uploadFile called with:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      lastModified: new Date(file.lastModified),
      language,
    })

    const formData = new FormData()
    formData.append('entitySheet', file)

    const params = new HttpParams()
      .set('language', this.mapLanguageToCode(language))
      .set('userId', this.getLoggedInUserIdentifier())

    console.log('📦 FormData created with entries:')
    formData.forEach((value, key) => {
      console.log(`  ${key}:`, value)
    })

    // ✅ Use responseType 'text' and parse explicitly to avoid losing API error payload shape.
    return this.http.post(API_END_POINTS.UPLOAD_ENTITY, formData, {
      params,
      observe: 'response',
      responseType: 'text',
    }).pipe(
      map((response: any) => {
        const responseBody = response?.body
        if (typeof responseBody !== 'string') {
          return responseBody ?? response
        }

        try {
          return JSON.parse(responseBody)
        } catch {
          return responseBody
        }
      })
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
    const userProfile: any = this.configSvc?.userProfile || {}
    return userProfile.userName || userProfile.userId || userProfile.wid || 'unknown-user'
  }

  searchEntities(type: string, keyword: string = '', language: string = 'English'): Observable<any> {
    const query = keyword.trim()
    const body = {
      entityType: this.mapEntityType(type),
      language: this.mapLanguageToCode(language),
      query,
      strict: 'false',
      field: ['code', 'name'],
    }

    return this.http.post(API_END_POINTS.SEARCH_ENTITY, body)
  }

  private mapEntityType(type: string): string {
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
