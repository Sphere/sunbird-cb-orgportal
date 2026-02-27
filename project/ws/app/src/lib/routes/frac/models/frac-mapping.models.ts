/**
 * Common item shape used in FRAC mapping side-list cards.
 */
export interface FracMappingItem {
  code: string
  title: string
}

/**
 * Lightweight child entry shown inside expanded mapping cards.
 */
export interface FracMappingDetail {
  code: string
  label: string
  levels?: string
}

/**
 * Activity row used in activity mapping list/table views.
 */
export interface FracActivityMappingItem extends FracMappingItem {
  competencyDetails?: FracMappingDetail[]
}

/**
 * Role row used in role mapping list/table views.
 */
export interface FracRoleMappingItem extends FracMappingItem {
  activityDetails?: FracMappingDetail[]
}

/**
 * Position row used in position mapping list/table views.
 */
export interface FracPositionMappingItem extends FracMappingItem {
  roleDetails?: FracMappingDetail[]
}

/**
 * Checkbox state map for mapping tables.
 */
export type FracSelectionMap = Record<string, boolean>
