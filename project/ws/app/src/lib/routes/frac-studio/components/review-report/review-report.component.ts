import { Component, EventEmitter, Input, Output } from '@angular/core'
import { FRAC_STUDIO_LADDER_FIX_USD, FRAC_STUDIO_SEVERITY_LABELS, FRAC_STUDIO_TRIAGE_LABELS } from '../../constants/frac-studio.constants'
import { FracFinding, FracReport } from '../../models/frac-studio.models'
import { normalizeCode } from '../../utils/frac-studio-refs.util'

/** An "Outdated reference: …" finding from the check's outdated-name list. */
const isOutdated = (finding: FracFinding) => finding.title.startsWith('Outdated reference:')

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
  /** Every open finding that names this FRAC's competencies, fixed together in one ladders run. */
  @Output() readonly fixAll = new EventEmitter<FracFinding[]>()
  /** "Replace with …" on an outdated-name finding: a plain text swap in the service, no AI. */
  @Output() readonly replaceOutdated = new EventEmitter<FracFinding>()

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

  /**
   * "Fix these competencies" rewrites ladders, so it is offered only for findings about ladder text: Bloom's verbs, the
   * ladder shape, and scope findings quoting a level. Outdated names (Replace), missing types or competencies
   * (structure, coverage) and state fit ("Does not reflect …") live elsewhere and stay for a hand fix.
   */
  fixable(finding: FracFinding): boolean {
    const codes = this.fixableCodes
    const aboutLadders = finding.check === 'bloom' || finding.check === 'ladder'
      || (finding.check === 'context' && !isOutdated(finding) && !finding.title.startsWith('Does not reflect'))
    return !!codes && !finding.fixed && aboutLadders && finding.refs.some(ref => codes.has(normalizeCode(ref)))
  }

  /** Outdated-name findings whose fix is a plain swap ("Replace with VHSND."): the service replaces the name everywhere. */
  replaceable(finding: FracFinding): boolean {
    return !!this.fixableCodes && !finding.fixed && isOutdated(finding) && /^Replace with /.test(finding.fix)
  }

  /** "Replace with VHSND (no AI)" from the finding's own fix text. */
  replaceLabel(finding: FracFinding): string {
    return `${finding.fix.replace(/\.\s*$/, '')} (no AI)`
  }

  /** Open findings the agent can fix by rewriting the competencies they name. */
  get fixableOpen(): FracFinding[] {
    return (this.report?.findings ?? []).filter(f => this.fixable(f))
  }

  /** Open findings that name no competency (activities, roles, coverage): fixed by hand or with a revise. */
  get handOpen(): number {
    return this.fixableCodes
      ? (this.report?.findings ?? []).filter(f => !f.fixed && !this.fixable(f) && !this.replaceable(f)).length
      : 0
  }

  /** "about $0.10" for rewriting every competency the fixable findings name. */
  get fixAllCost(): string {
    const codes = this.fixableCodes
    if (!codes) {
      return ''
    }
    const named = new Set(this.fixableOpen.flatMap(f => f.refs.map(normalizeCode).filter(code => codes.has(code))))
    return `about $${Math.max(0.01, named.size * FRAC_STUDIO_LADDER_FIX_USD).toFixed(2)}`
  }

  foundBy(finding: FracFinding): string {
    return finding.source === 'computed' ? 'Rule-based check' : 'AI judgement · quoted from the file'
  }

  trackByIndex(index: number): number {
    return index
  }
}
