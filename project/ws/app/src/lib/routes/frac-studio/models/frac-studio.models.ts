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
}

export interface FracResearch {
  summary: string
  sourceNotes: string
  sources: FracSource[]
  authorised: string
  notAuthorised: string
  stateContext: string
  assumptions: string
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
  prompt: string
  imported?: string
  codePrefix: string
  postings: FracPosting[]
  research: FracResearch | null
  roles: FracRole[]
  competencies: FracCompetency[]
  rolesDirty: boolean
  review: FracReport | null
}

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

export interface FracBrief {
  cadre: string
  state: string
  size: FracSize
  prompt: string
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
  jobId: string
  warnings: string[]
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
export type FracEditableField = 'postings' | 'roles' | 'competencies' | 'rolesDirty'
