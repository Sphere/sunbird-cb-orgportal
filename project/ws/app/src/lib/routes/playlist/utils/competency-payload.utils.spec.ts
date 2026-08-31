import {
  findExistingCompetency,
  buildLevels,
  buildCompetencyData,
  buildPlaylistPayload,
  restoreSavedCourseAssignments,
} from './competency-payload.utils'
import { SelectableCompetency } from '../models/competency.model'
import { Playlist } from '../models/playlist.model'

function buildPlaylist(payload: unknown[]): Playlist {
  return {
    id: 'p1',
    orgId: 'org1',
    role: [],
    language: 'en',
    dataSource: { type: 'competency', payload },
  }
}

function buildCompetency(overrides: Partial<SelectableCompetency> = {}): SelectableCompetency {
  return {
    id: '97',
    code: 'C97',
    name: 'Communication',
    description: 'Communication skills',
    selected: true,
    displayOrder: 0,
    coursesAssigned: false,
    levels: [{ level: 1, name: 'Beginner', description: 'Beginner level' }],
    ...overrides,
  }
}

describe('competency-payload.utils', () => {
  describe('findExistingCompetency', () => {
    it('should return null when the existing playlist has no payload', () => {
      expect(findExistingCompetency('C97', '97')).toBeNull()
      expect(findExistingCompetency('C97', '97', buildPlaylist(undefined as any))).toBeNull()
    })

    it('should find an item by normalized code match', () => {
      const playlist = buildPlaylist([{ code: 'c97', id: 1 }])
      const result = findExistingCompetency('C97', '97', playlist)
      expect(result).toEqual({ code: 'c97', id: 1 })
    })

    it('should fall back to id match when no code is provided', () => {
      const playlist = buildPlaylist([{ id: 97 }])
      const result = findExistingCompetency('', '97', playlist)
      expect(result).toEqual({ id: 97 })
    })

    it('should return null when nothing matches', () => {
      const playlist = buildPlaylist([{ code: 'C1', id: 1 }])
      expect(findExistingCompetency('C97', '97', playlist)).toBeNull()
    })
  })

  describe('buildLevels', () => {
    it('should return an empty array when the competency has no levels', () => {
      expect(buildLevels(buildCompetency({ levels: [] }))).toEqual([])
      expect(buildLevels(buildCompetency({ levels: undefined }))).toEqual([])
    })

    it('should map levels with default name/description when missing', () => {
      const result = buildLevels(buildCompetency({ levels: [{ level: 1 }] }))
      expect(result).toEqual([{ level: 1, name: '', description: '' }])
    })

    it('should include courseId only when assigned', () => {
      const result = buildLevels(buildCompetency({
        levels: [
          { level: 1, name: 'Beginner', description: 'Desc', courseId: 'course-1' },
          { level: 2, name: 'Advanced', description: 'Desc2' },
        ],
      }))
      expect(result[0]).toEqual({ level: 1, name: 'Beginner', description: 'Desc', courseId: 'course-1' })
      expect(result[1]).toEqual({ level: 2, name: 'Advanced', description: 'Desc2' })
      expect(result[1].courseId).toBeUndefined()
    })
  })

  describe('buildCompetencyData', () => {
    it('should build a competency payload item with defaults applied', () => {
      const result = buildCompetencyData(buildCompetency(), 'C97', 'token-1')
      expect(result.id).toBe('97')
      expect(result.code).toBe('C97')
      expect(result.name).toBe('Communication')
      expect(result.type).toBe('Domain')
      expect(result.area).toBe('Management')
      expect(result.status).toBe('UNVERIFIED')
      expect(result.createdBy).toBe('token-1')
      expect(result.reviewedDate).toBeNull()
    })

    it('should default id to 10 when the competency has no id', () => {
      const result = buildCompetencyData(buildCompetency({ id: undefined as any }), 'C97', 'token-1')
      expect(result.id).toBe(10)
    })

    it('should preserve createdDate/createdBy/reviewedDate from a matching existing competency', () => {
      const existingPlaylist = buildPlaylist([{
        code: 'c97',
        createdDate: '2020-01-01T00:00:00.000Z',
        createdBy: 'original-author',
        reviewedDate: '2020-02-01T00:00:00.000Z',
        reviewedBy: 'reviewer-1',
      }])

      const result = buildCompetencyData(buildCompetency(), 'C97', 'token-1', existingPlaylist)
      expect(result.createdDate).toBe('2020-01-01T00:00:00.000Z')
      expect(result.createdBy).toBe('original-author')
      expect(result.reviewedDate).toBe('2020-02-01T00:00:00.000Z')
      expect(result.reviewedBy).toBe('reviewer-1')
    })
  })

  describe('buildPlaylistPayload', () => {
    it('should assign a 0-based index to each competency in order', () => {
      const competencies = [
        buildCompetency({ id: '1', code: 'C1' }),
        buildCompetency({ id: '2', code: 'C2' }),
      ]
      const result = buildPlaylistPayload(competencies, 'token-1')
      expect(result[0].index).toBe(0)
      expect(result[1].index).toBe(1)
    })

    it('should derive a code from the id when the competency has none', () => {
      const result = buildPlaylistPayload([buildCompetency({ id: '5', code: undefined as any })], 'token-1')
      expect(result[0].code).toBe('C5')
    })
  })

  describe('restoreSavedCourseAssignments', () => {
    it('should do nothing when the competency has no id or levels', () => {
      const competency = buildCompetency({ id: undefined as any })
      expect(() => restoreSavedCourseAssignments(competency, [])).not.toThrow()
    })

    it('should restore courseId/courseName/name/description from a matching saved level', () => {
      const competency = buildCompetency({
        levels: [{ level: 1, name: '', description: '' }],
      })
      const playlistPayload = [{
        code: 'C97',
        levels: [{ level: 1, courseId: 'course-9', courseName: 'Saved Course', name: 'Saved Name', description: 'Saved Description' }],
      }]

      restoreSavedCourseAssignments(competency, playlistPayload as any)

      expect(competency.levels[0].courseId).toBe('course-9')
      expect(competency.levels[0].courseName).toBe('Saved Course')
      expect(competency.levels[0].name).toBe('Saved Name')
      expect(competency.levels[0].description).toBe('Saved Description')
    })

    it('should leave levels untouched when no matching saved competency is found', () => {
      const competency = buildCompetency({
        levels: [{ level: 1, name: 'Original', description: 'Original Desc' }],
      })
      restoreSavedCourseAssignments(competency, [{ code: 'OTHER', levels: [] }] as any)
      expect(competency.levels[0].name).toBe('Original')
    })
  })
})
