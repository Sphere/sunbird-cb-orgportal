// Role titles that read as syllabus subjects rather than areas of work (FRAC method rule 1: "Roles are areas of
// work, never curriculum subjects"). Used by position matching to warn before such roles are copied.

/** Nursing and paramedical course subjects, as they appear as role titles in the Positions master. */
const SUBJECTS = new RegExp([
  'anatomy', 'physiology', 'microbiology', 'psychology', 'sociology', 'english', 'computer education', 'nutrition',
  'pharmacology', 'pathology', 'biochemistry', 'genetics', 'fundamentals of nursing', 'nursing foundations?',
  'health education', 'community health nursing', 'medical surgical nursing', 'child health nursing',
  'mental health nursing', 'midwifery and gyn',
].map(s => `\\b${s}`).join('|'), 'i')

/** A course part such as "Nursing-I" or "Community health nursing - II". */
const COURSE_PART = /[-–]\s*(i{1,3}|iv|v)\s*$/i

/** Share of syllabus-like titles at which the match warns (the expert check's "syllabus" threshold is the same 30%). */
const WARN_SHARE = 0.3

export function isSyllabusTitle(title: string): boolean {
  return SUBJECTS.test(title) || COURSE_PART.test(title.trim())
}

/** The syllabus-like titles, or none when they are under WARN_SHARE of all the titles. */
export function syllabusTitles(titles: string[]): string[] {
  const hits = titles.filter(isSyllabusTitle)
  return titles.length && hits.length / titles.length >= WARN_SHARE ? hits : []
}
