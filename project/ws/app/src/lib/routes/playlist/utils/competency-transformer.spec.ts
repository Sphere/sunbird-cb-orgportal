import { CompetencyTransformer } from './competency-transformer'
import { RawCompetencyEntity, PlaylistCompetency } from './competency-transformer.types'

function buildRawEntity(overrides: Partial<RawCompetencyEntity> = {}): RawCompetencyEntity {
  return {
    id: 97,
    type: 'Competency',
    name: 'Communication',
    description: 'Communication skills',
    language: 'en',
    code: 'C97',
    level: 'INITIATE',
    levelId: 0,
    status: 'VERIFIED',
    entityType: 'Domain',
    area: 'Behavioural',
    children: [
      {
        id: 1,
        code: 'C97-1',
        level: '1',
        levelId: 1,
        name: 'Beginner',
        description: 'Beginner level',
        language: 'en',
        type: 'CompetencyLevel',
        status: 'VERIFIED',
      },
      {
        id: 2,
        code: 'C97-2',
        level: '2',
        levelId: 2,
        name: 'Advanced',
        description: 'Advanced level',
        language: 'en',
        type: 'CompetencyLevel',
        status: 'VERIFIED',
      },
    ],
    ...overrides,
  }
}

describe('CompetencyTransformer', () => {
  describe('transformToPlaylistFormat', () => {
    it('should key the result by the lowercased entity code', () => {
      const result = CompetencyTransformer.transformToPlaylistFormat(buildRawEntity({ code: 'C97' }))
      expect(Object.keys(result)).toEqual(['c97'])
    })

    it('should use plain name/description fields for English', () => {
      const result = CompetencyTransformer.transformToPlaylistFormat(buildRawEntity(), 'en')
      const competency = result.c97
      expect(competency.name).toBe('Communication')
      expect(competency.description).toBe('Communication skills')
      expect(competency.additionalProperties['lang-en-name']).toBeUndefined()
    })

    it('should add lang-{code}-name/description fields for non-English languages', () => {
      const result = CompetencyTransformer.transformToPlaylistFormat(buildRawEntity(), 'hi')
      const competency = result.c97
      expect(competency.additionalProperties['lang-hi-name']).toBe('Communication')
      expect(competency.additionalProperties['lang-hi-description']).toBe('Communication skills')
    })

    it('should preserve the existing English name/description when transforming a non-English update', () => {
      const existing: PlaylistCompetency = {
        id: 97,
        type: 'Competency',
        name: 'Existing English Name',
        description: 'Existing English Description',
        additionalProperties: {
          Code: 'C97',
          competencyLevelDescription: [],
        },
        status: 'UNVERIFIED',
        source: null,
        level: 'INITIATE',
        levelId: 0,
        isActive: true,
        createdDate: '2020-01-01T00:00:00.000Z',
        createdBy: 'system',
        updatedDate: '2020-01-01T00:00:00.000Z',
        updatedBy: 'system',
        reviewedDate: null,
        reviewedBy: null,
        wfId: null,
        children: [],
      }

      const result = CompetencyTransformer.transformToPlaylistFormat(buildRawEntity(), 'hi', existing)
      expect(result.c97.name).toBe('Existing English Name')
      expect(result.c97.description).toBe('Existing English Description')
      expect(result.c97.createdDate).toBe('2020-01-01T00:00:00.000Z')
    })

    it('should default entityType/area when missing from the raw entity', () => {
      const result = CompetencyTransformer.transformToPlaylistFormat(
        buildRawEntity({ entityType: undefined, area: undefined }),
      )
      expect(result.c97.additionalProperties.CompentencyType).toBe('Domain')
      expect(result.c97.additionalProperties.CompetencyArea).toBe('General')
    })

    it('should transform children into level descriptions', () => {
      const result = CompetencyTransformer.transformToPlaylistFormat(buildRawEntity())
      const levels = result.c97.additionalProperties.competencyLevelDescription
      expect(levels).toHaveLength(2)
      expect(levels[0]).toMatchObject({ level: '1', name: 'Beginner', description: 'Beginner level' })
      expect(levels[1]).toMatchObject({ level: '2', name: 'Advanced', description: 'Advanced level' })
    })

    it('should carry forward other languages already present on the existing competency', () => {
      const existing: PlaylistCompetency = {
        id: 97,
        type: 'Competency',
        name: 'Name',
        description: 'Description',
        additionalProperties: {
          Code: 'C97',
          competencyLevelDescription: [],
          'lang-kn-name': 'Kannada Name',
          'lang-kn-description': 'Kannada Description',
        },
        status: 'UNVERIFIED',
        source: null,
        level: 'INITIATE',
        levelId: 0,
        isActive: true,
        createdDate: '2020-01-01T00:00:00.000Z',
        createdBy: 'system',
        updatedDate: '2020-01-01T00:00:00.000Z',
        updatedBy: 'system',
        reviewedDate: null,
        reviewedBy: null,
        wfId: null,
        children: [],
      }

      const result = CompetencyTransformer.transformToPlaylistFormat(buildRawEntity(), 'hi', existing)
      expect(result.c97.additionalProperties['lang-kn-name']).toBe('Kannada Name')
      expect(result.c97.additionalProperties['lang-kn-description']).toBe('Kannada Description')
    })
  })

  describe('updateLevelCourse', () => {
    function buildCompetency(): PlaylistCompetency {
      return CompetencyTransformer.transformToPlaylistFormat(buildRawEntity()).c97
    }

    it('should add a new course mapping for a level with no existing course', () => {
      const competency = buildCompetency()
      const updated = CompetencyTransformer.updateLevelCourse(competency, '1', 'course-123', 'en')
      const level = updated.additionalProperties.competencyLevelDescription.find(l => l.level === '1')
      expect(level?.course).toEqual([{ lang: 'en', id: 'course-123' }])
    })

    it('should update an existing course mapping for the same language', () => {
      const competency = buildCompetency()
      CompetencyTransformer.updateLevelCourse(competency, '1', 'course-123', 'en')
      const updated = CompetencyTransformer.updateLevelCourse(competency, '1', 'course-456', 'en')
      const level = updated.additionalProperties.competencyLevelDescription.find(l => l.level === '1')
      expect(level?.course).toEqual([{ lang: 'en', id: 'course-456' }])
    })

    it('should append a course mapping for a different language without overwriting the first', () => {
      const competency = buildCompetency()
      CompetencyTransformer.updateLevelCourse(competency, '1', 'course-123', 'en')
      const updated = CompetencyTransformer.updateLevelCourse(competency, '1', 'course-789', 'hi')
      const level = updated.additionalProperties.competencyLevelDescription.find(l => l.level === '1')
      expect(level?.course).toEqual([
        { lang: 'en', id: 'course-123' },
        { lang: 'hi', id: 'course-789' },
      ])
    })

    it('should return the competency unchanged when the level does not exist', () => {
      const competency = buildCompetency()
      const updated = CompetencyTransformer.updateLevelCourse(competency, '99', 'course-123', 'en')
      expect(updated).toBe(competency)
    })
  })

  describe('buildPlaylistPayload', () => {
    it('should build one payload entry per raw entity', () => {
      const entities = [buildRawEntity({ id: 1, code: 'C1' }), buildRawEntity({ id: 2, code: 'C2' })]
      const payload = CompetencyTransformer.buildPlaylistPayload(entities)
      expect(payload).toHaveLength(2)
      expect(Object.keys(payload[0])).toEqual(['c1'])
      expect(Object.keys(payload[1])).toEqual(['c2'])
    })

    it('should reuse the matching existing payload entry by id', () => {
      const existingPayload = CompetencyTransformer.buildPlaylistPayload([buildRawEntity({ id: 1, code: 'C1' })])
      const updatedEntities = [buildRawEntity({ id: 1, code: 'C1', name: 'Updated Name' })]

      const payload = CompetencyTransformer.buildPlaylistPayload(updatedEntities, 'en', existingPayload)
      expect(payload[0].c1.name).toBe('Updated Name')
    })
  })

  describe('validateCoursesComplete', () => {
    it('should return false when a level has no courses', () => {
      const competency = CompetencyTransformer.transformToPlaylistFormat(buildRawEntity())
      expect(CompetencyTransformer.validateCoursesComplete(competency.c97, ['en'])).toBe(false)
    })

    it('should return false when a required language is missing a course', () => {
      let competency = CompetencyTransformer.transformToPlaylistFormat(buildRawEntity()).c97
      competency = CompetencyTransformer.updateLevelCourse(competency, '1', 'course-1', 'en')
      competency = CompetencyTransformer.updateLevelCourse(competency, '2', 'course-2', 'en')
      expect(CompetencyTransformer.validateCoursesComplete(competency, ['en', 'hi'])).toBe(false)
    })

    it('should return true once every level has a course for every required language', () => {
      let competency = CompetencyTransformer.transformToPlaylistFormat(buildRawEntity()).c97
      competency = CompetencyTransformer.updateLevelCourse(competency, '1', 'course-1-en', 'en')
      competency = CompetencyTransformer.updateLevelCourse(competency, '1', 'course-1-hi', 'hi')
      competency = CompetencyTransformer.updateLevelCourse(competency, '2', 'course-2-en', 'en')
      competency = CompetencyTransformer.updateLevelCourse(competency, '2', 'course-2-hi', 'hi')
      expect(CompetencyTransformer.validateCoursesComplete(competency, ['en', 'hi'])).toBe(true)
    })
  })
})
