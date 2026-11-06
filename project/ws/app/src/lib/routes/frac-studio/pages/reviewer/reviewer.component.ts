import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { EMPTY, Subscription } from 'rxjs'
import { switchMap } from 'rxjs/operators'
import {
  FRAC_STUDIO_ACCEPT_XLSX,
  FRAC_STUDIO_REVIEW_STATES,
  FRAC_STUDIO_ROUTES,
} from '../../constants/frac-studio.constants'
import { FracJob, FracReport } from '../../models/frac-studio.models'
import { FracStudioApiService } from '../../services/frac-studio-api.service'
import { apiErrorMessage, saveBlob } from '../../utils/frac-studio-download.util'

const NOT_STATE_SPECIFIC = FRAC_STUDIO_REVIEW_STATES[0]

/**
 * Reviewer tab (spec 6): upload a FRAC workbook, optional context, then the graded report.
 * `?review=<id>` reopens a saved review (from My FRACs).
 */
@Component({
  selector: 'ws-app-frac-studio-reviewer',
  templateUrl: './reviewer.component.html',
  styleUrls: ['./reviewer.component.scss'],
  standalone: false,
})
export class ReviewerComponent implements OnInit, OnDestroy {
  readonly accept = FRAC_STUDIO_ACCEPT_XLSX
  readonly states = FRAC_STUDIO_REVIEW_STATES

  // form
  file: File | null = null
  cadre = ''
  state = NOT_STATE_SPECIFIC
  notes = ''

  // run state
  reviewId: string | null = null
  job: FracJob | null = null
  report: FracReport | null = null
  warnings: string[] = []
  /** When the saved review shown was made; set when the upload matched an earlier review. */
  savedAt: string | null = null
  error = ''
  busy = false

  private readonly subs = new Subscription()

  constructor(
    private readonly api: FracStudioApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) { }

  ngOnInit(): void {
    this.subs.add(
      this.route.queryParamMap.subscribe(params => {
        const id = params.get('review')
        if (id && id !== this.reviewId) {
          this.loadReview(id)
        }
      }),
    )
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe()
  }

  get canRun(): boolean {
    return !!this.file && !this.busy
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement
    this.file = input.files && input.files.length ? input.files[0] : null
    this.error = ''
  }

  /**
   * Uploads, then polls the review job and loads the report when it finishes. A file and context
   * reviewed before come back with no job, so the saved review is loaded straight away.
   */
  runReview(): void {
    if (!this.file) {
      return
    }
    this.resetRun()
    this.busy = true
    const ctx = {
      cadre: this.cadre.trim(),
      state: this.state === NOT_STATE_SPECIFIC ? '' : this.state,
      notes: this.notes.trim(),
    }
    this.subs.add(
      this.api.startReview(this.file, ctx).pipe(
        switchMap(started => {
          this.reviewId = started.reviewId
          this.warnings = started.warnings
          this.savedAt = started.fromCache ? started.reviewedAt ?? null : null
          if (!started.jobId) {
            this.loadReview(started.reviewId)
            return EMPTY
          }
          return this.api.pollJob(started.jobId)
        }),
      ).subscribe({
        next: job => this.onJob(job),
        error: err => this.fail(apiErrorMessage(err, 'The review could not be started.')),
      }),
    )
  }

  /** Reviews the same file again instead of showing the saved review. */
  runFreshReview(): void {
    const id = this.reviewId
    if (!id) {
      return
    }
    this.report = null
    this.savedAt = null
    this.job = null
    this.error = ''
    this.busy = true
    this.subs.add(
      this.api.rerunReview(id).pipe(
        switchMap(started => {
          this.reviewId = started.reviewId
          if (!started.jobId) {
            this.loadReview(started.reviewId)
            return EMPTY
          }
          return this.api.pollJob(started.jobId)
        }),
      ).subscribe({
        next: job => this.onJob(job),
        error: err => this.fail(apiErrorMessage(err, 'The fresh review could not be started.')),
      }),
    )
  }

  downloadReview(): void {
    if (!this.reviewId) {
      return
    }
    this.subs.add(
      this.api.exportReview(this.reviewId).subscribe({
        next: file => saveBlob(file.blob, file.filename),
        error: err => this.error = apiErrorMessage(err, 'The review could not be downloaded.'),
      }),
    )
  }

  openInCreator(): void {
    if (!this.reviewId) {
      return
    }
    this.subs.add(
      this.api.openInCreator(this.reviewId).subscribe({
        next: fracId => this.router.navigateByUrl(FRAC_STUDIO_ROUTES.creatorDetail(fracId)),
        error: err => this.error = apiErrorMessage(err, 'The FRAC could not be opened in the Creator.'),
      }),
    )
  }

  startOver(): void {
    this.resetRun()
    this.file = null
    this.router.navigate([], { relativeTo: this.route, queryParams: {} })
  }

  private onJob(job: FracJob): void {
    this.job = job
    if (job.status === 'error') {
      this.fail(job.error || 'The review failed.')
    } else if (job.status === 'done' && this.reviewId) {
      this.loadReview(this.reviewId)
    }
  }

  private loadReview(id: string): void {
    this.reviewId = id
    this.busy = true
    this.subs.add(
      this.api.getReview(id).subscribe({
        next: detail => {
          this.report = detail.report
          this.busy = false
          if (!detail.report) {
            this.error = 'This review is still running. Open it again from My FRACs in a moment.'
          }
        },
        error: err => this.fail(apiErrorMessage(err, 'The review could not be loaded.')),
      }),
    )
  }

  private fail(message: string): void {
    this.error = message
    this.busy = false
  }

  private resetRun(): void {
    this.reviewId = null
    this.job = null
    this.report = null
    this.warnings = []
    this.savedAt = null
    this.error = ''
  }
}
