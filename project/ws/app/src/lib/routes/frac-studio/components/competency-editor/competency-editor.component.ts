import { Component, EventEmitter, Input, Output } from '@angular/core'
import { FRAC_STUDIO_COMPETENCY_TYPES } from '../../constants/frac-studio.constants'
import { FracCompetency } from '../../models/frac-studio.models'
import { addCompetency, removeCompetency, updateCompetency } from '../../utils/frac-studio-edit.util'
import { normalizeCode } from '../../utils/frac-studio-refs.util'

/**
 * Competencies editor (spec 5.4 + gap 7): editable table, D/F/B counters and a computed
 * "Used by" column. Emits a new competencies array on every change.
 */
@Component({
  selector: 'ws-app-frac-competency-editor',
  templateUrl: './competency-editor.component.html',
  styleUrls: ['./competency-editor.component.scss'],
  standalone: false,
})
export class CompetencyEditorComponent {
  @Input() competencies: FracCompetency[] = []
  /** Competency code → activity codes mapping to it. */
  @Input() usedBy = new Map<string, string[]>()
  @Input() prefix = 'C'
  @Output() readonly competenciesChange = new EventEmitter<FracCompetency[]>()

  readonly types = FRAC_STUDIO_COMPETENCY_TYPES
  confirmDelete: number | null = null

  get typeCounts(): { label: string, value: number }[] {
    const count = (letter: string) => this.competencies.filter(c => c.type.trim().charAt(0).toUpperCase() === letter).length
    return [
      { label: 'Domain', value: count('D') },
      { label: 'Functional', value: count('F') },
      { label: 'Behavioural', value: count('B') },
    ]
  }

  usedByOf(competency: FracCompetency): string[] {
    return this.usedBy.get(normalizeCode(competency.code)) ?? []
  }

  set(index: number, patch: Partial<FracCompetency>): void {
    this.competenciesChange.emit(updateCompetency(this.competencies, index, patch))
  }

  add(): void {
    this.competenciesChange.emit(addCompetency(this.competencies, this.prefix))
  }

  remove(index: number): void {
    this.confirmDelete = null
    this.competenciesChange.emit(removeCompetency(this.competencies, index))
  }

  trackByIndex(index: number): number {
    return index
  }
}
