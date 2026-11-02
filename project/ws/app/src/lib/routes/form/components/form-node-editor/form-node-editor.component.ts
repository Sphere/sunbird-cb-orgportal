import { Component, EventEmitter, Input, Output } from '@angular/core'
import { FORM_FIELD_TEMPLATES, FORM_JSON_UPLOAD_MAX_BYTES } from '../../constants/form.constants'
import { FormNode, FormNodeEntry, FormNodeKind, buildFormNode, emptyFormNode } from '../../models/form-node.model'

/**
 * Recursively edits an arbitrary JSON-compatible value: primitives get a
 * typed input, arrays get add/remove/reorder over recursively-rendered
 * items, objects get an editable Key + a recursively-rendered Value per
 * entry, with add/remove. References itself in its own template (a
 * standalone: false NgModule-declared component can do this — Angular
 * resolves the selector against the whole module's declarations) so any
 * array or object, at any nesting depth, is reachable and editable through
 * real form controls instead of a raw JSON blob.
 */
@Component({
  standalone: false,
  selector: 'ws-app-form-node-editor',
  templateUrl: './form-node-editor.component.html',
  styleUrls: ['./form-node-editor.component.scss'],
})
export class FormNodeEditorComponent {
  @Input() node!: FormNode
  /** Unique-per-instance prefix for ngModel `name` attributes at this nesting level. */
  @Input() path = 'root'
  /** Set when this node is an object property's value — its Key is then edited inside this node's header. */
  @Input() entry?: FormNodeEntry
  /** Emitted by the header delete button (only rendered when `entry` is set). */
  @Output() remove = new EventEmitter<void>()

  readonly fieldTemplates = FORM_FIELD_TEMPLATES
  selectedTemplateIndex = 0
  /** Comma/newline-separated values for the "Add Values" bulk input on string lists. */
  bulkValues = ''
  /** Inline error from the last JSON upload, cleared on the next successful one. */
  jsonUploadError = ''

  get isEmptyObject(): boolean {
    return this.node.kind === 'object' && (!this.node.entries || this.node.entries.length === 0)
  }

  get isEmptyArray(): boolean {
    return this.node.kind === 'array' && (!this.node.items || this.node.items.length === 0)
  }

  /** Bulk add is offered only on lists that are empty or hold only text items (e.g. `competencyIds`). */
  get canBulkAdd(): boolean {
    return this.node.kind === 'array' && (this.node.items || []).every(item => item.kind === 'string')
  }

  /** Label for the add-button row, naming the object/list the buttons add into. */
  get addLabel(): string {
    const key = (this.entry?.key || '').trim()
    return key ? `Add to ${key}:` : 'Add:'
  }

  isContainer(node: FormNode): boolean {
    return node.kind === 'object' || node.kind === 'array'
  }

  trackByIndex(index: number): number {
    return index
  }

  toggleCollapsed(): void {
    this.node.collapsed = !this.node.collapsed
  }

  // ---- object entries ----

  addEntry(kind: FormNodeKind): void {
    this.node.entries = this.node.entries || []
    this.node.entries.push({ key: '', node: emptyFormNode(kind) })
  }

  removeEntry(index: number): void {
    this.node.entries?.splice(index, 1)
  }

  // ---- array items ----

  addItem(kind: FormNodeKind): void {
    this.node.items = this.node.items || []
    this.node.items.push(emptyFormNode(kind))
  }

  /** Adds an item prefilled from the selected field template — a convenience for arrays of field-like objects. */
  addTemplateItem(): void {
    const template: Record<string, any> = {
      code: '', type: 'text', label: '', placeholder: '', required: false, defaultValue: '',
      ...(this.fieldTemplates[this.selectedTemplateIndex]?.template || {}),
    }
    this.node.items = this.node.items || []
    this.node.items.push({
      kind: 'object',
      entries: Object.entries(template).map(([key, value]) => ({ key, node: this.primitiveNode(value) })),
      collapsed: false,
    })
  }

  /** Splits the bulk input on commas/newlines and appends each non-empty value as a string item. */
  addBulkStrings(): void {
    const values = this.bulkValues.split(/[,\n]/).map(v => v.trim()).filter(v => !!v)
    if (!values.length) {
      return
    }
    const items = this.node.items || []
    values.forEach(value => items.push({ kind: 'string', value }))
    this.node.items = items
    this.bulkValues = ''
  }

  removeItem(index: number): void {
    this.node.items?.splice(index, 1)
  }

  moveItemUp(index: number): void {
    if (!this.node.items || index <= 0) {
      return
    }
    [this.node.items[index - 1], this.node.items[index]] = [this.node.items[index], this.node.items[index - 1]]
  }

  moveItemDown(index: number): void {
    if (!this.node.items || index >= this.node.items.length - 1) {
      return
    }
    [this.node.items[index], this.node.items[index + 1]] = [this.node.items[index + 1], this.node.items[index]]
  }

  // ---- JSON upload ----

  /** Reads a picked .json file and binds its parsed content into this node. */
  onJsonFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) {
      return
    }
    if (file.size > FORM_JSON_UPLOAD_MAX_BYTES) {
      this.jsonUploadError = 'File is too large to import.'
      return
    }
    const reader = new FileReader()
    reader.onload = () => this.applyUploadedJson(String(reader.result || ''), file.name)
    reader.onerror = () => { this.jsonUploadError = 'Could not read the file.' }
    reader.readAsText(file)
  }

  /**
   * Lists get the parsed array's elements appended (or the single value as one item);
   * objects get a parsed object's keys merged in (existing keys replaced), or any
   * other value added as one property keyed by the file name.
   */
  applyUploadedJson(text: string, fileName: string): void {
    let parsed: any
    try {
      parsed = JSON.parse(text)
    } catch {
      this.jsonUploadError = `"${fileName}" is not valid JSON.`
      return
    }
    this.jsonUploadError = ''
    if (this.node.kind === 'array') {
      const items = this.node.items || []
      const values = Array.isArray(parsed) ? parsed : [parsed]
      values.forEach(value => items.push(buildFormNode(value)))
      this.node.items = items
      return
    }
    const entries = this.node.entries || []
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      Object.entries(parsed).forEach(([key, value]) => {
        const existing = entries.find(entry => (entry.key || '').trim() === key)
        if (existing) {
          existing.node = buildFormNode(value)
        } else {
          entries.push({ key, node: buildFormNode(value) })
        }
      })
    } else {
      entries.push({ key: fileName.replace(/\.json$/i, ''), node: buildFormNode(parsed) })
    }
    this.node.entries = entries
  }

  private primitiveNode(value: any): FormNode {
    if (typeof value === 'boolean') {
      return { kind: 'boolean', value }
    }
    if (typeof value === 'number') {
      return { kind: 'number', value }
    }
    return { kind: 'string', value: value ?? '' }
  }
}
