import { Injectable } from '@angular/core'
import { HttpClient, HttpResponse } from '@angular/common/http'
import { Observable, timer } from 'rxjs'
import { map, switchMap, takeWhile } from 'rxjs/operators'
import { FRAC_STUDIO_POLL_MS } from '../constants/frac-studio.constants'
import {
  Frac,
  FracBrief,
  FracDownload,
  FracJob,
  FracReviewContext,
  FracReviewDetail,
  FracReviewSummary,
  FracStartReviewResponse,
  FracSummary,
  FracVersion,
} from '../models/frac-studio.models'
import { filenameFromDisposition } from '../utils/frac-studio-download.util'

const FRAC_STUDIO_BASE = '/apis/protected/v8/fracStudio'

const API_END_POINTS = {
  FRACS: `${FRAC_STUDIO_BASE}/fracs`,
  FRAC: (id: string) => `${FRAC_STUDIO_BASE}/fracs/${encodeURIComponent(id)}`,
  FRAC_CHECK: (id: string) => `${FRAC_STUDIO_BASE}/fracs/${encodeURIComponent(id)}/steps/check`,
  FRAC_EXPORT: (id: string) => `${FRAC_STUDIO_BASE}/fracs/${encodeURIComponent(id)}/export.xlsx`,
  FRAC_VERSIONS: (id: string) => `${FRAC_STUDIO_BASE}/fracs/${encodeURIComponent(id)}/versions`,
  FRAC_RESTORE: (id: string, versionId: number) =>
    `${FRAC_STUDIO_BASE}/fracs/${encodeURIComponent(id)}/versions/${versionId}/restore`,
  REVIEWS: `${FRAC_STUDIO_BASE}/frac-reviews`,
  REVIEW: (id: string) => `${FRAC_STUDIO_BASE}/frac-reviews/${encodeURIComponent(id)}`,
  REVIEW_EXPORT: (id: string) => `${FRAC_STUDIO_BASE}/frac-reviews/${encodeURIComponent(id)}/export.xlsx`,
  REVIEW_OPEN: (id: string) => `${FRAC_STUDIO_BASE}/frac-reviews/${encodeURIComponent(id)}/open-in-creator`,
  JOB: (id: string) => `${FRAC_STUDIO_BASE}/jobs/${encodeURIComponent(id)}`,
}

const isRunning = (job: FracJob) => job.status === 'queued' || job.status === 'running'

/** FRAC Studio backend (frac-studio-service via uiproxy /protected/v8/fracStudio). */
@Injectable({ providedIn: 'root' })
export class FracStudioApiService {
  constructor(private readonly http: HttpClient) { }

  listFracs(): Observable<FracSummary[]> {
    return this.http.get<{ fracs: FracSummary[] }>(API_END_POINTS.FRACS).pipe(map(res => res.fracs))
  }

  getFrac(id: string): Observable<Frac> {
    return this.http.get<{ frac: Frac }>(API_END_POINTS.FRAC(id)).pipe(map(res => res.frac))
  }

  createFrac(brief: FracBrief): Observable<Frac> {
    return this.http.post<{ frac: Frac }>(API_END_POINTS.FRACS, brief).pipe(map(res => res.frac))
  }

  patchFrac(id: string, edits: Partial<Frac>): Observable<Frac> {
    return this.http.patch<{ frac: Frac }>(API_END_POINTS.FRAC(id), edits).pipe(map(res => res.frac))
  }

  /** Starts the step-6 expert check; resolves to the job id to poll. */
  startCheck(id: string): Observable<string> {
    return this.http.post<{ jobId: string }>(API_END_POINTS.FRAC_CHECK(id), {}).pipe(map(res => res.jobId))
  }

  exportFrac(id: string): Observable<FracDownload> {
    return this.download(API_END_POINTS.FRAC_EXPORT(id), 'FRAC.xlsx')
  }

  /** Snapshots saved on step completion, newest first. */
  listVersions(id: string): Observable<FracVersion[]> {
    return this.http.get<{ versions: FracVersion[] }>(API_END_POINTS.FRAC_VERSIONS(id)).pipe(map(res => res.versions))
  }

  /** Rolls the FRAC back to a snapshot; the service snapshots the current state first. */
  restoreVersion(id: string, versionId: number): Observable<Frac> {
    return this.http.post<{ frac: Frac }>(API_END_POINTS.FRAC_RESTORE(id, versionId), {}).pipe(map(res => res.frac))
  }

  listReviews(): Observable<FracReviewSummary[]> {
    return this.http.get<{ reviews: FracReviewSummary[] }>(API_END_POINTS.REVIEWS).pipe(map(res => res.reviews))
  }

  getReview(id: string): Observable<FracReviewDetail> {
    return this.http.get<FracReviewDetail>(API_END_POINTS.REVIEW(id))
  }

  /** Uploads a FRAC workbook; the service parses it immediately and reviews it as a job. */
  startReview(file: File, ctx: FracReviewContext): Observable<FracStartReviewResponse> {
    const form = new FormData()
    form.append('file', file, file.name)
    Object.entries(ctx).forEach(([key, value]) => {
      if (value) {
        form.append(key, value)
      }
    })
    return this.http.post<FracStartReviewResponse>(API_END_POINTS.REVIEWS, form)
  }

  exportReview(id: string): Observable<FracDownload> {
    return this.download(API_END_POINTS.REVIEW_EXPORT(id), 'FRAC review.xlsx')
  }

  /** Imports a reviewed workbook as a FRAC at step 6; resolves to the FRAC id. */
  openInCreator(reviewId: string): Observable<string> {
    return this.http.post<{ fracId: string }>(API_END_POINTS.REVIEW_OPEN(reviewId), {}).pipe(map(res => res.fracId))
  }

  getJob(id: string): Observable<FracJob> {
    return this.http.get<FracJob>(API_END_POINTS.JOB(id))
  }

  /** Emits the job on every poll and completes after the first done/error state. */
  pollJob(id: string): Observable<FracJob> {
    return timer(0, FRAC_STUDIO_POLL_MS).pipe(
      switchMap(() => this.getJob(id)),
      takeWhile(isRunning, true),
    )
  }

  private download(url: string, fallbackName: string): Observable<FracDownload> {
    return this.http.get(url, { observe: 'response', responseType: 'blob' }).pipe(
      map((res: HttpResponse<Blob>) => ({
        blob: res.body ?? new Blob(),
        filename: filenameFromDisposition(res.headers.get('content-disposition'), fallbackName),
      })),
    )
  }
}
