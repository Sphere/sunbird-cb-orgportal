import { Component, EventEmitter, Input, Output } from '@angular/core'
import { FRAC_STUDIO_LEVEL_NAMES } from '../../constants/frac-studio.constants'
import { FracCompetency, FracLevel } from '../../models/frac-studio.models'
import { emptyLadder, updateCompetency, updateLevel } from '../../utils/frac-studio-edit.util'

/**
 * Level ladders editor (spec 5.5): one collapsible card per competency with L1–L5 label and
 * indicators. Emits a new competencies array on every change.
 */
@Component({
  selector: 'ws-app-frac-ladder-editor',
  templateUrl: './ladder-editor.component.html',
  styleUrls: ['./ladder-editor.component.scss'],
  standalone: false,
})
export class LadderEditorComponent {
  @Input() competencies: FracCompetency[] = []
  /** False while a step runs or edits are unsaved; disables "Revise". */
  @Input() canRevise = false
  @Output() readonly competenciesChange = new EventEmitter<FracCompetency[]>()
  /** Asks the page to rewrite one competency's ladder with AI; emits its code. */
  @Output() readonly revise = new EventEmitter<string>()

  readonly levelNames = FRAC_STUDIO_LEVEL_NAMES
  /** Codes of the cards that are open. */
  readonly open = new Set<string>()

  get written(): number {
    return this.competencies.filter(c => c.levels !== null).length
  }

  toggle(code: string): void {
    if (this.open.has(code)) {
      this.open.delete(code)
    } else {
      this.open.add(code)
    }
  }

  /** Levels with any content, out of five. */
  filled(levels: FracLevel[] | null): number {
    return (levels ?? []).filter(l => l.label.trim()).length
  }

  addLadder(index: number): void {
    this.open.add(this.competencies[index].code)
    this.competenciesChange.emit(updateCompetency(this.competencies, index, { levels: emptyLadder() }))
  }

  setLevel(index: number, level: number, patch: Partial<FracLevel>): void {
    this.competenciesChange.emit(updateLevel(this.competencies, index, level, patch))
  }

  trackByIndex(index: number): number {
    return index
  }
}
