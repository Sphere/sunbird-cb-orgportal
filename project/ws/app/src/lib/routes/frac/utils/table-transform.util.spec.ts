import { TableTransformUtil } from './table-transform.util'
import { FracApiEntity, FracSearchResponse } from '../models/frac-api.models'

describe('TableTransformUtil', () => {
  let util: TableTransformUtil

  beforeEach(() => {
    util = new TableTransformUtil()
  })

  describe('transformResponseToTableConfig - empty/null inputs', () => {
    it('returns empty config for null response', () => {
      const result = util.transformResponseToTableConfig(null)
      expect(result).toEqual({ columns: [], data: [] })
    })

    it('returns empty config for undefined response', () => {
      const result = util.transformResponseToTableConfig(undefined)
      expect(result).toEqual({ columns: [], data: [] })
    })

    it('returns empty config for empty array', () => {
      const result = util.transformResponseToTableConfig([])
      expect(result).toEqual({ columns: [], data: [] })
    })

    it('returns empty config for response with no entity list found', () => {
      const result = util.transformResponseToTableConfig({} as FracSearchResponse)
      expect(result).toEqual({ columns: [], data: [] })
    })
  })

  describe('extractEntityList variants via transformResponseToTableConfig', () => {
    it('extracts entities from plain array', () => {
      const entities: FracApiEntity[] = [{ code: 'C1', name: 'N1', entityType: 'entity' }]
      const result = util.transformResponseToTableConfig(entities)
      expect(result.data).toEqual([{ code: 'C1', name: 'N1' }])
    })

    it('extracts entities from response.result.entity', () => {
      const response: FracSearchResponse = {
        result: { entity: [{ code: 'C1', name: 'N1', entityType: 'entity' }] },
      }
      const result = util.transformResponseToTableConfig(response)
      expect(result.data).toEqual([{ code: 'C1', name: 'N1' }])
    })

    it('extracts entities from response.result.data.entity', () => {
      const response: FracSearchResponse = {
        result: { data: { entity: [{ code: 'C2', name: 'N2', entityType: 'entity' }] } },
      }
      const result = util.transformResponseToTableConfig(response)
      expect(result.data).toEqual([{ code: 'C2', name: 'N2' }])
    })

    it('extracts entities from response.data.entity', () => {
      const response: FracSearchResponse = {
        data: { entity: [{ code: 'C3', name: 'N3', entityType: 'entity' }] },
      }
      const result = util.transformResponseToTableConfig(response)
      expect(result.data).toEqual([{ code: 'C3', name: 'N3' }])
    })

    it('extracts entities from response.entity', () => {
      const response: FracSearchResponse = {
        entity: [{ code: 'C4', name: 'N4', entityType: 'entity' }],
      }
      const result = util.transformResponseToTableConfig(response)
      expect(result.data).toEqual([{ code: 'C4', name: 'N4' }])
    })
  })

  describe('detectEntityType and handler dispatch', () => {
    it('uses entityType field when present', () => {
      const entities: FracApiEntity[] = [{ code: 'A', name: 'B', entityType: 'ROLE' }]
      const result = util.transformResponseToTableConfig(entities)
      expect(result.columns).toEqual([
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
      ])
    })

    it('falls back to type field when entityType absent', () => {
      const entities: FracApiEntity[] = [{ code: 'A', name: 'B', type: 'Position' }]
      const result = util.transformResponseToTableConfig(entities)
      expect(result.data).toEqual([{ code: 'A', name: 'B' }])
    })

    it('uses generic handler when type is unregistered', () => {
      const entities: FracApiEntity[] = [{ code: 'A', name: 'B', entityType: 'unknown-type' }]
      const result = util.transformResponseToTableConfig(entities)
      expect(result.columns).toEqual([
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'entityType', label: 'Entity Type' },
      ])
      expect(result.data).toEqual(entities)
    })

    it('uses generic handler when neither entityType nor type is present', () => {
      const entities: FracApiEntity[] = [{ code: 'A', name: 'B' }]
      const result = util.transformResponseToTableConfig(entities)
      expect(result.columns.map(c => c.key)).toEqual(['code', 'name'])
    })
  })

  describe('registerHandler', () => {
    it('registers a custom handler and lowercases the type key', () => {
      const customHandler = jest.fn(() => ({ columns: [], data: [{ custom: true }] }))
      util.registerHandler('CUSTOM', customHandler)
      const entities: FracApiEntity[] = [{ entityType: 'custom' }]
      const result = util.transformResponseToTableConfig(entities)
      expect(customHandler).toHaveBeenCalledWith(entities)
      expect(result.data).toEqual([{ custom: true }])
    })
  })

  describe('createEntityTableConfig / activity / role / position', () => {
    it('handles entity type with missing fields defaulting to empty string', () => {
      const entities: FracApiEntity[] = [{ entityType: 'entity' }]
      const result = util.transformResponseToTableConfig(entities)
      expect(result.data).toEqual([{ code: '', name: '' }])
    })

    it('handles activity type using additionalProperties.Code fallback', () => {
      const entities: FracApiEntity[] = [
        { entityType: 'activity', name: 'Act1', additionalProperties: { Code: 'AC1' } },
      ]
      const result = util.transformResponseToTableConfig(entities)
      expect(result.data).toEqual([{ code: 'AC1', name: 'Act1' }])
    })

    it('handles activity type with code present (no fallback needed)', () => {
      const entities: FracApiEntity[] = [{ entityType: 'activity', code: 'DIRECT', name: 'Act2' }]
      const result = util.transformResponseToTableConfig(entities)
      expect(result.data).toEqual([{ code: 'DIRECT', name: 'Act2' }])
    })

    it('handles role type using additionalProperties.Code fallback', () => {
      const entities: FracApiEntity[] = [
        { entityType: 'role', name: 'Role1', additionalProperties: { Code: 'R1' } },
      ]
      const result = util.transformResponseToTableConfig(entities)
      expect(result.data).toEqual([{ code: 'R1', name: 'Role1' }])
    })

    it('handles position type using additionalProperties.Code fallback', () => {
      const entities: FracApiEntity[] = [
        { entityType: 'position', name: 'Pos1', additionalProperties: { Code: 'P1' } },
      ]
      const result = util.transformResponseToTableConfig(entities)
      expect(result.data).toEqual([{ code: 'P1', name: 'Pos1' }])
    })

    it('handles position type with no code and no additionalProperties', () => {
      const entities: FracApiEntity[] = [{ entityType: 'position', name: 'Pos2' }]
      const result = util.transformResponseToTableConfig(entities)
      expect(result.data).toEqual([{ code: '', name: 'Pos2' }])
    })
  })

  describe('createCompetencyTableConfig - children branch', () => {
    it('builds level columns from children array', () => {
      const entities: FracApiEntity[] = [
        {
          entityType: 'competency',
          code: 'COMP1',
          name: 'Competency 1',
          description: 'Desc',
          type: 'core',
          area: 'AreaA',
          children: [
            { level: 'L1', name: 'Level1Name', description: 'Level1Desc' },
            { level: 'L2', name: 'Level2Name', description: 'Level2Desc' },
          ],
        },
      ]
      const result = util.transformResponseToTableConfig(entities)
      expect(result.columns).toEqual([
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'type', label: 'Type' },
        { key: 'area', label: 'Area' },
        { key: 'level_L1_label', label: 'Level 1 Label' },
        { key: 'level_L1_description', label: 'Level 1 Description' },
        { key: 'level_L2_label', label: 'Level 2 Label' },
        { key: 'level_L2_description', label: 'Level 2 Description' },
      ])
      expect(result.data[0]).toEqual({
        code: 'COMP1',
        type: 'core',
        name: 'Competency 1',
        description: 'Desc',
        area: 'AreaA',
        level_L1_label: 'Level1Name',
        level_L1_description: 'Level1Desc',
        level_L2_label: 'Level2Name',
        level_L2_description: 'Level2Desc',
      })
    })

    it('builds level key using levelId fallback when level absent on child', () => {
      const entities: FracApiEntity[] = [
        {
          entityType: 'competency',
          children: [{ levelId: 3, name: 'ChildName', description: 'ChildDesc' }],
        },
      ]
      const result = util.transformResponseToTableConfig(entities)
      expect(result.data[0]).toMatchObject({
        level_L3_label: 'ChildName',
        level_L3_description: 'ChildDesc',
      })
    })

    it('defaults child name/description to empty string when absent', () => {
      const entities: FracApiEntity[] = [
        {
          entityType: 'competency',
          children: [{ level: 'L1' }],
        },
      ]
      const result = util.transformResponseToTableConfig(entities)
      expect(result.data[0]).toMatchObject({
        level_L1_label: '',
        level_L1_description: '',
      })
    })
  })

  describe('createCompetencyTableConfig - levels branch', () => {
    it('builds level columns from levels array using levelNumber', () => {
      const entities: FracApiEntity[] = [
        {
          entityType: 'competency',
          levels: [
            { levelNumber: 1, levelName: 'LvlName1', levelDescription: 'LvlDesc1' },
            { levelNumber: 2, levelName: 'LvlName2', levelDescription: 'LvlDesc2' },
          ],
        },
      ]
      const result = util.transformResponseToTableConfig(entities)
      expect(result.data[0]).toEqual(
        expect.objectContaining({
          level_L1_label: 'LvlName1',
          level_L1_description: 'LvlDesc1',
          level_L2_label: 'LvlName2',
          level_L2_description: 'LvlDesc2',
        }),
      )
    })

    it('falls back to level and levelId when levelNumber absent', () => {
      const entities: FracApiEntity[] = [
        {
          entityType: 'competency',
          levels: [{ level: '2', name: 'FallbackName', description: 'FallbackDesc' }],
        },
      ]
      const result = util.transformResponseToTableConfig(entities)
      expect(result.data[0]).toMatchObject({
        level_L2_label: 'FallbackName',
        level_L2_description: 'FallbackDesc',
      })
    })

    it('skips a level entry when levelNumber is non-finite or <= 0', () => {
      const entities: FracApiEntity[] = [
        {
          entityType: 'competency',
          levels: [{ levelNumber: 0, levelName: 'Zero' }, { levelNumber: -1, levelName: 'Neg' }],
        },
      ]
      const result = util.transformResponseToTableConfig(entities)
      expect(result.data[0]).not.toHaveProperty('level_L0_label')
      expect(result.data[0]).not.toHaveProperty('level_L-1_label')
    })

    it('skips level entry entirely when no numeric identifier resolvable', () => {
      const entities: FracApiEntity[] = [
        {
          entityType: 'competency',
          levels: [{ levelName: 'NoNumber' }],
        },
      ]
      const result = util.transformResponseToTableConfig(entities)
      expect(Object.keys(result.data[0]).some(k => k.startsWith('level_'))).toBe(false)
    })
  })

  describe('createCompetencyTableConfig - flat competencyLevelN branch', () => {
    it('builds level columns from flat competencyLevelNName/Description fields', () => {
      const entities: FracApiEntity[] = [
        {
          entityType: 'competency',
          code: 'FLAT1',
          competencyLevel1Name: 'Flat1Name',
          competencyLevel1Description: 'Flat1Desc',
          competencyLevel2Name: 'Flat2Name',
          competencyLevel2Description: 'Flat2Desc',
        },
      ]
      const result = util.transformResponseToTableConfig(entities)
      expect(result.data[0]).toEqual(
        expect.objectContaining({
          level_L1_label: 'Flat1Name',
          level_L1_description: 'Flat1Desc',
          level_L2_label: 'Flat2Name',
          level_L2_description: 'Flat2Desc',
        }),
      )
    })

    it('handles entity with no children, no levels, and no flat level fields (maxLevelCount stays 0)', () => {
      const entities: FracApiEntity[] = [
        { entityType: 'competency', code: 'EMPTY1', name: 'NoLevels' },
      ]
      const result = util.transformResponseToTableConfig(entities)
      expect(result.columns).toEqual([
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'type', label: 'Type' },
        { key: 'area', label: 'Area' },
      ])
      expect(result.data[0]).toEqual({
        code: 'EMPTY1',
        type: '',
        name: 'NoLevels',
        description: '',
        area: '',
      })
    })
  })

  describe('createCompetencyTableConfig - mixed entities affecting maxLevelCount', () => {
    it('computes max level count across multiple entities with different sources', () => {
      const entities: FracApiEntity[] = [
        {
          entityType: 'competency',
          code: 'A',
          children: [{ level: 'L1', name: 'A1' }],
        },
        {
          entityType: 'competency',
          code: 'B',
          levels: [{ levelNumber: 3, levelName: 'B3' }],
        },
        {
          entityType: 'competency',
          code: 'C',
          competencyLevel2Name: 'C2',
        },
      ]
      const result = util.transformResponseToTableConfig(entities)
      // entity C has competencyLevel2Name, so extractCompetencyLevelCount returns 2,
      // which becomes the overall maxLevelCount (children/levels arrays are length 1 each)
      const levelLabelCols = result.columns.filter(c => c.key.endsWith('_label'))
      expect(levelLabelCols).toHaveLength(2)

      // entity C used the flat branch, populating levels 1..maxLevelCount from competencyLevelNName
      expect(result.data[2]).toMatchObject({
        level_L1_label: '',
        level_L2_label: 'C2',
      })
    })
  })

  describe('createGenericTableConfig', () => {
    it('formats camelCase and snake_case keys into readable labels', () => {
      const entities: FracApiEntity[] = [
        { entityType: 'mystery', someCamelKey: 'v1', snake_case_key: 'v2' } as FracApiEntity,
      ]
      const result = util.transformResponseToTableConfig(entities)
      const labels = result.columns.map(c => c.label)
      expect(labels).toContain('Some Camel Key')
      expect(labels).toContain('Snake Case Key')
    })
  })
})
