import { FracEntityUploadOrchestratorService } from '../services/frac-entity-upload-orchestrator.service'
import { FracUploadRow } from '../models/frac-table.models'

/**
 * Helper to track changes in a table compared to its baseline state.
 */
export class FracEditTracker {
  private baselineTableSignature = ''
  private baselineRowSignatureByCode = new Map<string, string>()
  private baselineCaptured = false

  constructor(private readonly uploadOrchestrator: FracEntityUploadOrchestratorService) { }

  /**
   * Captures the current table state as the baseline for future comparisons.
   */
  captureBaseline(data: FracUploadRow[]): void {
    const baseline = this.uploadOrchestrator.captureBaselineState(data as Array<Record<string, unknown>>)
    this.baselineTableSignature = baseline.tableSignature
    this.baselineRowSignatureByCode = baseline.rowSignatureByCode
    this.baselineCaptured = true
  }

  /**
   * Checks if the entire table has any changes compared to the baseline.
   */
  hasChanges(data: FracUploadRow[]): boolean {
    if (!this.baselineCaptured) {
      return false
    }
    return this.uploadOrchestrator.computeTableSignature(data as Array<Record<string, unknown>>) !== this.baselineTableSignature
  }

  /**
   * Checks if a single row has changed compared to its baseline state.
   */
  isRowChanged(row: FracUploadRow): boolean {
    const code = (row?.code ?? '').toString().trim()
    if (!code) {
      return true
    }

    const baselineRowSignature = this.baselineRowSignatureByCode.get(code)
    const currentSignature = this.uploadOrchestrator.getRowSignature(row)
    return baselineRowSignature !== currentSignature
  }

  /**
   * Filters the provided rows to only include those that have changed.
   */
  getChangedRows(rows: FracUploadRow[]): FracUploadRow[] {
    return (rows || []).filter(row => this.isRowChanged(row))
  }
}
