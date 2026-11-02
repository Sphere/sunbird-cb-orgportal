import { FracActivity, FracCompetency, FracLevel, FracPosting, FracRole } from '../models/frac-studio.models'
import { normalizeCode } from './frac-studio-refs.util'

// Pure, immutable edit helpers for the Creator editors. Every function returns new arrays.

const LEVEL_COUNT = 5
export const ADDED_BY_TEAM = 'Added by team'

/** Re-codes roles R1..Rn and activities A1..An, numbered globally across roles (spec 4.1). */
export function renumber(roles: FracRole[]): FracRole[] {
  let seq = 0
  return roles.map((role, r) => ({
    ...role,
    code: `R${r + 1}`,
    activities: role.activities.map(activity => {
      seq++
      return { ...activity, code: `A${seq}` }
    }),
  }))
}

export function addRole(roles: FracRole[]): FracRole[] {
  return renumber([...roles, { code: '', title: '', source: ADDED_BY_TEAM, activities: [] }])
}

export function removeRole(roles: FracRole[], index: number): FracRole[] {
  return renumber(roles.filter((_, i) => i !== index))
}

/** Moves a role one place up (-1) or down (+1); out-of-range moves return the list unchanged. */
export function moveRole(roles: FracRole[], index: number, delta: -1 | 1): FracRole[] {
  const target = index + delta
  if (target < 0 || target >= roles.length) {
    return roles
  }
  const next = [...roles]
  const moved = next[index]
  next[index] = next[target]
  next[target] = moved
  return renumber(next)
}

export function addActivity(roles: FracRole[], roleIndex: number, postings: FracPosting[]): FracRole[] {
  const activity: FracActivity = {
    code: '',
    text: '',
    postings: Object.fromEntries(postings.map(p => [p.key, ''])),
    source: ADDED_BY_TEAM,
    tier: '',
    comp: '',
  }
  return renumber(roles.map((role, i) => (i === roleIndex ? { ...role, activities: [...role.activities, activity] } : role)))
}

export function removeActivity(roles: FracRole[], roleIndex: number, activityIndex: number): FracRole[] {
  return renumber(roles.map((role, i) => (i === roleIndex
    ? { ...role, activities: role.activities.filter((_, a) => a !== activityIndex) }
    : role)))
}

/** Replaces one field of one activity without renumbering. */
export function updateActivity(roles: FracRole[], roleIndex: number, activityIndex: number,
  patch: Partial<FracActivity>): FracRole[] {
  return roles.map((role, i) => (i === roleIndex
    ? { ...role, activities: role.activities.map((a, j) => (j === activityIndex ? { ...a, ...patch } : a)) }
    : role))
}

export function updateRole(roles: FracRole[], roleIndex: number, patch: Partial<FracRole>): FracRole[] {
  return roles.map((role, i) => (i === roleIndex ? { ...role, ...patch } : role))
}

/** Next code after the highest one with this prefix: ANM1..ANM12 → ANM13 (spec 5.4 "mint after the highest"). */
export function nextCompetencyCode(competencies: FracCompetency[], prefix: string): string {
  const safePrefix = prefix || 'C'
  const highest = competencies.reduce((max, c) => {
    const m = new RegExp(`^${safePrefix}(\\d+)$`).exec(normalizeCode(c.code))
    return m ? Math.max(max, Number(m[1])) : max
  }, 0)
  return `${safePrefix}${highest + 1}`
}

export function emptyLadder(): FracLevel[] {
  return Array.from({ length: LEVEL_COUNT }, () => ({ label: '', desc: '' }))
}

export function addCompetency(competencies: FracCompetency[], prefix: string): FracCompetency[] {
  return [...competencies, {
    code: nextCompetencyCode(competencies, prefix),
    label: '',
    description: '',
    type: 'Domain',
    area: '',
    kcm: 'Domain – department-defined',
    levels: null,
  }]
}

export function removeCompetency(competencies: FracCompetency[], index: number): FracCompetency[] {
  return competencies.filter((_, i) => i !== index)
}

export function updateCompetency(competencies: FracCompetency[], index: number,
  patch: Partial<FracCompetency>): FracCompetency[] {
  return competencies.map((c, i) => (i === index ? { ...c, ...patch } : c))
}

/** Replaces one level of one competency, creating the ladder if it had none. */
export function updateLevel(competencies: FracCompetency[], index: number, level: number,
  patch: Partial<FracLevel>): FracCompetency[] {
  return competencies.map((c, i) => {
    if (i !== index) {
      return c
    }
    const levels = (c.levels ?? emptyLadder()).map((l, li) => (li === level ? { ...l, ...patch } : l))
    return { ...c, levels }
  })
}
