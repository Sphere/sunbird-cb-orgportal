import { Component, Input, OnChanges, OnDestroy } from '@angular/core'
import { FRAC_STUDIO_JOB_COPY } from '../../constants/frac-studio.constants'
import { FracJob } from '../../models/frac-studio.models'

/**
 * AI-at-work panel for a running job (AI step, expert check, review): who is working, what the step
 * does, the live message from the service, x of y with a bar (a scanning sweep when there is no
 * count), and elapsed time. Collapses to a one-line result when the job finishes or fails.
 */
@Component({
  selector: 'ws-app-frac-job-progress',
  templateUrl: './job-progress.component.html',
  styleUrls: ['./job-progress.component.scss'],
  standalone: false,
})
export class JobProgressComponent implements OnChanges, OnDestroy {
  @Input() job: FracJob | null = null

  /** Seconds since this panel saw the job start running. */
  elapsed = 0

  private startedAt = 0
  private timer: ReturnType<typeof setInterval> | null = null

  get percent(): number {
    return this.job && this.job.total > 0 ? Math.round((this.job.done / this.job.total) * 100) : 0
  }

  get running(): boolean {
    return !!this.job && (this.job.status === 'queued' || this.job.status === 'running')
  }

  get copy(): { title: string, agents: string, does: readonly string[] } {
    return FRAC_STUDIO_JOB_COPY[this.job?.kind ?? ''] ?? { title: 'Working', agents: 'FRAC Studio', does: [] }
  }

  get elapsedLabel(): string {
    const m = Math.floor(this.elapsed / 60)
    const s = this.elapsed % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  /** Model calls made so far, when the service reports them. */
  get calls(): number {
    return this.job?.usage?.calls ?? 0
  }

  /** "12.4k tokens in · 3.1k out · $0.05", marked "est." when the mock priced it at Claude rates. */
  get usageLabel(): string {
    const u = this.job?.usage
    if (!u) {
      return ''
    }
    const k = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`
    const searches = u.webSearches ? ` · ${u.webSearches} web search${u.webSearches === 1 ? '' : 'es'}` : ''
    return `${k(u.inputTokens)} tokens in · ${k(u.outputTokens)} out${searches} · ${u.estimated ? 'est. ' : ''}$${u.costUsd.toFixed(2)}`
  }

  ngOnChanges(): void {
    if (this.running && !this.timer) {
      this.startedAt = Date.now()
      this.elapsed = 0
      this.timer = setInterval(() => this.elapsed = Math.floor((Date.now() - this.startedAt) / 1000), 1000)
    } else if (!this.running) {
      this.stopTimer()
    }
  }

  ngOnDestroy(): void {
    this.stopTimer()
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}
