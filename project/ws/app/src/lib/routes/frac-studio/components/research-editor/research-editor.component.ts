import { Component, EventEmitter, Input, Output } from '@angular/core'
import { FRAC_STUDIO_MAX_POSTINGS, FRAC_STUDIO_RESEARCH_LISTS } from '../../constants/frac-studio.constants'
import { FracPosting, FracResearch, FracRole, FracSource } from '../../models/frac-studio.models'
import {
  addPosting,
  addSource,
  removeLastPosting,
  removeSource,
  updatePosting,
  updateSource,
} from '../../utils/frac-studio-edit.util'

/**
 * Job research editor (spec 5.2), filled in by hand until the AI research step exists.
 * Postings live on the FRAC beside research; removing one also clears its column from the
 * activities, so that change emits both postings and roles.
 */
@Component({
  selector: 'ws-app-frac-research-editor',
  templateUrl: './research-editor.component.html',
  styleUrls: ['./research-editor.component.scss'],
  standalone: false,
})
export class ResearchEditorComponent {
  @Input() research!: FracResearch
  @Input() postings: FracPosting[] = []
  @Input() roles: FracRole[] = []
  @Output() readonly researchChange = new EventEmitter<FracResearch>()
  @Output() readonly postingsChange = new EventEmitter<{ postings: FracPosting[], roles?: FracRole[] }>()

  readonly lists = FRAC_STUDIO_RESEARCH_LISTS
  readonly maxPostings = FRAC_STUDIO_MAX_POSTINGS
  confirmRemovePosting = false

  setText(key: keyof Omit<FracResearch, 'sources'>, value: string): void {
    this.researchChange.emit({ ...this.research, [key]: value })
  }

  setPostingLabel(index: number, label: string): void {
    this.postingsChange.emit({ postings: updatePosting(this.postings, index, label) })
  }

  addPosting(): void {
    this.postingsChange.emit({ postings: addPosting(this.postings) })
  }

  /** Removes the last posting and its Yes/No values from every activity. */
  removeLastPosting(): void {
    this.confirmRemovePosting = false
    this.postingsChange.emit(removeLastPosting(this.postings, this.roles))
  }

  get lastPosting(): FracPosting | undefined {
    return this.postings[this.postings.length - 1]
  }

  addSource(): void {
    this.researchChange.emit(addSource(this.research))
  }

  setSource(index: number, patch: Partial<FracSource>): void {
    this.researchChange.emit(updateSource(this.research, index, patch))
  }

  removeSource(index: number): void {
    this.researchChange.emit(removeSource(this.research, index))
  }

  trackByIndex(index: number): number {
    return index
  }
}
