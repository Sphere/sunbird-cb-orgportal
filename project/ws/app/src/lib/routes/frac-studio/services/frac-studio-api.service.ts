import { Injectable } from '@angular/core'
import { HttpClient, HttpResponse } from '@angular/common/http'
import { Observable, timer } from 'rxjs'
import { map, switchMap, takeWhile } from 'rxjs/operators'
import { FRAC_STUDIO_POLL_MS } from '../constants/frac-studio.constants'
import {
  Frac,
  FracBrief,
  FracDocument,
  FracDocumentKind,
  FracDownload,
  FracEdits,
  FracGenStep,
  FracJob,
  FracMatch,
  FracReviewContext,
  FracReviewDetail,
  FracReviewSummary,
  FracStartReviewResponse,
  FracStepBody,
  FracSummary,
  FracVersion,
} from '../models/frac-studio.models'
import { filenameFromDisposition } from '../utils/frac-studio-download.util'

const FRAC_STUDIO_BASE = '/apis/protected/v8/fracStudio'

const API_END_POINTS = {
  FRACS: `${FRAC_STUDIO_BASE}/fracs`,
  FRAC_MATCH: `${FRAC_STUDIO_BASE}/fracs/match`,
  FRAC_DOCUMENTS: (id: string) => `${FRAC_STUDIO_BASE}/fracs/${encodeURIComponent(id)}/documents`,
  FRAC_DOCUMENT: (id: string, documentId: string) =>
    `${FRAC_STUDIO_BASE}/fracs/${encodeURIComponent(id)}/documents/${encodeURIComponent(documentId)}`,
  TEMPLATE: (kind: FracDocumentKind) => `${FRAC_STUDIO_BASE}/templates/${kind}`,
  FRAC: (id: string) => `${FRAC_STUDIO_BASE}/fracs/${encodeURIComponent(id)}`,
  FRAC_STEP: (id: string, step: FracGenStep) => `${FRAC_STUDIO_BASE}/fracs/${encodeURIComponent(id)}/steps/${step}`,
  FRAC_CHECK: (id: string) => `${FRAC_STUDIO_BASE}/fracs/${encodeURIComponent(id)}/steps/check`,
  FRAC_EXPORT: (id: string) => `${FRAC_STUDIO_BASE}/fracs/${encodeURIComponent(id)}/export.xlsx`,
  FRAC_VERSIONS: (id: string) => `${FRAC_STUDIO_BASE}/fracs/${encodeURIComponent(id)}/versions`,
  FRAC_RESTORE: (id: string, versionId: number) =>
    `${FRAC_STUDIO_BASE}/fracs/${encodeURIComponent(id)}/versions/${versionId}/restore`,
  REVIEWS: `${FRAC_STUDIO_BASE}/frac-reviews`,
  REVIEW: (id: string) => `${FRAC_STUDIO_BASE}/frac-reviews/${encodeURIComponent(id)}`,
  REVIEW_EXPORT: (id: string) => `${FRAC_STUDIO_BASE}/frac-reviews/${encodeURIComponent(id)}/export.xlsx`,
  REVIEW_OPEN: (id: string) => `${FRAC_STUDIO_BASE}/frac-reviews/${encodeURIComponent(id)}/open-in-creator`,
  REVIEW_RERUN: (id: string) => `${FRAC_STUDIO_BASE}/frac-reviews/${encodeURIComponent(id)}/rerun`,
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

  /** The FRAC plus the step or check still running on it, so a reloaded page can follow that job. */
  loadFrac(id: string): Observable<{ frac: Frac, activeJobId: string | null }> {
    return this.http.get<{ frac: Frac, activeJobId?: string | null }>(API_END_POINTS.FRAC(id))
      .pipe(map(res => ({ frac: res.frac, activeJobId: res.activeJobId ?? null })))
  }

  createFrac(brief: FracBrief): Observable<Frac> {
    return this.http.post<{ frac: Frac }>(API_END_POINTS.FRACS, brief).pipe(map(res => res.frac))
  }

  /** Position matching: the owner's most recent FRAC for exactly this position, or null. */
  matchPosition(cadre: string, state: string): Observable<FracMatch | null> {
    return this.http.get<{ match: FracMatch | null }>(API_END_POINTS.FRAC_MATCH, { params: { cadre, state } })
      .pipe(map(res => res.match))
  }

  listDocuments(id: string): Observable<FracDocument[]> {
    return this.http.get<{ documents: FracDocument[] }>(API_END_POINTS.FRAC_DOCUMENTS(id)).pipe(map(res => res.documents))
  }

  /** Attaches a brief document or imports a standard sheet; returns the document and the FRAC after it. */
  uploadDocument(id: string, kind: FracDocumentKind, file: File): Observable<{ document: FracDocument, frac: Frac }> {
    const form = new FormData()
    form.append('kind', kind)
    form.append('file', file, file.name)
    return this.http.post<{ document: FracDocument, frac: Frac }>(API_END_POINTS.FRAC_DOCUMENTS(id), form)
  }

  /** Removes a document; for a sheet the content stays and the step goes back to the AI. */
  removeDocument(id: string, documentId: string): Observable<Frac> {
    return this.http.delete<{ frac: Frac }>(API_END_POINTS.FRAC_DOCUMENT(id, documentId)).pipe(map(res => res.frac))
  }

  /** The template to fill in before uploading (an .xlsx, or a text guide for brief documents). */
  downloadTemplate(kind: FracDocumentKind): Observable<FracDownload> {
    return this.download(API_END_POINTS.TEMPLATE(kind), kind === 'brief' ? 'Job description guide.txt' : `${kind} template.xlsx`)
  }

  patchFrac(id: string, edits: FracEdits): Observable<Frac> {
    return this.http.patch<{ frac: Frac }>(API_END_POINTS.FRAC(id), edits).pipe(map(res => res.frac))
  }

  /** Starts an AI step (2–5) on the saved FRAC; resolves to the job id to poll. */
  runStep(id: string, step: FracGenStep, body: FracStepBody = {}): Observable<string> {
    return this.http.post<{ jobId: string }>(API_END_POINTS.FRAC_STEP(id, step), body).pipe(map(res => res.jobId))
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

  /**
   * Uploads a FRAC workbook; the service parses it immediately and reviews it as a job. When the same
   * file and context were reviewed before, it returns the saved review instead (`fromCache`, `jobId: null`).
   */
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

  /** Reviews the same file again, ignoring the saved review ("Run a fresh review"). */
  rerunReview(id: string): Observable<FracStartReviewResponse> {
    return this.http.post<FracStartReviewResponse>(API_END_POINTS.REVIEW_RERUN(id), {})
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
