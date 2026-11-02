import { Component, Input } from '@angular/core'
import { FRAC_STUDIO_SEVERITY_LABELS, FRAC_STUDIO_TRIAGE_LABELS } from '../../constants/frac-studio.constants'
import { FracFinding, FracReport } from '../../models/frac-studio.models'

/** Graded review report (spec 6.5). Shared by the Reviewer and the Creator's expert check. */
@Component({
  selector: 'ws-app-frac-review-report',
  templateUrl: './review-report.component.html',
  styleUrls: ['./review-report.component.scss'],
  standalone: false,
})
export class ReviewReportComponent {
  @Input() report: FracReport | null = null

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
    ]
  }

  foundBy(finding: FracFinding): string {
    return finding.source === 'computed' ? 'Computed check' : 'Kaushal & Vidya'
  }

  trackByIndex(index: number): number {
    return index
  }
}
