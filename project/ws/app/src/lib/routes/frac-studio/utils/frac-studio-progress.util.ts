import { Frac, FracJob, FracStep } from '../models/frac-studio.models'
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

/** Roles copied from a matched position that are still in place (not yet rebuilt or cleared). */
export const copiedRoles = (frac: Frac) => !!frac.seededFrom && frac.seededFrom.withRoles !== false && frac.roles.length > 0

/** Roles came from a standard sheet or a matched position, so research still runs before the roles step. */
const rolesGiven = (frac: Frac) => !!frac.uploads?.roles || copiedRoles(frac)

/**
 * The roles step keeps the roles as they are (writing activities only for empty roles): a Roles sheet always, copied
 * roles only while no job description is attached. With one, the roles step rebuilds them from the research.
 * Mirrors keepGivenRoles in the service's roles step.
 */
const rolesKept = (frac: Frac, briefDocs: number) =>
  frac.roles.length > 0 && (!!frac.uploads?.roles || (copiedRoles(frac) && briefDocs === 0))

/**
 * The FRAC's position in the six-step flow (spec 5, curStep). An imported FRAC has no
 * research but already has roles, so it skips straight past the research step. Roles from a sheet or a
 * matched position do not skip research, and send the team to the roles step while any role has no activities,
 * or while copied roles wait to be rebuilt because a job description is attached (`briefDocs`).
 */
export function curStep(frac: Frac, briefDocs = 0): number {
  if (!frac.research && !frac.imported && (!frac.roles.length || rolesGiven(frac))) {
    return 0
  }
  const kept = rolesKept(frac, briefDocs)
  if (!frac.roles.length || (kept && frac.roles.some(r => !r.activities.length)) || (copiedRoles(frac) && !kept)) {
    return 1
  }
  if (!frac.competencies.length || frac.rolesDirty) {
    return 2
  }
  if (frac.competencies.some(c => c.levels === null)) {
    return 3
  }
  // A check made before the latest fix or edit is out of date: back to "Run expert check"
  return frac.review && !frac.reviewStale ? 5 : 4
}

/** Steps in flow order, with the tracker title of each (changedAt keys). */
export const FRAC_STEP_TITLES: Record<FracStep, string> = {
  brief: 'Brief',
  research: 'Job research',
  roles: 'Roles & activities',
  competencies: 'Competencies',
  ladders: 'Level ladders',
}
/** Data order: what each step is built from (roles before competencies). Decides which change leaves a step out of date. */
const STEP_ORDER = Object.keys(FRAC_STEP_TITLES) as FracStep[]
/** The order the Creator shows steps in, as the tabs and tracker do: Competencies before Roles & activities. */
const DISPLAY_ORDER: readonly FracStep[] = ['brief', 'research', 'competencies', 'roles', 'ladders']

const hasOutput: Record<FracStep, (frac: Frac) => boolean> = {
  brief: () => true,
  research: frac => !!frac.research,
  roles: frac => frac.roles.length > 0,
  competencies: frac => frac.competencies.length > 0,
  ladders: frac => frac.competencies.some(c => c.levels !== null),
}

/**
 * The earlier step that changed after `step`'s content, latest first, or null. A step without output, or a FRAC
 * without stamps (older FRACs), is never out of date. ISO stamps compare as strings.
 */
export function changedBefore(frac: Frac, step: FracStep): FracStep | null {
  const at = frac.changedAt ?? {}
  if (!hasOutput[step](frac)) {
    return null
  }
  const own = at[step] ?? ''
  const newer = STEP_ORDER.slice(0, STEP_ORDER.indexOf(step)).filter(s => (at[s] ?? '') > own)
  return newer.sort((a, b) => (at[b] ?? '').localeCompare(at[a] ?? ''))[0] ?? null
}

/** Steps that need a look because an earlier step changed after them, in flow order. */
export function staleSteps(frac: Frac): FracStep[] {
  return DISPLAY_ORDER.filter(step => changedBefore(frac, step))
}

/** "Job research changed after these roles were built. ..." for a step that is out of date. */
function staleHowTo(frac: Frac, step: FracStep, what: string, rerun: string): string {
  const earlier = changedBefore(frac, step)
  return earlier ? `${FRAC_STEP_TITLES[earlier]} changed after ${what}. ${rerun}, or check them and mark them checked.` : ''
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

/** Tracker step number for each job kind (the service names step jobs after the step). Competencies come before roles. */
const JOB_STEP: Record<string, number> = { research: 2, competencies: 3, roles: 4, ladders: 5, check: 6 }

/** Tracker step number for each curStep (0 research, 1 roles, 2 competencies, 3 ladders, 4 check, 5 download). */
const CURRENT_STEP = [2, 4, 3, 5, 6, 6]

/**
 * Builds the six-step tracker for the Creator page: state, evidence from the data,
 * and what can be done now. `job` is the running AI step or expert check, if any; `briefDocs` is how many job
 * descriptions are attached (copied roles are rebuilt when there is one).
 */
export function fracProgress(frac: Frac, job: FracJob | null = null, briefDocs = 0): FracStepProgress[] {
  const s = stats(frac)
  const current = CURRENT_STEP[Math.min(curStep(frac, briefDocs), CURRENT_STEP.length - 1)]
  // A step counts as done only once it is reached: a competency sheet's competencies and ladders wait for research
  const reached = !!frac.research || !!frac.imported
  const copied = copiedRoles(frac)
  const copiedFrom = frac.seededFrom?.name ?? 'the matched position'
  // Copied roles are not this FRAC's roles step: done only once research ran and they are being kept
  const rolesDone = frac.roles.length > 0 && reached && (!copied || rolesKept(frac, briefDocs))
  const compsDone = frac.competencies.length > 0 && reached
  const laddersDone = compsDone && rolesDone && s.ladders === frac.competencies.length
  const fromSheet = !!frac.uploads?.competencies
  const runningStep = job && (job.status === 'queued' || job.status === 'running') ? JOB_STEP[job.kind] ?? 0 : 0
  const running = (n: number) => n === runningStep && job ? job.msg : ''
  const state = (n: number, done: boolean): FracStepState => {
    if (n === runningStep) {
      return 'current'
    }
    if (done) {
      return 'done'
    }
    return n === current ? 'current' : 'todo'
  }

  return [
    {
      number: 1,
      title: 'Brief',
      produces: 'Position, state, scope and documents',
      state: 'done',
      evidence: `${frac.cadre} · ${frac.state}`,
      howTo: 'Edit it on the brief card at any time. A change after research asks for research to be checked again.',
      running: '',
    },
    {
      number: 2,
      title: 'Job research',
      produces: 'JD sources, postings, authorised and not-authorised scope',
      state: changedBefore(frac, 'research') ? 'attention' : state(2, !!frac.research || !!frac.imported),
      evidence: frac.research
        ? `${plural(frac.research.sources.length, 'source')} · ${plural(frac.postings.length, 'posting')}`
        : frac.imported ? `Skipped: imported from ${frac.imported}` : 'No research yet',
      howTo: staleHowTo(frac, 'research', 'this research was done', 'Revise the research with feedback') || (frac.uploads?.sources
        ? 'Research uses your Sources sheet and does not search the web. Review or edit it in the Research tab.'
        : 'Run "Research the job", then review or edit it in the Research tab. Revise with feedback to redo it.'),
      running: running(2),
    },
    {
      number: 3,
      title: 'Competencies',
      produces: 'From your competency sheet, or derived from the activities; typed Domain / Functional / Behavioural',
      state: frac.rolesDirty || changedBefore(frac, 'competencies') ? 'attention' : state(3, compsDone),
      evidence: frac.competencies.length && !reached
        ? `${plural(frac.competencies.length, 'competency', 'competencies')} from your sheet, used after research`
        : frac.competencies.length
        ? `${plural(frac.competencies.length, 'competency', 'competencies')} · D ${s.types.D} / F ${s.types.F} / B ${s.types.B} · ${s.unused} unused`
        : 'No competencies yet',
      howTo: frac.uploads?.competencies
        ? `Uses your competency sheet (${frac.uploads.competencies}), uploaded on the Research tab. The roles step maps each activity `
          + 'to it; after editing activities, run "Map activities to your competencies" again.'
        : frac.rolesDirty
          ? 'Roles changed after competencies were derived. Re-derive competencies, or check the mappings and mark them checked.'
          : staleHowTo(frac, 'competencies', 'these competencies were derived', 'Re-derive competencies')
            || (frac.roles.some(r => r.activities.length)
              ? 'Run "Derive competencies", then edit, add or delete in the Competencies tab.'
              : 'Derived from the activities after Roles & activities, or upload a competency sheet on the Research tab.'),
      running: running(3),
    },
    {
      number: 4,
      title: 'Roles & activities',
      produces: 'Roles from the job, observable activities, posting Yes/No, competency@level',
      state: changedBefore(frac, 'roles') ? 'attention' : state(4, rolesDone),
      evidence: !frac.roles.length
        ? 'No roles yet'
        : copied && !rolesDone
          ? `${plural(frac.roles.length, 'role')} · ${plural(s.activities, 'activity', 'activities')} copied from ${copiedFrom}`
          : `${plural(frac.roles.length, 'role')} · ${plural(s.activities, 'activity', 'activities')} · ${s.unmapped} unmapped`,
      howTo: staleHowTo(frac, 'roles', 'these roles were built', 'Revise the roles with feedback') || rolesHowTo(frac, briefDocs, copiedFrom),
      running: running(4),
    },
    {
      number: 5,
      title: 'Level ladders',
      produces: 'L1–L5 per competency, 2–4 assessable indicators each',
      state: changedBefore(frac, 'ladders') ? 'attention' : state(5, laddersDone),
      evidence: !frac.competencies.length
        ? 'Needs competencies first'
        : fromSheet && !laddersDone && s.ladders
          ? `${s.ladders} of ${frac.competencies.length} ladders in your sheet`
          : `${s.ladders} of ${frac.competencies.length} ladders written`,
      howTo: staleHowTo(frac, 'ladders', 'these ladders were written', 'Rewrite the ladders')
        || 'Run "Write level ladders", then edit any level, or revise one competency with feedback. '
        + '"Preview roles" on this tab shows each role with its competencies and levels.',
      running: running(5),
    },
    {
      number: 6,
      title: 'Expert check & download',
      produces: 'Graded review of this FRAC, then the Excel workbook',
      state: frac.review && frac.reviewStale ? 'attention' : state(6, !!frac.review),
      evidence: reviewEvidence(frac),
      howTo: frac.review && frac.reviewStale
        ? 'The FRAC changed after this check. Re-run the expert check before downloading the checked Excel.'
        : frac.competencies.length
        ? 'Download the draft Excel to check it, run or re-run the check, then download the checked Excel.'
        : 'Needs competencies first.',
      running: running(6),
    },
  ]
}

/** Step 3's how-to: built by the AI, kept from a Roles sheet or a match, or copied and waiting to be rebuilt. */
function rolesHowTo(frac: Frac, briefDocs: number, copiedFrom: string): string {
  if (copiedRoles(frac) && !rolesKept(frac, briefDocs)) {
    return `Copied from ${copiedFrom}. A job description is attached, so "Build roles & activities" rebuilds them from the `
      + 'research and your document. You can also clear them now on the Roles tab.'
  }
  if (copiedRoles(frac) && !frac.research) {
    return `Copied from ${copiedFrom}. Check them after research: clear them on the Roles tab if they do not fit this job.`
  }
  if (rolesGiven(frac)) {
    return `Roles come from ${frac.uploads?.roles ? `your sheet (${frac.uploads.roles})` : copiedFrom}; `
      + 'only roles without activities get them written. Revise with feedback to rebuild them.'
  }
  return 'Run "Build roles & activities", then edit, add, delete or reorder. Activities you add survive a revise.'
}
