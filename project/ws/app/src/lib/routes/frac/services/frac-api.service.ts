import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Observable } from 'rxjs'

const API_END_POINTS = {
  UPDATE_ENTITY: '/apis/proxies/v8/entity/v1/update',
  UPLOAD_ENTITY: '/apis/proxies/v8/entity/v1/upload',
  SEARCH_ENTITY: '/apis/proxies/v8/entity/v1/search',
}


@Injectable({ providedIn: 'root' })
export class FracApiService {
  private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  // private httpClientNoInterceptors: HttpClient

  constructor(private http: HttpClient) {
    // Create HttpClient without interceptors for direct API calls
    // this.httpClientNoInterceptors = new HttpClient(httpBackend)
  }

  /** ✅ Update entity API */
  updateEntity(payload: any): Observable<any> {
    return this.http.post(API_END_POINTS.UPDATE_ENTITY, payload, { headers: this.headers })
  }

  /** ✅ Upload file API */
  uploadFile(file: File): Observable<any> {
    console.log('📤 FracApiService.uploadFile called with:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      lastModified: new Date(file.lastModified)
    })

    const formData = new FormData()
    formData.append('file', file)

    console.log('📦 FormData created with entries:')
    formData.forEach((value, key) => {
      console.log(`  ${key}:`, value)
    })

    // ✅ FIX: Don't set any headers - let interceptor add required auth headers
    // and let browser set proper multipart/form-data boundary
    return this.http.post(API_END_POINTS.UPLOAD_ENTITY, formData)
  }


  searchEntities(type: string, keyword: string, _language?: string): Observable<any> {
    const body = {
      request: {
        entity: {
          type,
          query: {
            code: keyword.trim()
          },
          limit: 5
          // keyword: keyword.trim(),
          // ...(language ? { language: language.toLowerCase() } : {})
        }
      }
    }
    return this.http.post(API_END_POINTS.SEARCH_ENTITY, body)
  }
}
