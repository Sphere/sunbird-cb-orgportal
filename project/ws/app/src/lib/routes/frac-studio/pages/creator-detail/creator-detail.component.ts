import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Subscription } from 'rxjs'
import { switchMap } from 'rxjs/operators'
import {
  Frac,
  FracCompetency,
  FracJob,
  FracPosting,
  FracResearch,
  FracRole,
  FracSaveStatus,
} from '../../models/frac-studio.models'
import { FracStudioApiService } from '../../services/frac-studio-api.service'
import { FracStudioAutosaveService } from '../../services/frac-studio-autosave.service'
import { apiErrorMessage, saveBlob } from '../../utils/frac-studio-download.util'
import { emptyResearch } from '../../utils/frac-studio-edit.util'
import { curStep, fracProgress, FracStepProgress } from '../../utils/frac-studio-progress.util'
import { dominantPrefix, usedByMap } from '../../utils/frac-studio-refs.util'

export type CreatorTab = 'research' | 'roles' | 'competencies' | 'ladders' | 'check' | 'history'

/** Primary action per curStep (spec 5). Steps that need AI open the matching editor instead. */
const PRIMARY: { label: string, tab: CreatorTab | null }[] = [
  { label: 'Start job research', tab: 'research' },
  { label: 'Add roles & activities', tab: 'roles' },
  { label: 'Add competencies', tab: 'competencies' },
  { label: 'Write level ladders', tab: 'ladders' },
  { label: 'Run expert check', tab: null },
  { label: 'Download Excel', tab: null },
]

/** One FRAC in the Creator: progress tracker, editors with autosave, expert check, history. */
@Component({
  selector: 'ws-app-frac-studio-creator-detail',
  templateUrl: './creator-detail.component.html',
  styleUrls: ['./creator-detail.component.scss'],
  standalone: false,
  providers: [FracStudioAutosaveService],
})
export class CreatorDetailComponent implements OnInit, OnDestroy {
  readonly tabs: { key: CreatorTab, label: string }[] = [
    { key: 'research', label: 'Research' },
    { key: 'roles', label: 'Roles & activities' },
    { key: 'competencies', label: 'Competencies' },
    { key: 'ladders', label: 'Level ladders' },
    { key: 'check', label: 'Expert check' },
    { key: 'history', label: 'History' },
  ]

  frac: Frac | null = null
  steps: FracStepProgress[] = []
  usedBy = new Map<string, string[]>()
  tab: CreatorTab = 'roles'
  job: FracJob | null = null
  saveStatus: FracSaveStatus = 'idle'
  historyKey = 0
  /** "Start research" waits for a confirmation, because research locks the brief. */
  confirmStartResearch = false
  loading = true
  checking = false
  error = ''

  private fracId = ''
  private readonly subs = new Subscription()

  constructor(
    private readonly api: FracStudioApiService,
    private readonly autosave: FracStudioAutosaveService,
    private readonly route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.subs.add(this.autosave.status$.subscribe(status => this.saveStatus = status))
    this.subs.add(this.autosave.saved$.subscribe(saved => this.onSaved(saved)))
    this.subs.add(
      this.route.paramMap.subscribe(params => {
        this.fracId = params.get('id') || ''
        this.autosave.attach(this.fracId)
        this.load(true)
      }),
    )
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe()
  }

  get prefix(): string {
    return this.frac ? (this.frac.codePrefix || dominantPrefix(this.frac.competencies.map(c => c.code)) || 'C') : 'C'
  }

  get primary(): { label: string, tab: CreatorTab | null } {
    return this.frac ? PRIMARY[curStep(this.frac)] : PRIMARY[0]
  }

  /** Only "Run expert check" changes the FRAC; opening an editor or downloading does not. */
  get primaryMutates(): boolean {
    return !!this.frac && curStep(this.frac) === 4
  }

  /** The check reads the saved FRAC, so wait until edits are saved. */
  get canCheck(): boolean {
    return !!this.frac && this.frac.competencies.length > 0 && !this.checking
      && (this.saveStatus === 'idle' || this.saveStatus === 'saved')
  }

  onPrimary(): void {
    const action = this.primary
    if (action.tab) {
      this.tab = action.tab
    } else if (this.frac && curStep(this.frac) === 4) {
      this.tab = 'check'
      this.runCheck()
    } else {
      this.download()
    }
  }

  /** Saves empty research (spec 5.2). From here on the service refuses brief changes (BRIEF_LOCKED). */
  startResearch(): void {
    this.confirmStartResearch = false
    const research = emptyResearch()
    this.applyLocal({ research })
    this.autosave.queue('research', research)
  }

  onResearchChange(research: FracResearch): void {
    this.applyLocal({ research })
    this.autosave.queue('research', research)
  }

  /** Postings changes; removing a posting also clears its column from the activities. */
  onPostingsChange(change: { postings: FracPosting[], roles?: FracRole[] }): void {
    this.applyLocal(change.roles ? { postings: change.postings, roles: change.roles } : { postings: change.postings })
    this.autosave.queue('postings', change.postings)
    if (change.roles) {
      this.autosave.queue('roles', change.roles)
    }
  }

  onRolesChange(roles: FracRole[]): void {
    this.applyLocal({ roles })
    this.autosave.queue('roles', roles)
  }

  onCompetenciesChange(competencies: FracCompetency[]): void {
    this.applyLocal({ competencies })
    this.autosave.queue('competencies', competencies)
  }

  /** The team re-checked the mappings by hand after editing roles. */
  markMappingChecked(): void {
    this.applyLocal({ rolesDirty: false })
    this.autosave.queue('rolesDirty', false)
  }

  retrySave(): void {
    this.autosave.retry()
  }

  onRestored(frac: Frac): void {
    this.setFrac(frac)
  }

  /** Expert check (spec 5.6): the review engine on the saved FRAC, then reload. */
  runCheck(): void {
    if (!this.canCheck) {
      return
    }
    this.checking = true
    this.error = ''
    this.subs.add(
      this.api.startCheck(this.fracId).pipe(switchMap(jobId => this.api.pollJob(jobId))).subscribe({
        next: job => this.onCheckJob(job),
        error: err => {
          this.checking = false
          this.error = apiErrorMessage(err, 'The expert check could not be started.')
        },
      }),
    )
  }

  download(): void {
    this.autosave.flush()
    this.subs.add(
      this.api.exportFrac(this.fracId).subscribe({
        next: file => saveBlob(file.blob, file.filename),
        error: err => this.error = apiErrorMessage(err, 'The FRAC could not be downloaded.'),
      }),
    )
  }

  private onCheckJob(job: FracJob): void {
    this.job = job
    this.refreshDerived()
    if (job.status === 'done') {
      this.checking = false
      this.historyKey++
      this.load(false)
    } else if (job.status === 'error') {
      this.checking = false
    }
  }

  /** After a save, keep local edits typed since; otherwise take the server copy. */
  private onSaved(saved: Frac): void {
    if (!this.frac) {
      return
    }
    this.setFrac(this.autosave.hasUnsaved ? { ...this.frac, rolesDirty: saved.rolesDirty } : saved)
  }

  private applyLocal(patch: Partial<Frac>): void {
    if (this.frac) {
      this.setFrac({ ...this.frac, ...patch })
    }
  }

  private setFrac(frac: Frac): void {
    this.frac = frac
    this.refreshDerived()
  }

  private refreshDerived(): void {
    if (this.frac) {
      this.usedBy = usedByMap(this.frac)
      this.steps = fracProgress(this.frac, this.job)
    }
  }

  private load(pickTab: boolean): void {
    this.loading = !this.frac
    this.subs.add(
      this.api.getFrac(this.fracId).subscribe({
        next: frac => {
          this.loading = false
          this.setFrac(frac)
          if (pickTab) {
            this.tab = this.primary.tab ?? 'check'
          }
        },
        error: err => {
          this.loading = false
          this.error = apiErrorMessage(err, 'The FRAC could not be loaded.')
        },
      }),
    )
  }
}
