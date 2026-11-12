import { Component, EventEmitter, Input, Output } from '@angular/core'
import { FracDocumentKind } from '../../models/frac-studio.models'

/** One file shown in an upload slot: an attached document, or a file picked before the FRAC exists. */
export interface FracUploadItem {
  key: string
  name: string
  detail: string
  warnings: string[]
}

/** File types per kind; the service checks the same extensions. */
const ACCEPT: Record<FracDocumentKind, string> = {
  brief: '.pdf,.docx,.txt,.md',
  roles: '.xlsx,.csv',
  competencies: '.xlsx,.csv',
  sources: '.xlsx,.csv',
}

/**
 * An upload slot (review decisions, Nov 2026): a job description / government order for research, or a
 * standard Roles, Competencies or Sources sheet that a step then uses instead of the AI. Shows what is attached,
 * a "Download template" link and the upload button; the page does the API calls.
 */
@Component({
  selector: 'ws-app-frac-document-upload',
  templateUrl: './document-upload.component.html',
  styleUrls: ['./document-upload.component.scss'],
  standalone: false,
})
export class DocumentUploadComponent {
  @Input() kind: FracDocumentKind = 'brief'
  @Input() title = ''
  @Input() hint = ''
  @Input() items: FracUploadItem[] = []
  /** Most files the slot holds; one for a sheet (a new upload replaces it). */
  @Input() max = 1
  @Input() disabled = false
  @Input() busy = false
  /** What the attached sheet does now, e.g. "The Roles step uses this sheet instead of the AI." */
  @Input() inUse = ''

  @Output() readonly pick = new EventEmitter<File>()
  @Output() readonly remove = new EventEmitter<string>()
  @Output() readonly template = new EventEmitter<void>()

  get accept(): string {
    return ACCEPT[this.kind]
  }

  get full(): boolean {
    return this.max > 1 && this.items.length >= this.max
  }

  get uploadLabel(): string {
    if (this.busy) {
      return 'Uploading…'
    }
    return this.kind === 'brief' ? 'Add document' : this.items.length ? 'Replace sheet' : 'Upload sheet'
  }

  onFile(input: HTMLInputElement): void {
    const file = input.files?.[0]
    input.value = ''
    if (file) {
      this.pick.emit(file)
    }
  }

  trackByKey(_: number, item: FracUploadItem): string {
    return item.key
  }
}
