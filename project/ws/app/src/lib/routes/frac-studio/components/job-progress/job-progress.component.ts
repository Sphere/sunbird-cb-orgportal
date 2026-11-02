import { Component, Input } from '@angular/core'
import { FracJob } from '../../models/frac-studio.models'

/** Progress line for a running job: message, x of y with a bar, or the error. */
@Component({
  selector: 'ws-app-frac-job-progress',
  templateUrl: './job-progress.component.html',
  styleUrls: ['./job-progress.component.scss'],
  standalone: false,
})
export class JobProgressComponent {
  @Input() job: FracJob | null = null

  get percent(): number {
    return this.job && this.job.total > 0 ? Math.round((this.job.done / this.job.total) * 100) : 0
  }

  get running(): boolean {
    return !!this.job && (this.job.status === 'queued' || this.job.status === 'running')
  }
}
