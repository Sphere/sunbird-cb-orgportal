import { Component, Input } from '@angular/core'
import { FracStepProgress, FracStepState } from '../../utils/frac-studio-progress.util'

const STATE_LABELS: Record<FracStepState, string> = {
  done: 'Done',
  current: 'You are here',
  attention: 'Needs attention',
  todo: 'Not started',
}

/** Six-step progress tracker for one FRAC: state, evidence from its data, and what to do next. */
@Component({
  selector: 'ws-app-frac-progress',
  templateUrl: './frac-progress.component.html',
  styleUrls: ['./frac-progress.component.scss'],
  standalone: false,
})
export class FracProgressComponent {
  @Input() steps: FracStepProgress[] = []

  get doneCount(): number {
    return this.steps.filter(s => s.state === 'done').length
  }

  get percent(): number {
    return this.steps.length ? Math.round((this.doneCount / this.steps.length) * 100) : 0
  }

  stateLabel(state: FracStepState): string {
    return STATE_LABELS[state]
  }

  trackByNumber(_index: number, step: FracStepProgress): number {
    return step.number
  }
}
