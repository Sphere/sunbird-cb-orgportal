import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class FracUploadService {
  private readonly baseUrl = 'https://aastrika-stage.tarento.com/api/v1/frac/entity/upload';

  constructor(private http: HttpClient) { }

  uploadFile(file: File): Observable<any> {
    const formData = new FormData()
    formData.append('file', file)
    return this.http.post(this.baseUrl, formData, { withCredentials: true })
  }
}