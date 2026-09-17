import { Component, Input } from '@angular/core'
import { FORM_FIELD_TEMPLATES } from '../../constants/form.constants'
import { FormNode, FormNodeKind, emptyFormNode } from '../../models/form-node.model'

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
  selector: 'app-form-node-editor',
  templateUrl: './form-node-editor.component.html',
  styleUrls: ['./form-node-editor.component.scss'],
})
export class FormNodeEditorComponent {
  @Input() node!: FormNode
  /** Unique-per-instance prefix for ngModel `name` attributes at this nesting level. */
  @Input() path = 'root'

  readonly fieldTemplates = FORM_FIELD_TEMPLATES
  selectedTemplateIndex = 0

  get isEmptyObject(): boolean {
    return this.node.kind === 'object' && (!this.node.entries || this.node.entries.length === 0)
  }

  get isEmptyArray(): boolean {
    return this.node.kind === 'array' && (!this.node.items || this.node.items.length === 0)
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
