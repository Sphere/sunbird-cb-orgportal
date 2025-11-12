import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Observable } from 'rxjs'
const API_END_POINTS = {
  UPDATE_ENTITY: '/apis/proxies/v8/api/entity/v1/update',
  UPLOAD_ENTITY: '/apis/proxies/v8/api/entity/v1/upload',
  SEARCH_ENTITY: '/apis/proxies/v8/entity/v1/search',
}

@Injectable({ providedIn: 'root' })
export class FracApiService {
  private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });


  constructor(private http: HttpClient) { }

  /** ✅ Update entity API */
  updateEntity(payload: any): Observable<any> {
    return this.http.post(API_END_POINTS.UPDATE_ENTITY, payload, { headers: this.headers })
  }

  /** ✅ Upload file API */
  uploadFile(file: File): Observable<any> {
    const formData = new FormData()
    formData.append('file', file)
    return this.http.post(API_END_POINTS.UPLOAD_ENTITY, formData, { withCredentials: true })
  }

  searchEntities(type: string, keyword: string, language?: string): Observable<any> {
    const body = {
      request: {
        frac: {
          type,
          keyword: keyword.trim(),
          ...(language ? { language: language.toLowerCase() } : {})
        }
      }
    }
    return this.http.post(API_END_POINTS.SEARCH_ENTITY, body)
  }
}
