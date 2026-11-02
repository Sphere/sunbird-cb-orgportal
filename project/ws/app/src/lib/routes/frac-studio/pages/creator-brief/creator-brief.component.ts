import { Component, OnDestroy } from '@angular/core'
import { Router } from '@angular/router'
import { Subscription } from 'rxjs'
import {
  FRAC_STUDIO_NATIONAL_BASELINE,
  FRAC_STUDIO_ROUTES,
  FRAC_STUDIO_SIZES,
  FRAC_STUDIO_STATES,
} from '../../constants/frac-studio.constants'
import { FracSize } from '../../models/frac-studio.models'
import { FracStudioApiService } from '../../services/frac-studio-api.service'
import { apiErrorMessage } from '../../utils/frac-studio-download.util'
import { plannedSteps } from '../../utils/frac-studio-progress.util'

/** Creator step 1 (spec 5.1): the brief. Creating it opens the FRAC's step page. */
@Component({
  selector: 'ws-app-frac-studio-creator-brief',
  templateUrl: './creator-brief.component.html',
  styleUrls: ['./creator-brief.component.scss'],
  standalone: false,
})
export class CreatorBriefComponent implements OnDestroy {
  readonly states = FRAC_STUDIO_STATES
  readonly sizes = FRAC_STUDIO_SIZES
  /** All six steps, shown before the FRAC exists so the team sees the whole path. */
  readonly steps = plannedSteps()

  cadre = ''
  state = FRAC_STUDIO_NATIONAL_BASELINE
  size: FracSize = 'standard'
  prompt = ''

  saving = false
  error = ''

  private readonly subs = new Subscription()

  constructor(
    private readonly api: FracStudioApiService,
    private readonly router: Router,
  ) { }

  ngOnDestroy(): void {
    this.subs.unsubscribe()
  }

  get canCreate(): boolean {
    return !!this.cadre.trim() && !this.saving
  }

  create(): void {
    if (!this.canCreate) {
      return
    }
    this.saving = true
    this.error = ''
    this.subs.add(
      this.api.createFrac({ cadre: this.cadre.trim(), state: this.state, size: this.size, prompt: this.prompt.trim() })
        .subscribe({
          next: frac => this.router.navigateByUrl(FRAC_STUDIO_ROUTES.creatorDetail(frac.id)),
          error: err => {
            this.error = apiErrorMessage(err, 'The FRAC could not be created.')
            this.saving = false
          },
        }),
    )
  }
}
