import { FracSeverity, FracSize, FracTriage } from '../models/frac-studio.models'

/** Absolute routes under the home layout. */
export const FRAC_STUDIO_ROUTES = {
  reviewer: '/app/home/frac-studio/reviewer',
  creator: '/app/home/frac-studio/creator',
  creatorDetail: (id: string) => `/app/home/frac-studio/creator/${id}`,
  myFracs: '/app/home/frac-studio/my-fracs',
}

/** How often a running job is polled. */
export const FRAC_STUDIO_POLL_MS = 2000

/** Postings become the FRAC's posting columns; spec 5.2 asks for 1–3. */
export const FRAC_STUDIO_MAX_POSTINGS = 3

/** Research text fields (spec 4.1), one item per line, in the order the editor shows them. */
export const FRAC_STUDIO_RESEARCH_LISTS: readonly { key: 'authorised' | 'notAuthorised' | 'stateContext' | 'assumptions', label: string, hint: string }[] = [
  { key: 'authorised', label: 'Authorised to do', hint: 'What the cadre may do, one item per line' },
  { key: 'notAuthorised', label: 'Not authorised (refer)', hint: 'What they must refer onward, one item per line' },
  { key: 'stateContext', label: 'State context', hint: 'Programmes, cadre names, endemic diseases, languages, portals' },
  { key: 'assumptions', label: 'Assumptions & to verify', hint: 'Start a line with "VERIFY:" for facts to check' },
]

/** Quiet time after the last edit before it is saved (spec 8: the prototype used 1.4 s). */
export const FRAC_STUDIO_AUTOSAVE_MS = 1400

export const FRAC_STUDIO_COMPETENCY_TYPES: readonly string[] = ['Domain', 'Functional', 'Behavioural']

/** Posting cell values (spec 4.1); blank means not yet decided. */
export const FRAC_STUDIO_POSTING_VALUES: readonly { value: string, label: string }[] = [
  { value: '', label: '—' },
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
]

/** Activity source tiers (spec 3, rule 8). */
export const FRAC_STUDIO_SOURCE_TIERS: readonly string[] = [
  '', 'JD', 'Programme guideline', 'Facility standard', 'Inferred – verify',
]

export const FRAC_STUDIO_LEVEL_NAMES: readonly string[] = [
  'L1 Foundational', 'L2 Assisted', 'L3 Independent', 'L4 Complex', 'L5 Expert/Mentor',
]

export const FRAC_STUDIO_NATIONAL_BASELINE = 'India (national baseline)'

/** Brief sizes (spec 5.1). */
export const FRAC_STUDIO_SIZES: readonly { value: FracSize, label: string, detail: string }[] = [
  { value: 'compact', label: 'Compact', detail: '6–8 roles · 4–6 activities each · 16–22 competencies' },
  { value: 'standard', label: 'Standard', detail: '10–14 roles · 5–8 activities each · 28–40 competencies' },
  { value: 'full', label: 'Full', detail: '15–19 roles · 6–9 activities each · 45–60 competencies' },
]

export const FRAC_STUDIO_STATES: readonly string[] = [
  FRAC_STUDIO_NATIONAL_BASELINE,
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]

/** Reviewer context: a review need not be tied to a state (spec 6.2). */
export const FRAC_STUDIO_REVIEW_STATES: readonly string[] = ['Not state-specific', ...FRAC_STUDIO_STATES]

export const FRAC_STUDIO_TRIAGE_LABELS: Record<FracTriage, string> = {
  use: 'Use with minor edits',
  revise: 'Revise',
  rebuild: 'Rebuild from the job',
}

export const FRAC_STUDIO_SEVERITY_LABELS: Record<FracSeverity, string> = {
  B: 'BLOCKER',
  M: 'MAJOR',
  m: 'MINOR',
}

/** Creator steps (spec 5). Steps 2–5 need the AI layer on the service. */
export const FRAC_STUDIO_STEPS: readonly { title: string, needsAi: boolean }[] = [
  { title: 'Brief', needsAi: false },
  { title: 'Job research', needsAi: true },
  { title: 'Roles & activities', needsAi: true },
  { title: 'Competencies', needsAi: true },
  { title: 'Level ladders', needsAi: true },
  { title: 'Expert check & download', needsAi: false },
]

export const FRAC_STUDIO_ACCEPT_XLSX = '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/**
 * What the AI-at-work panel says per job kind: a title, who is working, and what that step does.
 * The live line under it comes from the service; these lines describe the work, they do not track it.
 */
export const FRAC_STUDIO_JOB_COPY: Record<string, { title: string, agents: string, does: readonly string[] }> = {
  research: {
    title: 'Researching the job',
    agents: 'Kaushal',
    does: ['Finding the job descriptions and programme guidelines', 'Naming the postings', 'Separating authorised from refer-onward work', 'Noting what changes for this state'],
  },
  roles: {
    title: 'Building roles & activities',
    agents: 'Kaushal',
    does: ['Drafting roles that cover the whole job', 'Writing observable activities, a few roles at a time', 'Marking each posting Yes or No', 'Tagging each activity with its source'],
  },
  competencies: {
    title: 'Deriving competencies',
    agents: 'Kaushal',
    does: ['Grouping activities into competencies', 'Typing each as Domain, Functional or Behavioural', 'Mapping every activity to one competency and level', 'Checking every competency is used'],
  },
  ladders: {
    title: 'Writing level ladders',
    agents: 'Kaushal & Vidya',
    does: ['Writing L1–L5 with measurable verbs', 'Adding 2–4 assessable indicators per level', 'Checking clinical facts against national guidelines', 'Saving each batch as it finishes'],
  },
  check: {
    title: 'Running the expert check',
    agents: "Rule-based checks, then Vidya's checklist",
    does: ["Counting Bloom's verbs, structure, ladders and coverage", 'Checking scope and outdated terms against the rule tables', "Asking Vidya the fixed scope, accuracy and state questions", 'Keeping only AI flags that quote the file'],
  },
  review: {
    title: 'Reviewing the FRAC',
    agents: "Rule-based checks, then Vidya's checklist",
    does: ['Reading the workbook sheets and mappings', 'Checking scope and outdated terms against the rule tables', "Asking Vidya the fixed scope, accuracy and state questions", 'Keeping only AI flags that quote the file'],
  },
}
