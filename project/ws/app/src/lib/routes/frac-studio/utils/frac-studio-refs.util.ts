import { Frac } from '../models/frac-studio.models'

// Port of frac-studio-service src/engine/refs.ts, so "Used by" here matches the service's checks.
// Keep the two in step when either changes.

export interface FracRef {
  code: string
  level: number | null
}

const MAX_RANGE = 80

// All patterns run sticky against an upper-cased, dash-normalised string (spec 6.1 parseRefs)
const LEVEL = String.raw`\s*@?\s*L(?:EVEL)?\s*([1-5])(?![0-9])`
const LEVEL_RANGE = new RegExp(String.raw`([A-Z]{1,6})(\d+)\s*@?\s*L(?:EVEL)?\s*([1-5])\s*-\s*L?(?:EVEL)?\s*([1-5])(?![0-9])`, 'y')
const CODE_RANGE = /([A-Z]{1,6})(\d+)\s*-\s*([A-Z]{1,6})?(\d+)(?![0-9])/y
const SINGLE = new RegExp(String.raw`([A-Z]{1,6})(\d+)(?:${LEVEL})?`, 'y')
const BARE = /(\d+)(?:\s*-\s*(\d+))?(?![0-9])/y

/** "anm 03" → "ANM3". Leading zeros are dropped so "C03" and "C3" compare equal. */
export function normalizeCode(code: string): string {
  const m = /^([A-Z]+)\s*0*(\d+)$/.exec(code.trim().toUpperCase())
  return m ? `${m[1]}${m[2] || '0'}` : code.trim().toUpperCase()
}

/** Most common letter prefix among competency codes ("ANM" for ANM1..ANM40). */
export function dominantPrefix(codes: string[]): string {
  const counts = new Map<string, number>()
  for (const code of codes) {
    const m = /^([A-Z]+)\d/.exec(code.trim().toUpperCase())
    if (m) {
      counts.set(m[1], (counts.get(m[1]) ?? 0) + 1)
    }
  }
  let best = ''
  let bestN = 0
  counts.forEach((n, prefix) => {
    if (n > bestN) {
      best = prefix
      bestN = n
    }
  })
  return best
}

function isWordChar(ch: string | undefined): boolean {
  return ch !== undefined && /[A-Z0-9]/.test(ch)
}

function stickyMatch(re: RegExp, text: string, at: number): RegExpExecArray | null {
  re.lastIndex = at
  return re.exec(text)
}

/**
 * Parses a mapping cell into competency refs: bare numbers (with the dominant prefix),
 * "ME50L2-L5", "C3-C14" / "C3-14", and "C12", "C12@L3", "C12 L3", "C12L3".
 * "L" is never a code prefix. Duplicates keep their first occurrence.
 */
export function parseRefs(input: string | null | undefined, prefix = ''): FracRef[] {
  if (!input) {
    return []
  }
  const text = String(input).toUpperCase().replace(/[‐-―−]/g, '-')
  const out: FracRef[] = []
  const seen = new Set<string>()
  const push = (code: string, level: number | null) => {
    const norm = normalizeCode(code)
    if (!seen.has(norm)) {
      seen.add(norm)
      out.push({ code: norm, level })
    }
  }
  const pushRange = (codePrefix: string, a: string, b: string) => {
    let from = Number(a)
    let to = Number(b)
    if (to < from) {
      [from, to] = [to, from]
    }
    for (let n = from; n <= to && n - from < MAX_RANGE; n++) {
      push(codePrefix + n, null)
    }
  }

  let i = 0
  while (i < text.length) {
    if (isWordChar(text[i - 1]) || !isWordChar(text[i])) {
      i++
      continue
    }
    let m = stickyMatch(LEVEL_RANGE, text, i)
    if (m && m[1] !== 'L') {
      push(m[1] + m[2], Math.max(Number(m[3]), Number(m[4])))
      i += m[0].length
      continue
    }
    m = stickyMatch(CODE_RANGE, text, i)
    if (m && (m[3] === undefined || m[3] === m[1])) {
      i += m[0].length
      if (m[1] !== 'L') {
        pushRange(m[1], m[2], m[4])
      }
      continue
    }
    m = stickyMatch(SINGLE, text, i)
    if (m) {
      i += m[0].length
      if (m[1] !== 'L') {
        push(m[1] + m[2], m[3] ? Number(m[3]) : null)
      }
      continue
    }
    m = stickyMatch(BARE, text, i)
    if (m) {
      i += m[0].length
      if (prefix) {
        pushRange(prefix, m[1], m[2] ?? m[1])
      }
      continue
    }
    i++
  }
  return out
}

/** Competency code → codes of the activities that map to it (spec 5.4 "Used by"). */
export function usedByMap(frac: Pick<Frac, 'roles' | 'competencies' | 'codePrefix'>): Map<string, string[]> {
  const prefix = frac.codePrefix || dominantPrefix(frac.competencies.map(c => c.code))
  const used = new Map<string, string[]>()
  for (const role of frac.roles) {
    for (const activity of role.activities) {
      for (const ref of parseRefs(activity.comp, prefix)) {
        used.set(ref.code, [...(used.get(ref.code) ?? []), activity.code])
      }
    }
  }
  return used
}
