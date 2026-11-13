// Whether a standard sheet's content on the FRAC was changed after the upload, for the "Re-apply sheet" control.
// Compares what the team sees (titles, texts, posting Yes/No, codes and labels), not codes the service renumbers
// or mappings later steps add. Only sheets uploaded from 13 Nov 2026 keep their rows; older ones never match.
import { Frac, FracDocument } from '../models/frac-studio.models'

const norm = (s: string | undefined) => (s || '').trim().toLowerCase()
const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i])
/** Research lists each job description first as a source of its own; it is not part of a Sources sheet. */
const TEAM_DOCUMENT = 'team document'

/**
 * What re-applying the sheet puts back, e.g. "9 roles and 38 activities", when its content on the FRAC differs from
 * the uploaded rows; '' when it is unchanged, the sheet kept no rows, or (sources) research has not used it yet.
 */
export function reapplyWhat(frac: Frac, doc: FracDocument | undefined): string {
  const p = doc?.parsed
  if (!doc || !p) {
    return ''
  }
  if (doc.kind === 'roles' && p.roles) {
    const keys = (p.postings?.length ? p.postings : frac.postings).map(x => x.key)
    const rows = (roles: typeof frac.roles) => roles.flatMap(r => [
      `role:${norm(r.title)}`,
      ...r.activities.map(a => `${norm(a.text)}|${keys.map(k => norm(a.postings[k])).join(',')}`),
    ])
    const postingsChanged = !!p.postings?.length && !same(p.postings.map(x => norm(x.label)), frac.postings.map(x => norm(x.label)))
    const count = p.roles.reduce((n, r) => n + r.activities.length, 0)
    return postingsChanged || !same(rows(p.roles), rows(frac.roles)) ? `${p.roles.length} roles and ${count} activities` : ''
  }
  if (doc.kind === 'competencies' && p.competencies) {
    const rows = (list: typeof frac.competencies) => list.map(c => `${norm(c.code)}|${norm(c.label)}|${norm(c.type)}`)
    return same(rows(p.competencies), rows(frac.competencies)) ? '' : `${p.competencies.length} competencies`
  }
  if (doc.kind === 'sources' && p.sources && frac.research) {
    const rows = (list: typeof p.sources) => list.filter(s => norm(s.issuer) !== TEAM_DOCUMENT).map(s => `${norm(s.title)}|${norm(s.url)}`)
    return same(rows(p.sources), rows(frac.research.sources)) ? '' : `${p.sources.length} sources`
  }
  return ''
}
