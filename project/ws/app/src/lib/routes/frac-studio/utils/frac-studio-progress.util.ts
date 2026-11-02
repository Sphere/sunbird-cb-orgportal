import { Frac, FracJob } from '../models/frac-studio.models'
import { normalizeCode, usedByMap } from './frac-studio-refs.util'

export type FracStepState = 'done' | 'current' | 'attention' | 'todo'

export interface FracStepProgress {
  number: number
  title: string
  /** What the step produces, in one line. */
  produces: string
  state: FracStepState
  /** Evidence from the FRAC's own data, e.g. "12 roles · 64 activities". */
  evidence: string
  /** What the team can do on this step right now. */
  howTo: string
  /** Live job message when this step's job is running. */
  running: string
}

/**
 * The FRAC's position in the six-step flow (spec 5, curStep). An imported FRAC has no
 * research but already has roles, so it skips straight past the research step.
 */
export function curStep(frac: Frac): number {
  if (!frac.research && !frac.imported && !frac.roles.length) {
    return 0
  }
  if (!frac.roles.length) {
    return 1
  }
  if (!frac.competencies.length || frac.rolesDirty) {
    return 2
  }
  if (frac.competencies.some(c => c.levels === null)) {
    return 3
  }
  return frac.review ? 5 : 4
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

function stats(frac: Frac) {
  const activities = frac.roles.flatMap(r => r.activities)
  const used = usedByMap(frac)
  const types = { D: 0, F: 0, B: 0 }
  for (const c of frac.competencies) {
    const t = c.type.trim().charAt(0).toUpperCase()
    if (t === 'D' || t === 'F' || t === 'B') {
      types[t]++
    }
  }
  return {
    activities: activities.length,
    unmapped: activities.filter(a => !a.comp.trim()).length,
    unused: frac.competencies.filter(c => !used.has(normalizeCode(c.code))).length,
    ladders: frac.competencies.filter(c => c.levels !== null).length,
    types,
  }
}

function reviewEvidence(frac: Frac): string {
  if (!frac.review) {
    return 'Not run yet'
  }
  const open = frac.review.findings.filter(f => !f.fixed)
  const count = (sev: string) => open.filter(f => f.sev === sev).length
  return `${count('B')} blocker · ${count('M')} major · ${count('m')} minor`
}

/** The six steps before a FRAC exists, for the brief page: step 1 current, the rest ahead. */
export function plannedSteps(): FracStepProgress[] {
  const draft: Frac = {
    id: '', createdAt: '', updatedAt: '', ownerId: '', step: 1, cadre: '', cadreFull: '', state: '',
    size: 'standard', prompt: '', codePrefix: 'C', postings: [], research: null, roles: [], competencies: [],
    rolesDirty: false, review: null,
  }
  return fracProgress(draft).map((step, i) => ({
    ...step,
    state: i === 0 ? 'current' : 'todo',
    evidence: '',
    howTo: i === 0 ? 'Fill in the brief and create the FRAC.' : step.howTo,
  }))
}

/**
 * Builds the six-step tracker for the Creator page: state, evidence from the data,
 * and what can be done now. `job` is the running expert check, if any.
 */
export function fracProgress(frac: Frac, job: FracJob | null = null): FracStepProgress[] {
  const s = stats(frac)
  // curStep counts from research (0 = step 2), so the step number is two ahead; 6 is the last
  const current = Math.min(curStep(frac) + 2, 6)
  const checkRunning = !!job && (job.status === 'queued' || job.status === 'running')
  const state = (n: number, done: boolean): FracStepState => {
    if (done) {
      return 'done'
    }
    return n === current ? 'current' : 'todo'
  }

  return [
    {
      number: 1,
      title: 'Brief',
      produces: 'Cadre, state, scope and size',
      state: 'done',
      evidence: `${frac.cadre} · ${frac.state} · ${frac.size}`,
      howTo: 'Locked once research exists.',
      running: '',
    },
    {
      number: 2,
      title: 'Job research',
      produces: 'JD sources, postings, authorised and not-authorised scope',
      state: state(2, !!frac.research || !!frac.imported),
      evidence: frac.research
        ? `${plural(frac.research.sources.length, 'source')} · ${plural(frac.postings.length, 'posting')}`
        : frac.imported ? `Skipped: imported from ${frac.imported}` : 'No research yet',
      howTo: 'Needs AI generation, which is not enabled on this server yet.',
      running: '',
    },
    {
      number: 3,
      title: 'Roles & activities',
      produces: 'Roles from the job, observable activities, posting Yes/No, competency@level',
      state: state(3, frac.roles.length > 0),
      evidence: frac.roles.length
        ? `${plural(frac.roles.length, 'role')} · ${plural(s.activities, 'activity', 'activities')} · ${s.unmapped} unmapped`
        : 'No roles yet',
      howTo: 'Edit, add, delete or reorder by hand in the Roles & activities tab. AI drafting is not enabled yet.',
      running: '',
    },
    {
      number: 4,
      title: 'Competencies',
      produces: 'Competencies derived from the activities, typed Domain / Functional / Behavioural',
      state: frac.rolesDirty ? 'attention' : state(4, frac.competencies.length > 0),
      evidence: frac.competencies.length
        ? `${plural(frac.competencies.length, 'competency', 'competencies')} · D ${s.types.D} / F ${s.types.F} / B ${s.types.B} · ${s.unused} unused`
        : 'No competencies yet',
      howTo: frac.rolesDirty
        ? 'Roles changed after competencies were derived. Check the mappings, then mark them checked.'
        : 'Edit, add or delete in the Competencies tab. AI derivation is not enabled yet.',
      running: '',
    },
    {
      number: 5,
      title: 'Level ladders',
      produces: 'L1–L5 per competency, 2–4 assessable indicators each',
      state: state(5, frac.competencies.length > 0 && s.ladders === frac.competencies.length),
      evidence: frac.competencies.length ? `${s.ladders} of ${frac.competencies.length} ladders written` : 'Needs competencies first',
      howTo: 'Write or edit each level in the Level ladders tab. AI writing is not enabled yet.',
      running: '',
    },
    {
      number: 6,
      title: 'Expert check & download',
      produces: 'Graded review of this FRAC, then the Excel workbook',
      state: checkRunning ? 'current' : state(6, !!frac.review),
      evidence: reviewEvidence(frac),
      howTo: frac.competencies.length ? 'Run or re-run the check, then download Excel.' : 'Needs competencies first.',
      running: checkRunning && job ? job.msg : '',
    },
  ]
}
