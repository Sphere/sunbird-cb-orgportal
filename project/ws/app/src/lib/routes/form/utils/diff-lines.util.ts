/**
 * Line-level diff for the Preview Before Save dialog — new to this feature,
 * not merged into any existing model/util file.
 */

export type DiffLineType = 'added' | 'removed' | 'unchanged'

export interface DiffLine {
  type: DiffLineType
  text: string
}

/**
 * Max combined line count (old + new) the LCS diff below will run over —
 * it's quadratic in time and space, so callers should gate larger inputs
 * behind this and fall back to showing both versions un-diffed instead.
 */
export const DIFF_LINE_LIMIT = 4000

/**
 * Classic LCS-based line diff (same algorithm family as `diff`/Myers,
 * simplified — no dependency added since this repo doesn't already have one
 * as a direct dependency). Quadratic time/space in line count; keep inputs
 * under DIFF_LINE_LIMIT.
 */
export function diffLines(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const oldLen = oldLines.length
  const newLen = newLines.length

  const lcs: number[][] = Array.from({ length: oldLen + 1 }, () => new Array(newLen + 1).fill(0))
  for (let i = oldLen - 1; i >= 0; i--) {
    for (let j = newLen - 1; j >= 0; j--) {
      lcs[i][j] = oldLines[i] === newLines[j]
        ? lcs[i + 1][j + 1] + 1
        : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }

  const result: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < oldLen && j < newLen) {
    if (oldLines[i] === newLines[j]) {
      result.push({ type: 'unchanged', text: oldLines[i] })
      i += 1
      j += 1
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      result.push({ type: 'removed', text: oldLines[i] })
      i += 1
    } else {
      result.push({ type: 'added', text: newLines[j] })
      j += 1
    }
  }
  while (i < oldLen) {
    result.push({ type: 'removed', text: oldLines[i] })
    i += 1
  }
  while (j < newLen) {
    result.push({ type: 'added', text: newLines[j] })
    j += 1
  }
  return result
}

export type SideBySideCellType = 'unchanged' | 'removed' | 'added' | 'empty'

export interface SideBySideRow {
  left: string | null
  right: string | null
  leftType: SideBySideCellType
  rightType: SideBySideCellType
}

/**
 * Pairs a unified diffLines() sequence into side-by-side before/after rows —
 * unchanged lines appear on both sides at the same row; a run of removed
 * lines is paired index-wise against the following run of added lines
 * (padding the shorter side with an empty cell), which is the standard
 * approach split-diff views use since line-level diffing doesn't otherwise
 * know which removed line "became" which added one.
 */
export function toSideBySideRows(lines: DiffLine[]): SideBySideRow[] {
  const rows: SideBySideRow[] = []
  let i = 0
  while (i < lines.length) {
    if (lines[i].type === 'unchanged') {
      rows.push({ left: lines[i].text, right: lines[i].text, leftType: 'unchanged', rightType: 'unchanged' })
      i += 1
      continue
    }

    const removed: string[] = []
    while (i < lines.length && lines[i].type === 'removed') {
      removed.push(lines[i].text)
      i += 1
    }
    const added: string[] = []
    while (i < lines.length && lines[i].type === 'added') {
      added.push(lines[i].text)
      i += 1
    }

    const pairCount = Math.max(removed.length, added.length)
    for (let k = 0; k < pairCount; k++) {
      const left = k < removed.length ? removed[k] : null
      const right = k < added.length ? added[k] : null
      rows.push({
        left,
        right,
        leftType: left === null ? 'empty' : 'removed',
        rightType: right === null ? 'empty' : 'added',
      })
    }
  }
  return rows
}
