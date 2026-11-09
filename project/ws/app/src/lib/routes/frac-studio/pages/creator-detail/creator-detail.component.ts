import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Observable, of, Subscription } from 'rxjs'
import { switchMap } from 'rxjs/operators'
import {
  Frac,
  FracCompetency,
  FracFinding,
  FracGenStep,
  FracJob,
  FracPosting,
  FracResearch,
  FracRole,
  FracSaveStatus,
  FracStepBody,
} from '../../models/frac-studio.models'
import { FracStudioApiService } from '../../services/frac-studio-api.service'
import { FracStudioAutosaveService } from '../../services/frac-studio-autosave.service'
import { apiErrorMessage, runningJobId, saveBlob } from '../../utils/frac-studio-download.util'
import { emptyResearch } from '../../utils/frac-studio-edit.util'
import { curStep, fracProgress, FracStepProgress } from '../../utils/frac-studio-progress.util'
import { dominantPrefix, normalizeCode, usedByMap } from '../../utils/frac-studio-refs.util'

export type CreatorTab = 'research' | 'roles' | 'competencies' | 'ladders' | 'check' | 'history'

/** Primary action per curStep (spec 5 labels). Steps 2–5 run the AI step; "Re-derive" when roles changed. */
const PRIMARY: { label: string, step: FracGenStep | null }[] = [
  { label: 'Research the job', step: 'research' },
  { label: 'Build roles & activities', step: 'roles' },
  { label: 'Derive competencies', step: 'competencies' },
  { label: 'Write level ladders', step: 'ladders' },
  { label: 'Run expert check', step: null },
  { label: 'Download Excel', step: null },
]

const GEN_STEPS: readonly FracGenStep[] = ['research', 'roles', 'competencies', 'ladders']

/** What a revise keeps and what it redoes, shown under each feedback box. */
const REVISE_HINTS: Record<FracGenStep, string> = {
  research: 'Research is redone with your feedback, e.g. "Add the state\'s 104 helpline".',
  roles: 'Roles and activities are redone with your feedback. Activities your team added are kept; '
    + 'competency mappings are cleared until competencies are re-derived.',
  competencies: 'Competencies and mappings are redone with your feedback. Ladders are kept where a competency\'s code and label stay the same.',
  ladders: 'Feedback applies to "Rewrite all" and to "Revise" on a single competency.',
}

/** One FRAC in the Creator: progress tracker, AI steps with revise, editors with autosave, expert check, history. */
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
  readonly reviseHints = REVISE_HINTS

  frac: Frac | null = null
  steps: FracStepProgress[] = []
  usedBy = new Map<string, string[]>()
  /** Normalised competency codes, so findings can offer "Fix these competencies". */
  competencyCodes = new Set<string>()
  tab: CreatorTab = 'roles'
  /** The running or last AI step / expert check. */
  job: FracJob | null = null
  /** A step was requested and its job id has not come back yet. */
  starting = false
  saveStatus: FracSaveStatus = 'idle'
  historyKey = 0
  /** Revise feedback typed per step. */
  feedback: Record<FracGenStep, string> = { research: '', roles: '', competencies: '', ladders: '' }
  loading = true
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

  get primary(): { label: string, step: FracGenStep | null } {
    if (!this.frac) {
      return PRIMARY[0]
    }
    const step = curStep(this.frac)
    const action = PRIMARY[step]
    if (step === 4 && this.frac.review) {
      return { ...action, label: 'Re-run expert check' }
    }
    return action.step === 'competencies' && this.frac.rolesDirty ? { ...action, label: 'Re-derive competencies' } : action
  }

  /** Everything but "Download Excel" changes the FRAC. */
  get primaryMutates(): boolean {
    return !!this.frac && curStep(this.frac) < 5
  }

  get running(): boolean {
    return this.starting || (!!this.job && (this.job.status === 'queued' || this.job.status === 'running'))
  }

  /** Steps and the check read the saved FRAC, so wait until edits are saved. */
  get canRun(): boolean {
    return !!this.frac && !this.running && (this.saveStatus === 'idle' || this.saveStatus === 'saved')
  }

  get canCheck(): boolean {
    return this.canRun && !!this.frac && this.frac.competencies.length > 0
  }

  /**
   * The Excel goes out only after a successful expert check of the current content. Steps and edits that
   * change the content clear the review or mark it out of date, so the download waits for a fresh check.
   */
  get canDownload(): boolean {
    return !!this.frac?.review && !this.frac.reviewStale && !this.running
  }

  /** The AI step behind the open tab, once it has output to revise (ladders: once competencies exist). */
  get reviseStep(): FracGenStep | null {
    const f = this.frac
    if (!f || !GEN_STEPS.includes(this.tab as FracGenStep)) {
      return null
    }
    const has: Record<FracGenStep, boolean> = {
      research: !!f.research,
      roles: f.roles.length > 0,
      competencies: f.competencies.length > 0,
      ladders: f.competencies.length > 0,
    }
    return has[this.tab as FracGenStep] ? this.tab as FracGenStep : null
  }

  get missingLadders(): number {
    return this.frac ? this.frac.competencies.filter(c => c.levels === null).length : 0
  }

  onPrimary(): void {
    const action = this.primary
    if (action.step === 'research') {
      // Research locks the brief, so the Research tab offers AI or by-hand with that warning
      this.tab = 'research'
    } else if (action.step) {
      this.runStep(action.step)
    } else if (this.frac && curStep(this.frac) === 4) {
      this.tab = 'check'
      this.runCheck()
    } else {
      this.download()
    }
  }

  /** AI research (spec 5.2). From here on the service refuses brief changes (BRIEF_LOCKED). */
  researchWithAi(): void {
    this.runStep('research')
  }

  /** Saves empty research to fill in by hand; this also locks the brief. */
  startResearch(): void {
    const research = emptyResearch()
    this.applyLocal({ research })
    this.autosave.queue('research', research)
  }

  /** Re-runs the step with the team's feedback (spec 5, revise). */
  revise(step: FracGenStep): void {
    const feedback = this.feedback[step].trim()
    if (feedback) {
      this.runStep(step, { feedback })
    }
  }

  /** Ladders for competencies that have none yet. */
  writeMissingLadders(): void {
    this.runStep('ladders')
  }

  rewriteAllLadders(): void {
    if (this.frac) {
      this.runStep('ladders', this.withFeedback('ladders', { codes: this.frac.competencies.map(c => c.code) }))
    }
  }

  reviseLadder(code: string): void {
    this.runStep('ladders', this.withFeedback('ladders', { codes: [code] }))
  }

  /** "Fix these competencies" (spec 5.6): rewrites the cited ladders with the finding as feedback. */
  fixFinding(finding: FracFinding): void {
    const codes = (this.frac?.competencies ?? []).map(c => c.code)
      .filter(code => finding.refs.some(ref => normalizeCode(ref) === normalizeCode(code)))
    if (codes.length) {
      this.runStep('ladders', { codes, feedback: finding.fix ? `${finding.title}. ${finding.fix}` : finding.title })
    }
  }

  onResearchChange(research: FracResearch): void {
    this.applyLocal({ research, ...this.staleCheck() })
    this.autosave.queue('research', research)
  }

  /** Postings changes; removing a posting also clears its column from the activities. */
  onPostingsChange(change: { postings: FracPosting[], roles?: FracRole[] }): void {
    this.applyLocal({ postings: change.postings, ...(change.roles ? { roles: change.roles } : {}), ...this.staleCheck() })
    this.autosave.queue('postings', change.postings)
    if (change.roles) {
      this.autosave.queue('roles', change.roles)
    }
  }

  onRolesChange(roles: FracRole[]): void {
    this.applyLocal({ roles, ...this.staleCheck() })
    this.autosave.queue('roles', roles)
  }

  onCompetenciesChange(competencies: FracCompetency[]): void {
    this.applyLocal({ competencies, ...this.staleCheck() })
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
    if (this.canCheck) {
      this.startJob(this.api.startCheck(this.fracId), 'The expert check could not be started.')
    }
  }

  download(): void {
    if (!this.canDownload) {
      return
    }
    this.autosave.flush()
    this.subs.add(
      this.api.exportFrac(this.fracId).subscribe({
        next: file => saveBlob(file.blob, file.filename),
        error: err => this.error = apiErrorMessage(err, 'The FRAC could not be downloaded.'),
      }),
    )
  }

  /** Runs an AI step on the saved FRAC and opens its tab to watch the progress. */
  runStep(step: FracGenStep, body: FracStepBody = {}): void {
    if (this.canRun) {
      this.tab = step
      this.startJob(this.api.runStep(this.fracId, step, body), 'The step could not be started.')
    }
  }

  private withFeedback(step: FracGenStep, body: FracStepBody): FracStepBody {
    const feedback = this.feedback[step].trim()
    return feedback ? { ...body, feedback } : body
  }

  private startJob(start: Observable<string>, failure: string): void {
    this.error = ''
    this.starting = true
    this.subs.add(
      start.pipe(switchMap(jobId => this.api.pollJob(jobId))).subscribe({
        next: job => {
          this.starting = false
          this.onJob(job)
        },
        error: err => {
          this.starting = false
          // The service allows one job per FRAC: follow the one already running instead of failing
          const live = runningJobId(err)
          if (live) {
            this.startJob(of(live), failure)
            return
          }
          this.job = null
          this.refreshDerived()
          this.error = apiErrorMessage(err, failure)
        },
      }),
    )
  }

  private onJob(job: FracJob): void {
    this.job = job
    this.refreshDerived()
    if (job.status === 'done') {
      if (GEN_STEPS.includes(job.kind as FracGenStep)) {
        this.feedback = { ...this.feedback, [job.kind]: '' }
      }
      this.historyKey++
      this.load(false)
    }
  }

  /** After a save, keep local edits typed since; otherwise take the server copy. */
  private onSaved(saved: Frac): void {
    if (!this.frac) {
      return
    }
    this.setFrac(this.autosave.hasUnsaved ? { ...this.frac, rolesDirty: saved.rolesDirty } : saved)
  }

  /** A content edit after the expert check makes it out of date (the service sets the same flag on save). */
  private staleCheck(): Partial<Frac> {
    return this.frac?.review ? { reviewStale: true } : {}
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
      this.competencyCodes = new Set(this.frac.competencies.map(c => normalizeCode(c.code)))
      this.steps = fracProgress(this.frac, this.job)
    }
  }

  private load(pickTab: boolean): void {
    this.loading = !this.frac
    this.subs.add(
      this.api.loadFrac(this.fracId).subscribe({
        next: ({ frac, activeJobId }) => {
          this.loading = false
          this.setFrac(frac)
          // A reloaded page or a second tab picks the running step up again
          if (activeJobId && !this.job && !this.starting) {
            this.startJob(of(activeJobId), 'The running step could not be followed.')
          }
          if (pickTab) {
            this.tab = this.primary.step ?? 'check'
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
