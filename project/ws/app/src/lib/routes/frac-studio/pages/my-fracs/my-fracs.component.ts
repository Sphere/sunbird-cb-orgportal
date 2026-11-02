import { Component, OnDestroy, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { forkJoin, Subscription } from 'rxjs'
import { FRAC_STUDIO_ROUTES, FRAC_STUDIO_SEVERITY_LABELS } from '../../constants/frac-studio.constants'
import { FracReviewSummary, FracSeverity, FracSummary } from '../../models/frac-studio.models'
import { FracStudioApiService } from '../../services/frac-studio-api.service'
import { apiErrorMessage } from '../../utils/frac-studio-download.util'

/** My FRACs (spec 1): the library of saved FRACs and past reviews. */
@Component({
  selector: 'ws-app-frac-studio-my-fracs',
  templateUrl: './my-fracs.component.html',
  styleUrls: ['./my-fracs.component.scss'],
  standalone: false,
})
export class MyFracsComponent implements OnInit, OnDestroy {
  fracs: FracSummary[] = []
  reviews: FracReviewSummary[] = []
  loading = true
  error = ''

  private readonly subs = new Subscription()

  constructor(
    private readonly api: FracStudioApiService,
    private readonly router: Router,
  ) { }

  ngOnInit(): void {
    this.subs.add(
      forkJoin({ fracs: this.api.listFracs(), reviews: this.api.listReviews() }).subscribe({
        next: ({ fracs, reviews }) => {
          this.fracs = fracs
          // Expert checks already show on their FRAC; list uploads here
          this.reviews = reviews.filter(r => r.kind === 'upload')
          this.loading = false
        },
        error: err => {
          this.error = apiErrorMessage(err, 'Your FRACs could not be loaded.')
          this.loading = false
        },
      }),
    )
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe()
  }

  severityLabel(sev: FracSeverity | null): string {
    return sev ? FRAC_STUDIO_SEVERITY_LABELS[sev] : 'No findings'
  }

  openFrac(id: string): void {
    this.router.navigateByUrl(FRAC_STUDIO_ROUTES.creatorDetail(id))
  }

  openReview(id: string): void {
    this.router.navigate([FRAC_STUDIO_ROUTES.reviewer], { queryParams: { review: id } })
  }

  createNew(): void {
    this.router.navigateByUrl(FRAC_STUDIO_ROUTES.creator)
  }

  trackById(_index: number, row: { id: string }): string {
    return row.id
  }
}
