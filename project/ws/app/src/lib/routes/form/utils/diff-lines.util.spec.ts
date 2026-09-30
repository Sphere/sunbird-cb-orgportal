import { diffLines, toSideBySideRows } from './diff-lines.util'

describe('diffLines', () => {
  it('marks every line unchanged when the texts are identical', () => {
    const result = diffLines('a\nb\nc', 'a\nb\nc')
    expect(result).toEqual([
      { type: 'unchanged', text: 'a' },
      { type: 'unchanged', text: 'b' },
      { type: 'unchanged', text: 'c' },
    ])
  })

  it('marks a single changed line as removed+added, keeping unchanged context', () => {
    const result = diffLines('a\nb\nc', 'a\nx\nc')
    expect(result).toEqual([
      { type: 'unchanged', text: 'a' },
      { type: 'removed', text: 'b' },
      { type: 'added', text: 'x' },
      { type: 'unchanged', text: 'c' },
    ])
  })

  it('marks trailing new lines as added', () => {
    const result = diffLines('a', 'a\nb\nc')
    expect(result).toEqual([
      { type: 'unchanged', text: 'a' },
      { type: 'added', text: 'b' },
      { type: 'added', text: 'c' },
    ])
  })

  it('marks trailing removed lines as removed', () => {
    const result = diffLines('a\nb\nc', 'a')
    expect(result).toEqual([
      { type: 'unchanged', text: 'a' },
      { type: 'removed', text: 'b' },
      { type: 'removed', text: 'c' },
    ])
  })

  it('handles a completely different text as all removed then all added', () => {
    const result = diffLines('a\nb', 'x\ny')
    expect(result.filter(l => l.type === 'removed').map(l => l.text)).toEqual(['a', 'b'])
    expect(result.filter(l => l.type === 'added').map(l => l.text)).toEqual(['x', 'y'])
  })

  it('handles empty inputs', () => {
    expect(diffLines('', '')).toEqual([{ type: 'unchanged', text: '' }])
    expect(diffLines('', 'a')).toEqual([
      { type: 'removed', text: '' },
      { type: 'added', text: 'a' },
    ])
  })
})

describe('toSideBySideRows', () => {
  it('keeps unchanged lines on both sides at the same row', () => {
    const rows = toSideBySideRows(diffLines('a\nb\nc', 'a\nb\nc'))
    expect(rows).toEqual([
      { left: 'a', right: 'a', leftType: 'unchanged', rightType: 'unchanged' },
      { left: 'b', right: 'b', leftType: 'unchanged', rightType: 'unchanged' },
      { left: 'c', right: 'c', leftType: 'unchanged', rightType: 'unchanged' },
    ])
  })

  it('pairs a single removed+added line into one row', () => {
    const rows = toSideBySideRows(diffLines('a\nb\nc', 'a\nx\nc'))
    expect(rows).toEqual([
      { left: 'a', right: 'a', leftType: 'unchanged', rightType: 'unchanged' },
      { left: 'b', right: 'x', leftType: 'removed', rightType: 'added' },
      { left: 'c', right: 'c', leftType: 'unchanged', rightType: 'unchanged' },
    ])
  })

  it('pads the shorter side with an empty cell when removed/added counts differ', () => {
    const rows = toSideBySideRows(diffLines('a', 'a\nb\nc'))
    expect(rows).toEqual([
      { left: 'a', right: 'a', leftType: 'unchanged', rightType: 'unchanged' },
      { left: null, right: 'b', leftType: 'empty', rightType: 'added' },
      { left: null, right: 'c', leftType: 'empty', rightType: 'added' },
    ])
  })

  it('pads the right side with an empty cell when only lines were removed', () => {
    const rows = toSideBySideRows(diffLines('a\nb\nc', 'a'))
    expect(rows).toEqual([
      { left: 'a', right: 'a', leftType: 'unchanged', rightType: 'unchanged' },
      { left: 'b', right: null, leftType: 'removed', rightType: 'empty' },
      { left: 'c', right: null, leftType: 'removed', rightType: 'empty' },
    ])
  })

  it('returns an empty row list for an empty diff', () => {
    expect(toSideBySideRows([])).toEqual([])
  })
})
