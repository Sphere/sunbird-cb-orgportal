/**
 * Primitive values that can be rendered inside FRAC table cells.
 */
export type FracTableCellValue = string | number | boolean | null | undefined

/**
 * Generic row model used by FRAC table components.
 */
export type FracTableRow = Record<string, FracTableCellValue>

/**
 * Shared column model for FRAC table components.
 */
export interface FracTableColumn {
  key: string
  label: string
  width?: string
}
