import { Component, OnDestroy } from '@angular/core'
import { Router } from '@angular/router'
import { of, Subject, Subscription } from 'rxjs'
import { catchError, debounceTime, map, switchMap } from 'rxjs/operators'
import {
  FRAC_STUDIO_MATCH_DEBOUNCE_MS,
  FRAC_STUDIO_NATIONAL_BASELINE,
  FRAC_STUDIO_ROUTES,
  FRAC_STUDIO_STATES,
} from '../../constants/frac-studio.constants'
import { Frac, FracMatch, FracSeedRequest } from '../../models/frac-studio.models'
import { FracStudioApiService } from '../../services/frac-studio-api.service'
import { FracStudioPosition, FracStudioPositionsService } from '../../services/frac-studio-positions.service'
import { apiErrorMessage } from '../../utils/frac-studio-download.util'
import { plannedSteps } from '../../utils/frac-studio-progress.util'
import { syllabusTitles } from '../../utils/frac-studio-syllabus.util'

/** What position matching found for the typed position: one of the owner's FRACs, a Positions entry, or nothing. */
export type BriefMatch =
  | { kind: 'frac', match: FracMatch }
  | { kind: 'positions', position: FracStudioPosition }
  | { kind: 'none', name: string }

/**
 * Creator step 1 (spec 5.1): the brief. Creating it opens the FRAC's step page. Review decisions (Nov 2026):
 * no size choice (the agent decides during research); the position is matched exactly against the owner's
 * FRACs, then the Positions master, and a match can seed the postings and, if ticked, the roles; job descriptions or orders
 * can be attached and are uploaded once the FRAC exists.
 */
@Component({
  selector: 'ws-app-frac-studio-creator-brief',
  templateUrl: './creator-brief.component.html',
  styleUrls: ['./creator-brief.component.scss'],
  standalone: false,
})
export class CreatorBriefComponent implements OnDestroy {
  readonly states = FRAC_STUDIO_STATES
  /** All six steps, shown before the FRAC exists so the team sees the whole path. */
  readonly steps = plannedSteps()

  cadre = ''
  state = FRAC_STUDIO_NATIONAL_BASELINE
  prompt = ''

  match: BriefMatch | null = null
  matching = false
  /** Start from the matched FRAC's postings (on by default). */
  usePostings = true
  /**
   * Also copy the matched roles and activities. Off by default: copied roles skip the roles step, and a match can
   * hold another state's roles or a syllabus rather than a job.
   */
  useRoles = false
  /** Matched role titles that read as syllabus subjects, for the warning on the match card. */
  syllabus: string[] = []

  saving = false
  error = ''

  private readonly lookups = new Subject<{ cadre: string, state: string }>()
  private readonly subs = new Subscription()

  constructor(
    private readonly api: FracStudioApiService,
    private readonly positions: FracStudioPositionsService,
    private readonly router: Router,
  ) {
    this.subs.add(
      this.lookups.pipe(
        debounceTime(FRAC_STUDIO_MATCH_DEBOUNCE_MS),
        switchMap(({ cadre, state }) => this.findMatch(cadre, state).pipe(map(match => ({ cadre, match })))),
      ).subscribe(({ cadre, match }) => {
        // The position was changed or cleared while this lookup ran
        if (cadre !== this.cadre.trim()) {
          return
        }
        this.matching = false
        this.match = match
        this.usePostings = true
        this.useRoles = false
        this.syllabus = syllabusTitles(match.kind === 'frac' ? match.match.roleTitles ?? []
          : match.kind === 'positions' ? match.position.roles.map(r => r.title) : [])
      }),
    )
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe()
  }

  get canCreate(): boolean {
    return !!this.cadre.trim() && !this.saving && !this.matching
  }

  /** The seed sent with the brief: postings (and roles, if ticked) from a FRAC, or roles from Positions. */
  get seed(): FracSeedRequest | undefined {
    if (this.match?.kind === 'frac' && (this.usePostings || this.useRoles)) {
      return { from: 'frac', fracId: this.match.match.id, withRoles: this.useRoles }
    }
    if (this.match?.kind === 'positions' && this.useRoles && this.match.position.roles.length) {
      const p = this.match.position
      return { from: 'positions', code: p.code, name: p.name, roles: p.roles }
    }
    return undefined
  }

  /** Looks the position up after typing pauses, and again when the state changes (same-state FRACs rank first). */
  lookUp(): void {
    const cadre = this.cadre.trim()
    if (!cadre) {
      this.match = null
      this.syllabus = []
      this.matching = false
      return
    }
    this.matching = true
    this.lookups.next({ cadre, state: this.state })
  }

  create(): void {
    if (!this.canCreate) {
      return
    }
    this.saving = true
    this.error = ''
    const brief = { cadre: this.cadre.trim(), state: this.state, prompt: this.prompt.trim(), ...(this.seed ? { seed: this.seed } : {}) }
    this.subs.add(
      this.api.createFrac(brief).subscribe({
        next: (frac: Frac) => this.router.navigateByUrl(FRAC_STUDIO_ROUTES.creatorDetail(frac.id)),
        error: err => {
          this.error = apiErrorMessage(err, 'The FRAC could not be created.')
          this.saving = false
        },
      }),
    )
  }

  /** The owner's FRACs first, then the Positions master; nothing found means a new position. */
  private findMatch(cadre: string, state: string) {
    return this.api.matchPosition(cadre, state).pipe(
      catchError(() => of(null)),
      switchMap(match => match
        ? of<BriefMatch>({ kind: 'frac', match })
        : this.positions.findPosition(cadre).pipe(
          map((position): BriefMatch => position ? { kind: 'positions', position } : { kind: 'none', name: cadre }),
        )),
    )
  }
}
