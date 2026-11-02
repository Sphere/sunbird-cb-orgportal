import { Component, EventEmitter, Input, Output } from '@angular/core'
import { FracSaveStatus } from '../../models/frac-studio.models'

const LABELS: Record<FracSaveStatus, string> = {
  idle: 'All changes saved',
  pending: 'Unsaved changes',
  saving: 'Saving…',
  saved: 'All changes saved',
  error: 'Couldn\'t save.',
}

/** Autosave state chip with a Retry button after a failed save. */
@Component({
  selector: 'ws-app-frac-save-status',
  template: `
    <span class="save" [ngClass]="'save-' + status" role="status" aria-live="polite">
      {{ label }}
      <button *ngIf="status === 'error'" type="button" class="retry" (click)="retry.emit()">Retry</button>
    </span>
  `,
  styleUrls: ['./save-status.component.scss'],
  standalone: false,
})
export class SaveStatusComponent {
  @Input() status: FracSaveStatus = 'idle'
  @Output() readonly retry = new EventEmitter<void>()

  get label(): string {
    return LABELS[this.status]
  }
}
