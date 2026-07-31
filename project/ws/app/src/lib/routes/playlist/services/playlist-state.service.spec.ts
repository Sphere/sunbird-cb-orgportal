import { PlaylistStateService } from './playlist-state.service'
import { ASKME_COURSE_CONTEXT_KEY } from '../config/course-context.config'
import { Playlist } from '../models/playlist.model'
import { SelectableCourse } from '../models/course.model'
import { SelectableCompetency } from '../models/competency.model'

describe('PlaylistStateService', () => {
  let service: PlaylistStateService

  beforeEach(() => {
    service = new PlaylistStateService()
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('filters', () => {
    it('returns null by default', () => {
      expect(service.getFilters()).toBeNull()
    })

    it('sets and gets filters, emitting via filters$', () => {
      const emitted: any[] = []
      service.filters$.subscribe(v => emitted.push(v))

      const filters: any = { search: 'abc' }
      service.setFilters(filters)

      expect(service.getFilters()).toBe(filters)
      expect(emitted).toEqual([null, filters])
    })
  })

  describe('existing course ids (per context)', () => {
    it('defaults to empty array for default context', () => {
      expect(service.getExistingCourseIds()).toEqual([])
    })

    it('sets and gets ids for default context', () => {
      service.setExistingCourseIds(['c1', 'c2'])
      expect(service.getExistingCourseIds()).toEqual(['c1', 'c2'])
    })

    it('keeps default and askme contexts independent', () => {
      service.setExistingCourseIds(['c1'])
      service.setExistingCourseIds(['a1'], ASKME_COURSE_CONTEXT_KEY)

      expect(service.getExistingCourseIds()).toEqual(['c1'])
      expect(service.getExistingCourseIds(ASKME_COURSE_CONTEXT_KEY)).toEqual(['a1'])
    })
  })

  describe('existing course playlist (per context)', () => {
    it('defaults to null', () => {
      expect(service.getExistingPlaylist()).toBeNull()
    })

    it('sets and gets playlist per context', () => {
      const playlist = { name: 'default-pl' } as Playlist
      const askmePlaylist = { name: 'askme-pl' } as Playlist

      service.setExistingPlaylist(playlist)
      service.setExistingPlaylist(askmePlaylist, ASKME_COURSE_CONTEXT_KEY)

      expect(service.getExistingPlaylist()).toBe(playlist)
      expect(service.getExistingPlaylist(ASKME_COURSE_CONTEXT_KEY)).toBe(askmePlaylist)
    })

    it('can be cleared by setting null', () => {
      service.setExistingPlaylist({ name: 'x' } as Playlist)
      service.setExistingPlaylist(null)
      expect(service.getExistingPlaylist()).toBeNull()
    })
  })

  describe('existing competency playlist', () => {
    it('defaults to null and emits via observable', () => {
      const emitted: any[] = []
      service.existingCompetencyPlaylist$.subscribe(v => emitted.push(v))

      const playlist = { name: 'comp-pl' } as Playlist
      service.setExistingCompetencyPlaylist(playlist)

      expect(service.getExistingCompetencyPlaylist()).toBe(playlist)
      expect(emitted).toEqual([null, playlist])
    })
  })

  describe('existing search playlist', () => {
    it('defaults to null', () => {
      expect(service.getExistingSearchPlaylist()).toBeNull()
    })

    it('sets and gets search playlist', () => {
      const playlist = { name: 'search-pl' } as Playlist
      service.setExistingSearchPlaylist(playlist)
      expect(service.getExistingSearchPlaylist()).toBe(playlist)
    })
  })

  describe('existing competency ids/codes', () => {
    it('default to empty arrays', () => {
      expect(service.getExistingCompetencyIds()).toEqual([])
      expect(service.getExistingCompetencyCodes()).toEqual([])
    })

    it('sets and gets competency ids and codes', () => {
      service.setExistingCompetencyIds(['id1', 'id2'])
      service.setExistingCompetencyCodes(['CODE1'])

      expect(service.getExistingCompetencyIds()).toEqual(['id1', 'id2'])
      expect(service.getExistingCompetencyCodes()).toEqual(['CODE1'])
    })
  })

  describe('selected & ordered courses (per context)', () => {
    const course1 = { id: 'c1' } as SelectableCourse
    const course2 = { id: 'c2' } as SelectableCourse

    it('default to empty arrays', () => {
      expect(service.getSelectedCourses()).toEqual([])
      expect(service.getOrderedCourses()).toEqual([])
    })

    it('sets and gets selected/ordered courses independently per context', () => {
      service.setSelectedCourses([course1])
      service.setOrderedCourses([course2])
      service.setSelectedCourses([course2], ASKME_COURSE_CONTEXT_KEY)

      expect(service.getSelectedCourses()).toEqual([course1])
      expect(service.getOrderedCourses()).toEqual([course2])
      expect(service.getSelectedCourses(ASKME_COURSE_CONTEXT_KEY)).toEqual([course2])
      expect(service.getOrderedCourses(ASKME_COURSE_CONTEXT_KEY)).toEqual([])
    })

    it('clearSelectedCourses resets selected and ordered courses for a context only', () => {
      service.setSelectedCourses([course1])
      service.setOrderedCourses([course2])
      service.setSelectedCourses([course1], ASKME_COURSE_CONTEXT_KEY)

      service.clearSelectedCourses()

      expect(service.getSelectedCourses()).toEqual([])
      expect(service.getOrderedCourses()).toEqual([])
      expect(service.getSelectedCourses(ASKME_COURSE_CONTEXT_KEY)).toEqual([course1])
    })
  })

  describe('course cache', () => {
    const courses = [{ id: 'c1' }] as any[]

    it('returns null when nothing cached', () => {
      expect(service.getCachedCourses('en')).toBeNull()
    })

    it('caches and retrieves courses only for the matching language', () => {
      service.setCachedCourses(courses, 'en')

      expect(service.getCachedCourses('en')).toBe(courses)
      expect(service.getCachedCourses('fr')).toBeNull()
    })

    it('returns null when cache is empty even if language matches', () => {
      service.setCachedCourses([], 'en')
      expect(service.getCachedCourses('en')).toBeNull()
    })

    it('clearCourseCache resets cache and language', () => {
      service.setCachedCourses(courses, 'en')
      service.clearCourseCache()
      expect(service.getCachedCourses('en')).toBeNull()
    })
  })

  describe('competency cache', () => {
    const competencies = [{ id: 'k1' }] as any[]

    it('returns null when nothing cached', () => {
      expect(service.getCachedCompetencies('en')).toBeNull()
    })

    it('caches and retrieves competencies only for matching language', () => {
      service.setCachedCompetencies(competencies, 'en')

      expect(service.getCachedCompetencies('en')).toBe(competencies)
      expect(service.getCachedCompetencies('hi')).toBeNull()
    })

    it('clearCompetencyCache resets cache and language', () => {
      service.setCachedCompetencies(competencies, 'en')
      service.clearCompetencyCache()
      expect(service.getCachedCompetencies('en')).toBeNull()
    })
  })

  describe('selected competencies', () => {
    const comp = { id: 'k1' } as SelectableCompetency

    it('defaults to empty array', () => {
      expect(service.getSelectedCompetencies()).toEqual([])
    })

    it('sets and gets selected competencies, emitting via observable', () => {
      const emitted: any[] = []
      service.selectedCompetencies$.subscribe(v => emitted.push(v))

      service.setSelectedCompetencies([comp])

      expect(service.getSelectedCompetencies()).toEqual([comp])
      expect(emitted).toEqual([[], [comp]])
    })

    it('clearSelectedCompetencies resets to empty array', () => {
      service.setSelectedCompetencies([comp])
      service.clearSelectedCompetencies()
      expect(service.getSelectedCompetencies()).toEqual([])
    })
  })

  describe('compareRoles', () => {
    it('returns default (isNewPlaylist true, isExactMatch true) when no existing playlist', () => {
      const result = service.compareRoles(['role1'])
      expect(result).toEqual({
        newRoles: [],
        existingOnlyRoles: [],
        isExactMatch: true,
        isNewPlaylist: true,
      })
    })

    it('handles null/undefined selectedRoles safely when no existing playlist', () => {
      expect(service.compareRoles(null).isNewPlaylist).toBe(true)
      expect(service.compareRoles(undefined).isNewPlaylist).toBe(true)
    })

    it('returns isNewPlaylist false and exact match when both selected and existing roles are empty', () => {
      service.setExistingPlaylist({ role: [] } as any)
      const result = service.compareRoles([])
      expect(result).toEqual({
        newRoles: [],
        existingOnlyRoles: [],
        isExactMatch: true,
        isNewPlaylist: false,
      })
    })

    it('identifies new roles not present in existing playlist', () => {
      service.setExistingPlaylist({ role: ['ADMIN'] } as any)
      const result = service.compareRoles(['admin', 'teacher'])

      expect(result.newRoles).toEqual(['teacher'])
      expect(result.isExactMatch).toBe(false)
      expect(result.isNewPlaylist).toBe(false)
    })

    it('identifies existing-only roles missing from selection', () => {
      service.setExistingPlaylist({ role: ['ADMIN', 'TEACHER'] } as any)
      const result = service.compareRoles(['admin'])

      expect(result.existingOnlyRoles).toEqual(['TEACHER'])
      expect(result.newRoles).toEqual([])
      expect(result.isExactMatch).toBe(false)
    })

    it('is an exact match (case-insensitive) when role sets are equivalent', () => {
      service.setExistingPlaylist({ role: ['ADMIN', 'Teacher'] } as any)
      const result = service.compareRoles(['admin', 'TEACHER'])

      expect(result.isExactMatch).toBe(true)
      expect(result.newRoles).toEqual([])
      expect(result.existingOnlyRoles).toEqual([])
    })

    it('respects the provided course context', () => {
      service.setExistingPlaylist({ role: ['ADMIN'] } as any, ASKME_COURSE_CONTEXT_KEY)
      const resultDefault = service.compareRoles(['admin'])
      const resultAskme = service.compareRoles(['admin'], ASKME_COURSE_CONTEXT_KEY)

      expect(resultDefault.isNewPlaylist).toBe(true)
      expect(resultAskme.isNewPlaylist).toBe(false)
    })
  })

  describe('getMergedRoles', () => {
    it('returns filtered selected roles when no existing playlist', () => {
      expect(service.getMergedRoles(['a', '', null as any, 'b'])).toEqual(['a', 'b'])
    })

    it('returns empty array when selectedRoles is null/undefined and no existing playlist', () => {
      expect(service.getMergedRoles(null)).toEqual([])
      expect(service.getMergedRoles(undefined)).toEqual([])
    })

    it('merges existing and selected roles uniquely, case-insensitively', () => {
      service.setExistingPlaylist({ role: ['Admin', 'Teacher'] } as any)
      const merged = service.getMergedRoles(['admin', 'student'])

      expect(merged).toContain('student')
      expect(merged).toContain('Teacher')
      // 'admin' from selectedRoles should win over existing 'Admin' casing since it's applied after
      expect(merged.filter(r => r.toUpperCase() === 'ADMIN')).toEqual(['admin'])
      expect(merged.length).toBe(3)
    })

    it('skips falsy roles while merging', () => {
      service.setExistingPlaylist({ role: ['Admin', '' as any, null as any] } as any)
      const merged = service.getMergedRoles(['', null as any, 'Student'])

      expect(merged).toEqual(['Admin', 'Student'])
    })
  })

  describe('clearState', () => {
    it('resets all state including per-context course slices and caches', () => {
      service.setFilters({ search: 'x' } as any)
      service.setExistingCourseIds(['c1'])
      service.setExistingPlaylist({ name: 'p' } as Playlist)
      service.setSelectedCourses([{ id: 'c1' }] as any)
      service.setOrderedCourses([{ id: 'c1' }] as any)
      service.setExistingCourseIds(['a1'], ASKME_COURSE_CONTEXT_KEY)
      service.setExistingCompetencyPlaylist({ name: 'cp' } as Playlist)
      service.setExistingCompetencyIds(['id1'])
      service.setExistingCompetencyCodes(['CODE1'])
      service.setExistingSearchPlaylist({ name: 'sp' } as Playlist)
      service.setSelectedCompetencies([{ id: 'k1' }] as any)
      service.setCachedCourses([{ id: 'c1' }] as any, 'en')
      service.setCachedCompetencies([{ id: 'k1' }] as any, 'en')

      service.clearState()

      expect(service.getFilters()).toBeNull()
      expect(service.getExistingCourseIds()).toEqual([])
      expect(service.getExistingPlaylist()).toBeNull()
      expect(service.getSelectedCourses()).toEqual([])
      expect(service.getOrderedCourses()).toEqual([])
      expect(service.getExistingCourseIds(ASKME_COURSE_CONTEXT_KEY)).toEqual([])
      expect(service.getExistingCompetencyPlaylist()).toBeNull()
      expect(service.getExistingCompetencyIds()).toEqual([])
      expect(service.getExistingCompetencyCodes()).toEqual([])
      expect(service.getExistingSearchPlaylist()).toBeNull()
      expect(service.getSelectedCompetencies()).toEqual([])
      expect(service.getCachedCourses('en')).toBeNull()
      expect(service.getCachedCompetencies('en')).toBeNull()
    })

    it('is safe to call when no course contexts have been created yet', () => {
      expect(() => service.clearState()).not.toThrow()
    })
  })
})
