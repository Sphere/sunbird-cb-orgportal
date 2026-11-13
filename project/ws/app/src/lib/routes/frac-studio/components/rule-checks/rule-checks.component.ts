import { Component, Input } from '@angular/core'
import { FracSheetCheck } from '../../models/frac-studio.models'

/** The expert check's words for each severity. */
const SEVERITY_LABELS: Record<FracSheetCheck['sev'], string> = { B: 'Blocker', M: 'Major', m: 'Minor' }

/**
 * Quick checks on a Creator tab: the expert check's Bloom's verbs and FRAC structure rules, re-run whenever the FRAC
 * is built or changed (GET /rule-checks), so they can be fixed before the expert check. Rule-based, no AI. Read-only.
 */
@Component({
  selector: 'ws-app-frac-rule-checks',
  templateUrl: './rule-checks.component.html',
  styleUrls: ['./rule-checks.component.scss'],
  standalone: false,
})
export class RuleChecksComponent {
  /** This tab's findings only, worst first. */
  @Input() checks: FracSheetCheck[] = []

  severity(check: FracSheetCheck): string {
    return SEVERITY_LABELS[check.sev]
  }

  trackByIndex(index: number): number {
    return index
  }
}
