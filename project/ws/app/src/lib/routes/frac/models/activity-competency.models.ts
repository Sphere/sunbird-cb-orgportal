// ../../../models/activity-competency.models.ts

/** Base activity from FRAC / API transform */
export interface Activity {
  code: string
  title: string
  description?: string
  expanded?: boolean
  /**
   * Only present once mapping is done.
   */
  competencyDetails?: ActivityCompetencyDetail[]
}

/** Single competency from FRAC */
export interface CompetencyLevel {
  level: string // e.g. "L1", "L2"
}

export interface Competency {
  code: string
  label: string
  levels: CompetencyLevel[]
}

/**
 * Competency attached to an Activity.
 * `levels` is the compressed representation:
 * - "L1,L3,L5"
 * - or "L1-L5"
 */
export interface ActivityCompetencyDetail {
  code: string
  label: string
  levels: string
}

/** e.g. "C5013_L3" */
export type SelectedLevelCode = string

/** Map[competencyCode] = ["C1_L1","C1_L3"] */
export type SelectedMap = Record<string, SelectedLevelCode[]>

/** Summary kept in parent for UI + payload */
export interface SelectedCompetencySummary {
  code: string
  label: string
  levels: string // "L1,L3,L5" or "L1-L5"
}

/** Event from competency table when a checkbox changes */
export interface CompetencyCheckChangeEvent {
  code: string
  level: SelectedLevelCode
  checked: boolean
}
