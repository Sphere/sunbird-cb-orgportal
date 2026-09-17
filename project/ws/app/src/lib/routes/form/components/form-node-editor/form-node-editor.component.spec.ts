import { FormNodeEditorComponent } from './form-node-editor.component'
import { FormNode } from '../../models/form-node.model'

describe('FormNodeEditorComponent', () => {
  let component: FormNodeEditorComponent

  beforeEach(() => {
    component = new FormNodeEditorComponent()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('toggleCollapsed', () => {
    it('flips the collapsed flag on the node', () => {
      component.node = { kind: 'object', entries: [], collapsed: true }
      component.toggleCollapsed()
      expect(component.node.collapsed).toBe(false)
      component.toggleCollapsed()
      expect(component.node.collapsed).toBe(true)
    })
  })

  describe('isEmptyObject / isEmptyArray', () => {
    it('is true for an object node with no entries', () => {
      component.node = { kind: 'object', entries: [] }
      expect(component.isEmptyObject).toBe(true)
      expect(component.isEmptyArray).toBe(false)
    })

    it('is false for an object node with entries', () => {
      component.node = { kind: 'object', entries: [{ key: 'a', node: { kind: 'string', value: 'x' } }] }
      expect(component.isEmptyObject).toBe(false)
    })

    it('is true for an array node with no items', () => {
      component.node = { kind: 'array', items: [] }
      expect(component.isEmptyArray).toBe(true)
      expect(component.isEmptyObject).toBe(false)
    })

    it('is false for an array node with items', () => {
      component.node = { kind: 'array', items: [{ kind: 'string', value: 'x' }] }
      expect(component.isEmptyArray).toBe(false)
    })

    it('is false for a primitive node', () => {
      component.node = { kind: 'string', value: 'x' }
      expect(component.isEmptyObject).toBe(false)
      expect(component.isEmptyArray).toBe(false)
    })
  })

  describe('object entries', () => {
    beforeEach(() => {
      component.node = { kind: 'object', entries: [] }
    })

    it('addEntry appends a blank entry of the requested kind', () => {
      component.addEntry('string')
      expect(component.node.entries).toEqual([{ key: '', node: { kind: 'string', value: '' } }])
    })

    it('addEntry initializes entries when starting undefined', () => {
      component.node = { kind: 'object' }
      component.addEntry('number')
      expect(component.node.entries).toEqual([{ key: '', node: { kind: 'number', value: 0 } }])
    })

    it('removeEntry removes the entry at the given index', () => {
      component.node.entries = [
        { key: 'a', node: { kind: 'string', value: '1' } },
        { key: 'b', node: { kind: 'string', value: '2' } },
      ]
      component.removeEntry(0)
      expect(component.node.entries).toEqual([{ key: 'b', node: { kind: 'string', value: '2' } }])
    })

    it('removeEntry is a no-op when entries is undefined', () => {
      component.node = { kind: 'object' }
      expect(() => component.removeEntry(0)).not.toThrow()
    })
  })

  describe('array items', () => {
    beforeEach(() => {
      component.node = { kind: 'array', items: [] }
    })

    it('addItem appends a blank node of the requested kind', () => {
      component.addItem('boolean')
      expect(component.node.items).toEqual([{ kind: 'boolean', value: false }])
    })

    it('addItem initializes items when starting undefined', () => {
      component.node = { kind: 'array' }
      component.addItem('array')
      expect(component.node.items).toEqual([{ kind: 'array', items: [], collapsed: false }])
    })

    it('removeItem removes the item at the given index', () => {
      component.node.items = [{ kind: 'string', value: 'a' }, { kind: 'string', value: 'b' }]
      component.removeItem(1)
      expect(component.node.items).toEqual([{ kind: 'string', value: 'a' }])
    })

    it('moveItemUp swaps with the previous item', () => {
      const first: FormNode = { kind: 'string', value: 'first' }
      const second: FormNode = { kind: 'string', value: 'second' }
      component.node.items = [first, second]
      component.moveItemUp(1)
      expect(component.node.items).toEqual([second, first])
    })

    it('moveItemUp does nothing at index 0', () => {
      const items: FormNode[] = [{ kind: 'string', value: 'a' }, { kind: 'string', value: 'b' }]
      component.node.items = items
      component.moveItemUp(0)
      expect(component.node.items).toEqual(items)
    })

    it('moveItemDown swaps with the next item', () => {
      const first: FormNode = { kind: 'string', value: 'first' }
      const second: FormNode = { kind: 'string', value: 'second' }
      component.node.items = [first, second]
      component.moveItemDown(0)
      expect(component.node.items).toEqual([second, first])
    })

    it('moveItemDown does nothing at the last index', () => {
      const items: FormNode[] = [{ kind: 'string', value: 'a' }, { kind: 'string', value: 'b' }]
      component.node.items = items
      component.moveItemDown(1)
      expect(component.node.items).toEqual(items)
    })

    it('moveItemUp/Down are no-ops when items is undefined', () => {
      component.node = { kind: 'array' }
      expect(() => component.moveItemUp(1)).not.toThrow()
      expect(() => component.moveItemDown(0)).not.toThrow()
    })
  })

  describe('addTemplateItem', () => {
    beforeEach(() => {
      component.node = { kind: 'array', items: [] }
    })

    it('adds an expanded object item from the "Custom Field" template by default', () => {
      component.selectedTemplateIndex = 0
      component.addTemplateItem()

      expect(component.node.items?.length).toBe(1)
      const item = component.node.items![0]
      expect(item.kind).toBe('object')
      expect(item.collapsed).toBe(false)
      const keys = item.entries?.map(e => e.key)
      expect(keys).toEqual(expect.arrayContaining(['code', 'type', 'label', 'placeholder', 'required', 'defaultValue']))
    })

    it('prefills from a named template and maps required (boolean) to a boolean node', () => {
      const emailIndex = component.fieldTemplates.findIndex(t => t.label === 'Email')
      component.selectedTemplateIndex = emailIndex
      component.addTemplateItem()

      const item = component.node.items![0]
      const codeEntry = item.entries!.find(e => e.key === 'code')
      const requiredEntry = item.entries!.find(e => e.key === 'required')
      expect(codeEntry?.node).toEqual({ kind: 'string', value: 'email' })
      expect(requiredEntry?.node).toEqual({ kind: 'boolean', value: true })
    })
  })

  describe('trackByIndex', () => {
    it('returns the index unchanged', () => {
      expect(component.trackByIndex(3)).toBe(3)
    })
  })
})
