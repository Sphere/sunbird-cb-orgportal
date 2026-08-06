import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'

const PROTECTED_SLAG_V8 = '/apis/protected/v8'

/**
 * The report HTML is a single self-contained object in a private S3 bucket, overwritten
 * daily by the client at a fixed key. The backend streams it from a stable URL so that
 * ETag/304 revalidation works — the multi-megabyte body only transfers on days the
 * content actually changed.
 */
const API_END_POINTS = {
  REPORT_META: `${PROTECTED_SLAG_V8}/report/mnc-attendance/meta`,
  REPORT_CONTENT: `${PROTECTED_SLAG_V8}/report/mnc-attendance`,
}

export interface IReportMeta {
  /** ISO-8601 timestamp of the last S3 upload. */
  lastModified: string
  etag: string
  sizeBytes: number
}

@Injectable({
  providedIn: 'root',
})
export class ReportViewerService {

  constructor(private http: HttpClient) { }

  /**
   * Cheap HeadObject-backed probe. Called before the iframe is pointed at the content URL
   * so that authorization failures surface as a handled error state — an iframe cannot
   * report an HTTP status, it would simply render the error body.
   */
  getReportMeta(): Observable<IReportMeta> {
    return this.http.get<IReportMeta>(API_END_POINTS.REPORT_META)
  }

  /** Stable same-origin URL bound to the iframe once `getReportMeta` succeeds. */
  getReportContentUrl(): string {
    return API_END_POINTS.REPORT_CONTENT
  }
}
