/**
 * Primitive values that can be rendered inside FRAC table cells.
 */
export type FracTableCellValue = string | number | boolean | null | undefined

/**
 * Generic row model used by FRAC table components.
 */
export type FracTableRow = Record<string, any>

/**
 * Common data structure for rows used in FRAC upload/manage tables.
 */
export interface FracUploadRow {
  id?: string
  code?: string
  name?: string
  languageCode?: string
  type?: string
  // Competency specific
  level?: string
  // Allow for other dynamic fields like hierarchy counts
  [key: string]: any
}

/**
 * Shared column model for FRAC table components.
 */
export interface FracTableColumn {
  key: string
  label: string
  width?: string
}
