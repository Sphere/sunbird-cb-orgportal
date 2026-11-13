// Typed mirror of the frac-studio-service contracts (spec section 4 and the /v1 API).

export type FracSeverity = 'B' | 'M' | 'm'
export type FracCheckKey = 'bloom' | 'structure' | 'ladder' | 'context' | 'coverage'
export type FracTriage = 'use' | 'revise' | 'rebuild'
export type FracSize = 'compact' | 'standard' | 'full'
export type FracJobStatus = 'queued' | 'running' | 'done' | 'error'
export type FracReviewKind = 'upload' | 'expert-check'

export interface FracLevel {
  label: string
  desc: string
}

export interface FracPosting {
  key: string
  label: string
}

export interface FracSource {
  title: string
  issuer: string
  year: string
  use: string
  tier: string
  /** Link opened by "View source": a page the research search retrieved, or one the team typed. */
  url?: string
}

/** The parts of research that can come from the team's documents or from the agent. */
export type ResearchField = 'cadreFull' | 'summary' | 'postings' | 'authorised' | 'notAuthorised' | 'stateContext' | 'sources'

export interface FracResearch {
  summary: string
  sourceNotes: string
  sources: FracSource[]
  authorised: string
  notAuthorised: string
  stateContext: string
  assumptions: string
  /** Set by research when the team attached documents: what was read from them and what the agent researched. */
  origin?: { documents: ResearchField[], agent: ResearchField[] }
}

export interface FracActivity {
  code: string
  text: string
  postings: Record<string, string>
  source: string
  tier: string
  comp: string
}

export interface FracRole {
  code: string
  title: string
  source: string
  activities: FracActivity[]
}

export interface FracCompetency {
  code: string
  label: string
  description: string
  type: string
  area: string
  kcm: string
  levels: FracLevel[] | null
}

export interface FracStats {
  roles: number
  activities: number
  competencies: number
  indicators: number
  B: number
  F: number
  D: number
  other: number
  /** KCM-format competencies (themes, no job ladder), counted apart from the laddered ones. */
  kcm?: number
}

export interface FracFinding {
  check: FracCheckKey
  sev: FracSeverity
  title: string
  detail: string
  refs: string[]
  fix: string
  source: 'computed' | 'agent'
  fixed?: boolean
}

export interface FracCheckSummary {
  key: FracCheckKey
  name: string
  n: number
  status: string
  cls: 'blocker' | 'major' | 'minor' | 'pass'
}

export interface FracReport {
  title: string
  cadre: string
  state: string
  at: string
  stats: FracStats
  verdict: string
  triage: FracTriage
  summary: string
  checks: FracCheckSummary[]
  findings: FracFinding[]
  strengths: string[]
  /** Review engine version, e.g. "r3". */
  engine?: string
  /** Hash of the file, context and rules; the same fingerprint gives the same review. */
  fingerprint?: string
}

export interface Frac {
  id: string
  createdAt: string
  updatedAt: string
  ownerId: string
  step: number
  cadre: string
  cadreFull: string
  state: string
  size: FracSize
  /** "agent": the research step chose the size (the brief no longer asks); missing or "team" on older FRACs. */
  sizeBy?: 'agent' | 'team'
  sizeReason?: string
  prompt: string
  imported?: string
  /** The earlier FRAC or Positions entry this FRAC started from (position matching). */
  seededFrom?: FracSeed
  /** Standard sheets in use, by kind, with the file name; that step uses the sheet instead of the AI. */
  uploads?: Partial<Record<FracSheetKind, string>>
  codePrefix: string
  postings: FracPosting[]
  research: FracResearch | null
  roles: FracRole[]
  competencies: FracCompetency[]
  rolesDirty: boolean
  review: FracReport | null
  /** Set by the service when the content changed after the expert check; the next check clears it. */
  reviewStale?: boolean
  /** The agent's last "Check roles against the job description" on the Roles tab; out of date when changedAt.roles is later. */
  rolesCheck?: FracRolesCheck
  /**
   * Set by the service: when each step's content last changed (an edit, an AI run, a sheet upload) or was marked
   * checked. A step with output needs attention when an earlier step changed after it. Missing on older FRACs.
   */
  changedAt?: Partial<Record<FracStep, string>>
}

/** A Creator step that can go out of date when an earlier step changes. */
export type FracStep = 'brief' | 'research' | 'roles' | 'competencies' | 'ladders'

/** A PATCH body: changed FRAC fields, plus the steps the team marked checked. */
export type FracEdits = Partial<Frac> & { checked?: FracStep[], clearCopiedRoles?: true }

export interface FracSummary {
  id: string
  cadre: string
  state: string
  step: number
  imported: string | null
  counts: { roles: number, activities: number, competencies: number }
  worst: FracSeverity | null
  updatedAt: string
}

/** Standard sheets a team can upload in place of an AI step. */
export type FracSheetKind = 'roles' | 'competencies' | 'sources'
/** "brief": a job description or government order for research. */
export type FracDocumentKind = 'brief' | FracSheetKind

export interface FracSeed {
  from: 'frac' | 'positions'
  ref: string
  name: string
  /** True while the roles are still the copied set; missing on older FRACs (counts as true). */
  withRoles?: boolean
}

/** Position matching on the brief: an earlier FRAC to copy, or a Positions-master entry with its roles. */
export type FracSeedRequest =
  | { from: 'frac', fracId: string, withRoles: boolean }
  | { from: 'positions', code: string, name: string, roles: { title: string, activities: string[] }[] }

export interface FracBrief {
  cadre: string
  state: string
  prompt: string
  seed?: FracSeedRequest
}

/** GET /fracs/match: the owner's earlier FRAC for the same position. */
export interface FracMatch {
  id: string
  cadre: string
  state: string
  postings: string[]
  roleTitles: string[]
  counts: { roles: number, activities: number }
  updatedAt: string
}

/** A document attached to a FRAC (the extracted text stays on the service). */
/** One problem the agent found in the roles and activities ("Check roles against the job description"). */
export interface FracRoleFinding {
  kind: 'missing' | 'outside-scope' | 'posting' | 'duplicate' | 'unclear'
  /** Role code, or '' for a duty no role covers yet. */
  role: string
  activity: string
  note: string
  suggestion: string
}

export interface FracRolesCheck {
  at: string
  summary: string
  findings: FracRoleFinding[]
}

/** A rule-based expert-check finding about an uploaded sheet, worked out at upload (no AI). */
export interface FracSheetCheck {
  check: string
  /** B blocker, M major, m minor, as in the expert check. */
  sev: 'B' | 'M' | 'm'
  title: string
  detail: string
  fix: string
  refs: string[]
}

/** A quick check on a Creator tab while the FRAC is built (Bloom's verbs, FRAC structure); rule-based, no AI. */
export interface FracQuickCheck extends FracSheetCheck {
  tab: 'roles' | 'competencies' | 'ladders'
}

/** What an import read from a sheet. The rows are kept (sheets uploaded from 13 Nov 2026) so the sheet can be re-applied. */
export interface FracDocumentParsed {
  counts: Record<string, number>
  warnings: string[]
  roles?: FracRole[]
  postings?: FracPosting[]
  competencies?: FracCompetency[]
  sources?: FracSource[]
  /** The expert check's rule-based findings about this sheet's rows (roles and competencies sheets, from 13 Nov 2026). */
  checks?: FracSheetCheck[]
}

export interface FracDocument {
  id: string
  fracId: string
  kind: FracDocumentKind
  filename: string
  mime: string
  bytes: number
  chars: number
  parsed: FracDocumentParsed | null
  createdAt: string
}

export interface FracReviewContext {
  cadre?: string
  state?: string
  notes?: string
}

export interface FracReviewSummary {
  id: string
  kind: FracReviewKind
  title: string
  cadre: string
  state: string
  triage: FracTriage | null
  worst: FracSeverity | null
  fracId: string | null
  createdAt: string
}

export interface FracReviewDetail {
  report: FracReport | null
  ctx: FracReviewContext
  kind: FracReviewKind
}

export interface FracStartReviewResponse {
  reviewId: string
  /** null when the same file and context were reviewed before (fromCache) */
  jobId: string | null
  warnings: string[]
  fromCache: boolean
  /** When the saved review was made; set with fromCache. */
  reviewedAt?: string
}

export interface FracJob {
  status: FracJobStatus
  msg: string
  done: number
  total: number
  error: string | null
  /** Stable code for `error`, e.g. JOB_INTERRUPTED when the service restarted mid-step. */
  errorCode?: string | null
  kind: string
  targetId: string | null
  /** Model spend so far: calls, tokens and cost (0 on the mock provider). */
  usage?: FracJobUsage | null
}

export interface FracJobUsage {
  calls: number
  inputTokens: number
  outputTokens: number
  /** Web searches the research step ran (billed per search). */
  webSearches?: number
  costUsd: number
  /** 1 when the cost is an estimate at Claude prices (the mock), not a real bill. */
  estimated?: number
}

/** The AI steps the service runs as jobs (spec 5.2–5.5); the job's `kind` is the step name. */
export type FracGenStep = 'research' | 'roles' | 'competencies' | 'ladders'

/** Revise feedback for a step; ladders can be limited to some competency codes. */
export interface FracStepBody {
  feedback?: string
  codes?: string[]
}

export interface FracDownload {
  blob: Blob
  filename: string
}

export interface FracVersion {
  id: number
  fracId: string
  step: number
  reason: string
  createdAt: string
}

export type FracSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

/** Top-level FRAC fields the Creator editors change and autosave. */
export type FracEditableField = 'cadre' | 'cadreFull' | 'state' | 'prompt' | 'research' | 'postings' | 'roles' | 'competencies' | 'rolesDirty'
