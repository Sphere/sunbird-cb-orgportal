import {
  buildFormNode,
  emptyFormNode,
  findFormNodeIssue,
  formNodeToValue,
} from './form-node.model'

describe('form-node.model', () => {
  describe('buildFormNode', () => {
    it('builds a string node', () => {
      expect(buildFormNode('hello')).toEqual({ kind: 'string', value: 'hello' })
    })

    it('builds a number node', () => {
      expect(buildFormNode(42)).toEqual({ kind: 'number', value: 42 })
    })

    it('builds a boolean node', () => {
      expect(buildFormNode(true)).toEqual({ kind: 'boolean', value: true })
    })

    it('builds a null node', () => {
      expect(buildFormNode(null)).toEqual({ kind: 'null', value: null })
    })

    it('builds a root array node expanded (depth 0)', () => {
      const node = buildFormNode(['a', 'b'])
      expect(node.kind).toBe('array')
      expect(node.collapsed).toBe(false)
      expect(node.items).toEqual([
        { kind: 'string', value: 'a' },
        { kind: 'string', value: 'b' },
      ])
    })

    it('builds a root object node expanded (depth 0)', () => {
      const node = buildFormNode({ a: 1 })
      expect(node.kind).toBe('object')
      expect(node.collapsed).toBe(false)
      expect(node.entries).toEqual([{ key: 'a', node: { kind: 'number', value: 1 } }])
    })

    it('collapses nested object/array nodes below the root (depth >= 1)', () => {
      const node = buildFormNode({ nested: { deep: [1, 2] } })
      const nestedEntry = node.entries?.[0]
      expect(nestedEntry?.node.collapsed).toBe(true)
      const deepEntry = nestedEntry?.node.entries?.[0]
      expect(deepEntry?.node.kind).toBe('array')
      expect(deepEntry?.node.collapsed).toBe(true)
    })

    it('preserves key order and handles mixed nested types', () => {
      const node = buildFormNode({ str: 'x', num: 1, bool: false, nil: null, arr: [1], obj: { a: 1 } })
      expect(node.entries?.map(e => e.key)).toEqual(['str', 'num', 'bool', 'nil', 'arr', 'obj'])
    })
  })

  describe('formNodeToValue', () => {
    it('round-trips primitives', () => {
      expect(formNodeToValue({ kind: 'string', value: 'hi' })).toBe('hi')
      expect(formNodeToValue({ kind: 'number', value: 5 })).toBe(5)
      expect(formNodeToValue({ kind: 'boolean', value: true })).toBe(true)
      expect(formNodeToValue({ kind: 'null', value: null })).toBeNull()
    })

    it('defaults a string node with no value to an empty string', () => {
      expect(formNodeToValue({ kind: 'string' })).toBe('')
    })

    it('defaults a number node with no value to 0', () => {
      expect(formNodeToValue({ kind: 'number' })).toBe(0)
    })

    it('defaults a boolean node with no value to false', () => {
      expect(formNodeToValue({ kind: 'boolean' })).toBe(false)
    })

    it('round-trips an array', () => {
      const node = buildFormNode([1, 'a', true])
      expect(formNodeToValue(node)).toEqual([1, 'a', true])
    })

    it('round-trips a nested object', () => {
      const original = { name: 'x', count: 3, nested: { flag: true, list: ['a', 'b'] } }
      const node = buildFormNode(original)
      expect(formNodeToValue(node)).toEqual(original)
    })

    it('drops object entries whose key is empty or whitespace-only', () => {
      const node = buildFormNode({ a: 1 })
      node.entries!.push({ key: '   ', node: { kind: 'string', value: 'orphan' } })
      expect(formNodeToValue(node)).toEqual({ a: 1 })
    })

    it('trims object keys when serializing', () => {
      const node = { kind: 'object' as const, entries: [{ key: '  a  ', node: { kind: 'string' as const, value: 'v' } }] }
      expect(formNodeToValue(node)).toEqual({ a: 'v' })
    })
  })

  describe('emptyFormNode', () => {
    it('creates an expanded, empty object node', () => {
      expect(emptyFormNode('object')).toEqual({ kind: 'object', entries: [], collapsed: false })
    })

    it('creates an expanded, empty array node', () => {
      expect(emptyFormNode('array')).toEqual({ kind: 'array', items: [], collapsed: false })
    })

    it('creates a blank string node', () => {
      expect(emptyFormNode('string')).toEqual({ kind: 'string', value: '' })
    })

    it('creates a zeroed number node', () => {
      expect(emptyFormNode('number')).toEqual({ kind: 'number', value: 0 })
    })

    it('creates a false boolean node', () => {
      expect(emptyFormNode('boolean')).toEqual({ kind: 'boolean', value: false })
    })

    it('creates a null node', () => {
      expect(emptyFormNode('null')).toEqual({ kind: 'null', value: null })
    })
  })

  describe('findFormNodeIssue', () => {
    it('returns null for a valid tree', () => {
      const node = buildFormNode({ a: 1, b: [1, 2, { c: 'ok' }] })
      expect(findFormNodeIssue(node)).toBeNull()
    })

    it('flags an empty key at the top level', () => {
      const node = buildFormNode({ a: 1 })
      node.entries!.push({ key: '', node: { kind: 'string', value: 'x' } })
      expect(findFormNodeIssue(node)).toBe('Every property needs a non-empty Key before saving.')
    })

    it('flags duplicate keys within the same object', () => {
      const node = buildFormNode({ a: 1 })
      node.entries!.push({ key: 'a', node: { kind: 'string', value: 'dup' } })
      expect(findFormNodeIssue(node)).toBe('Property Keys must be unique within the same object before saving.')
    })

    it('finds an issue nested inside an array', () => {
      const node = buildFormNode({ list: [{ a: 1 }] })
      const nestedObject = node.entries![0].node.items![0]
      nestedObject.entries!.push({ key: '', node: { kind: 'string', value: 'x' } })
      expect(findFormNodeIssue(node)).toBe('Every property needs a non-empty Key before saving.')
    })

    it('finds an issue nested inside an object several levels deep', () => {
      const node = buildFormNode({ a: { b: { c: 1 } } })
      const deepest = node.entries![0].node.entries![0].node
      deepest.entries!.push({ key: '  ', node: { kind: 'string', value: 'x' } })
      expect(findFormNodeIssue(node)).toBe('Every property needs a non-empty Key before saving.')
    })

    it('returns null for a plain array with no object descendants', () => {
      const node = buildFormNode([1, 2, 3])
      expect(findFormNodeIssue(node)).toBeNull()
    })
  })
})
