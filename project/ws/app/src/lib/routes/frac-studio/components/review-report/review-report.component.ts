import { Component, EventEmitter, Input, Output } from '@angular/core'
import { FRAC_STUDIO_SEVERITY_LABELS, FRAC_STUDIO_TRIAGE_LABELS } from '../../constants/frac-studio.constants'
import { FracFinding, FracReport } from '../../models/frac-studio.models'
import { normalizeCode } from '../../utils/frac-studio-refs.util'

/** Graded review report (spec 6.5). Shared by the Reviewer and the Creator's expert check. */
@Component({
  selector: 'ws-app-frac-review-report',
  templateUrl: './review-report.component.html',
  styleUrls: ['./review-report.component.scss'],
  standalone: false,
})
export class ReviewReportComponent {
  @Input() report: FracReport | null = null
  /** Normalised competency codes that can be fixed from here (the Creator); null in the Reviewer. */
  @Input() fixableCodes: Set<string> | null = null
  @Input() canFix = false
  @Output() readonly fixFinding = new EventEmitter<FracFinding>()

  readonly severityLabels = FRAC_STUDIO_SEVERITY_LABELS

  get triageLabel(): string {
    return this.report ? FRAC_STUDIO_TRIAGE_LABELS[this.report.triage] : ''
  }

  /** Stats row shown under the summary. */
  get statItems(): { label: string, value: number }[] {
    const s = this.report?.stats
    if (!s) {
      return []
    }
    return [
      { label: 'Roles', value: s.roles },
      { label: 'Activities', value: s.activities },
      { label: 'Competencies', value: s.competencies },
      { label: 'Indicators', value: s.indicators },
      { label: 'Domain', value: s.D },
      { label: 'Functional', value: s.F },
      { label: 'Behavioural', value: s.B },
      ...(s.kcm ? [{ label: 'KCM format', value: s.kcm }] : []),
    ]
  }

  /** Where the findings came from (rules r3 §8): rule-based ones repeat exactly, AI ones carry a quote. */
  get provenance(): string {
    const findings = this.report?.findings ?? []
    const ruleBased = findings.filter(f => f.source === 'computed').length
    const ai = findings.length - ruleBased
    return `${ruleBased} rule-based ${ruleBased === 1 ? 'finding' : 'findings'} (the same on every run) · `
      + `${ai} AI ${ai === 1 ? 'judgement' : 'judgements'}, each backed by a quote`
  }

  /** Open findings that cite at least one competency of this FRAC get "Fix these competencies". */
  fixable(finding: FracFinding): boolean {
    const codes = this.fixableCodes
    return !!codes && !finding.fixed && finding.refs.some(ref => codes.has(normalizeCode(ref)))
  }

  foundBy(finding: FracFinding): string {
    return finding.source === 'computed' ? 'Rule-based check' : 'AI judgement · quoted from the file'
  }

  trackByIndex(index: number): number {
    return index
  }
}
