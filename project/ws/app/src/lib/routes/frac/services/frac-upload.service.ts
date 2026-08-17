import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { resolveFracClientConfig } from '../utils/frac-client-config.util'

@Injectable({ providedIn: 'root' })
export class FracUploadService {
  constructor(
    private readonly http: HttpClient,
    private readonly configSvc: ConfigurationsService,
  ) { }

  /**
   * Reads upload URL from instance config when available.
   * Falls back to existing legacy URL to avoid behavior change.
   */
  private get uploadUrl(): string {
    return resolveFracClientConfig(this.configSvc?.instanceConfig).api.uploadEntityUrl
  }

  uploadFile(file: File): Observable<unknown> {
    const formData = new FormData()
    formData.append('file', file)
    return this.http.post<unknown>(this.uploadUrl, formData, { withCredentials: true })
  }
}
