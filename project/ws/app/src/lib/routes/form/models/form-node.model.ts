/**
 * A generic, editable representation of an arbitrary JSON-compatible value —
 * new to this feature, not merged into `form.model.ts`. Lets the Form
 * Configuration editor render a real form control for every value in `data`,
 * at any nesting depth (array, object, or primitive), instead of special-
 * casing a couple of known shapes and falling back to read-only JSON for
 * everything else.
 */

export type FormNodeKind = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array'

export interface FormNodeEntry {
  key: string
  node: FormNode
}

export interface FormNode {
  kind: FormNodeKind
  /** Set for primitive kinds only. */
  value?: any
  /** Set for kind 'object' only — editable Key + recursively-nested Value pairs. */
  entries?: FormNodeEntry[]
  /** Set for kind 'array' only — recursively-nested items, no key. */
  items?: FormNode[]
  /**
   * UI-only: whether an object/array node's children are hidden. Never read
   * by formNodeToValue() — real-world `data` measured at ~1000 nodes and 11
   * levels deep (a form's LAYOUT_BODY.sections), so rendering everything
   * expanded by default would be an unusable wall of inputs.
   */
  collapsed?: boolean
}

/**
 * Converts an arbitrary JSON-compatible value into an editable FormNode tree.
 * `depth` is internal (recursion only) — nodes below the section root start
 * collapsed so a large tree opens compact; expand on demand per node.
 */
export function buildFormNode(value: any, depth = 0): FormNode {
  if (Array.isArray(value)) {
    return { kind: 'array', items: value.map(v => buildFormNode(v, depth + 1)), collapsed: depth >= 1 }
  }
  if (value !== null && typeof value === 'object') {
    return {
      kind: 'object',
      entries: Object.entries(value).map(([key, v]) => ({ key, node: buildFormNode(v, depth + 1) })),
      collapsed: depth >= 1,
    }
  }
  if (typeof value === 'string') {
    return { kind: 'string', value }
  }
  if (typeof value === 'number') {
    return { kind: 'number', value }
  }
  if (typeof value === 'boolean') {
    return { kind: 'boolean', value }
  }
  return { kind: 'null', value: null }
}

/** Serializes an edited FormNode tree back into a plain JSON-compatible value. */
export function formNodeToValue(node: FormNode): any {
  switch (node.kind) {
    case 'array':
      return (node.items || []).map(formNodeToValue)
    case 'object': {
      const result: Record<string, any> = {}
      ;(node.entries || []).forEach(entry => {
        const key = (entry.key || '').trim()
        if (key) {
          result[key] = formNodeToValue(entry.node)
        }
      })
      return result
    }
    case 'number':
      return node.value ?? 0
    case 'boolean':
      return !!node.value
    case 'null':
      return null
    default:
      return node.value ?? ''
  }
}

/** Creates a blank node of the given kind — used by "Add Property"/"Add Item" controls. */
export function emptyFormNode(kind: FormNodeKind): FormNode {
  switch (kind) {
    case 'object':
      // Starts expanded (unlike fetched nested nodes) — it's empty, so there's
      // nothing to hide, and the admin is about to fill it in.
      return { kind: 'object', entries: [], collapsed: false }
    case 'array':
      return { kind: 'array', items: [], collapsed: false }
    case 'number':
      return { kind: 'number', value: 0 }
    case 'boolean':
      return { kind: 'boolean', value: false }
    case 'null':
      return { kind: 'null', value: null }
    default:
      return { kind: 'string', value: '' }
  }
}

/**
 * Recursively finds the first validation issue (empty/duplicate object keys)
 * in a node tree, or null if the whole tree is valid.
 */
export function findFormNodeIssue(node: FormNode): string | null {
  if (node.kind === 'object') {
    const keys = (node.entries || []).map(e => (e.key || '').trim())
    if (keys.some(k => !k)) {
      return 'Every property needs a non-empty Key before saving.'
    }
    if (new Set(keys).size !== keys.length) {
      return 'Property Keys must be unique within the same object before saving.'
    }
    for (const entry of node.entries || []) {
      const issue = findFormNodeIssue(entry.node)
      if (issue) {
        return issue
      }
    }
  }
  if (node.kind === 'array') {
    for (const item of node.items || []) {
      const issue = findFormNodeIssue(item)
      if (issue) {
        return issue
      }
    }
  }
  return null
}
