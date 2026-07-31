import {
  buildPositionMappingTree,
  compareSortValues,
  extractEntityList,
  getCodeFromKey,
  getLanguageCode,
  makeMappingKey,
  normalizeSortValue,
  sortEntitiesForDisplay,
  transformActivities,
  transformActivityForUpdate,
  transformCompetencies,
  transformCompetencyForUpdate,
  transformPositions,
  transformRoles,
} from './common.util'

describe('common.util', () => {
  describe('buildPositionMappingTree', () => {
    it('returns empty array for null/undefined response', () => {
      expect(buildPositionMappingTree(null)).toEqual([])
      expect(buildPositionMappingTree(undefined)).toEqual([])
    })

    it('returns empty array when result is missing', () => {
      expect(buildPositionMappingTree({} as any)).toEqual([])
    })

    it('handles result as a single node (not array)', () => {
      const response: any = {
        result: {
          entityType: 'ROLE',
          entityCode: 'r1',
          entityName: 'Role One',
          children: [],
        },
      }
      const result = buildPositionMappingTree(response)
      expect(result).toHaveLength(1)
      expect(result[0].code).toBe('R1')
      expect(result[0].name).toBe('Role One')
    })

    it('handles result as array of nodes', () => {
      const response: any = {
        result: [
          { entityType: 'ROLE', entityCode: 'r1', entityName: 'Role One', children: [] },
          { entityType: 'ROLE', entityCode: 'r2', entityName: 'Role Two', children: [] },
        ],
      }
      const result = buildPositionMappingTree(response)
      expect(result).toHaveLength(2)
      expect(result.map(r => r.code)).toEqual(['R1', 'R2'])
    })

    it('builds a full role -> activity -> competency tree using childHierarchy', () => {
      const response: any = {
        result: {
          entityType: 'ROLE',
          entityCode: 'role1',
          entityName: 'Manager',
          childHierarchy: [
            {
              entityType: 'ACTIVITY',
              entityCode: 'act1',
              entityName: 'Planning',
              childHierarchy: [
                {
                  entityType: 'COMPETENCY',
                  entityCode: 'comp1',
                  entityName: 'Leadership',
                  competencies: [
                    { levelNumber: 2 },
                    { level: '1' },
                    { level: 'L3' },
                  ],
                },
              ],
            },
          ],
        },
      }
      const result = buildPositionMappingTree(response)
      expect(result).toHaveLength(1)
      const role = result[0]
      expect(role.code).toBe('ROLE1')
      expect(role.name).toBe('Manager')
      expect(role.activities).toHaveLength(1)
      const activity = role.activities[0]
      expect(activity.code).toBe('ACT1')
      expect(activity.competencies).toHaveLength(1)
      const competency = activity.competencies[0]
      expect(competency.code).toBe('COMP1')
      expect(competency.levels).toEqual(['L1', 'L2', 'L3'])
    })

    it('deduplicates roles/activities/competencies with the same code across multiple visits', () => {
      const response: any = {
        result: [
          {
            entityType: 'ROLE',
            entityCode: 'role1',
            entityName: 'Manager',
            children: [
              {
                entityType: 'ACTIVITY',
                entityCode: 'act1',
                entityName: 'Planning',
                children: [
                  { entityType: 'COMPETENCY', entityCode: 'comp1', entityName: 'Leadership', competencies: [{ level: 'L1' }] },
                ],
              },
            ],
          },
          {
            entityType: 'ROLE',
            entityCode: 'role1',
            entityName: 'Manager Duplicate',
            children: [
              {
                entityType: 'ACTIVITY',
                entityCode: 'act1',
                entityName: 'Planning Duplicate',
                children: [
                  { entityType: 'COMPETENCY', entityCode: 'comp1', entityName: 'Leadership', competencies: [{ level: 'L2' }] },
                ],
              },
            ],
          },
        ],
      }
      const result = buildPositionMappingTree(response)
      expect(result).toHaveLength(1)
      expect(result[0].activities).toHaveLength(1)
      expect(result[0].activities[0].competencies).toHaveLength(1)
      expect(result[0].activities[0].competencies[0].levels).toEqual(['L1', 'L2'])
    })

    it('uses entityDescription when entityName is missing, and falls back to code when name is empty', () => {
      const response: any = {
        result: {
          entityType: 'ROLE',
          entityCode: 'role1',
          entityDescription: 'Desc Name',
          children: [],
        },
      }
      const result = buildPositionMappingTree(response)
      expect(result[0].name).toBe('Desc Name')

      const response2: any = {
        result: {
          entityType: 'ROLE',
          entityCode: 'role2',
          children: [],
        },
      }
      const result2 = buildPositionMappingTree(response2)
      expect(result2[0].name).toBe('ROLE2')
    })

    it('ignores ACTIVITY node when there is no parent role, and COMPETENCY node when no parent activity', () => {
      const response: any = {
        result: [
          { entityType: 'ACTIVITY', entityCode: 'orphanAct', entityName: 'Orphan Activity', children: [] },
          { entityType: 'COMPETENCY', entityCode: 'orphanComp', entityName: 'Orphan Competency', children: [] },
        ],
      }
      const result = buildPositionMappingTree(response)
      expect(result).toEqual([])
    })

    it('skips falsy child nodes without throwing', () => {
      const response: any = {
        result: {
          entityType: 'ROLE',
          entityCode: 'role1',
          entityName: 'Manager',
          children: [null, undefined],
        },
      }
      const result = buildPositionMappingTree(response)
      expect(result[0].activities).toEqual([])
    })

    it('handles unrecognized entityType gracefully (no-op) while still visiting children', () => {
      const response: any = {
        result: {
          entityType: 'UNKNOWN',
          entityCode: 'x',
          entityName: 'Unknown',
          children: [
            { entityType: 'ROLE', entityCode: 'roleUnderUnknown', entityName: 'Nested Role', children: [] },
          ],
        },
      }
      const result = buildPositionMappingTree(response)
      expect(result).toHaveLength(1)
      expect(result[0].code).toBe('ROLEUNDERUNKNOWN')
    })

    it('handles competency node whose competencies array has non-object entries', () => {
      const response: any = {
        result: {
          entityType: 'ROLE',
          entityCode: 'r',
          entityName: 'R',
          children: [
            {
              entityType: 'ACTIVITY',
              entityCode: 'a',
              entityName: 'A',
              children: [
                {
                  entityType: 'COMPETENCY',
                  entityCode: 'c',
                  entityName: 'C',
                  competencies: [null, 5, 'str', { level: '' }],
                },
              ],
            },
          ],
        },
      }
      const result = buildPositionMappingTree(response)
      expect(result[0].activities[0].competencies[0].levels).toEqual([])
    })
  })

  describe('transformCompetencyForUpdate', () => {
    it('returns originalData unchanged if inputs are not arrays', () => {
      expect(transformCompetencyForUpdate(null as any, [] as any)).toBeNull()
      expect(transformCompetencyForUpdate([{ code: 'a' }], null as any)).toEqual([{ code: 'a' }])
    })

    it('returns competency unchanged if no matching edited row found', () => {
      const original = [{ code: 'c1', name: 'Old' }]
      const result = transformCompetencyForUpdate(original, [{ code: 'other' }])
      expect(result[0]).toEqual({ code: 'c1', name: 'Old' })
    })

    it('merges basic fields from edited row', () => {
      const original = [{ code: 'c1', name: 'Old', description: 'OldDesc', type: 't1', status: 's1', children: [] }]
      const edited = [{ code: 'c1', name: 'New', description: 'NewDesc', type: 't2', status: 's2' }]
      const result = transformCompetencyForUpdate(original, edited)
      expect(result[0]).toMatchObject({ code: 'c1', name: 'New', description: 'NewDesc', type: 't2', status: 's2' })
    })

    it('merges level_ keys into existing children and sorts by level number', () => {
      const original = [
        {
          code: 'c1',
          name: 'Comp',
          children: [
            { level: 'L2', name: 'OldL2Name' },
            { level: 'L1', name: 'OldL1Name' },
          ],
        },
      ]
      const edited = [
        {
          code: 'c1',
          level_L1_label: 'NewL1Name',
          level_L1_description: 'NewL1Desc',
          level_L2_label: 'NewL2Name',
        },
      ]
      const result = transformCompetencyForUpdate(original, edited)
      const children = result[0].children as any[]
      expect(children.map(c => c.level)).toEqual(['L1', 'L2'])
      expect(children[0].name).toBe('NewL1Name')
      expect(children[0].description).toBe('NewL1Desc')
      expect(children[1].name).toBe('NewL2Name')
    })

    it('adds new level entries when level_ key does not match an existing child', () => {
      const original = [{ code: 'c1', name: 'Comp', children: [] }]
      const edited = [{ code: 'c1', level_L3_label: 'BrandNew' }]
      const result = transformCompetencyForUpdate(original, edited)
      const children = result[0].children as any[]
      expect(children).toHaveLength(1)
      expect(children[0]).toMatchObject({ level: 'L3', type: 'level', name: 'BrandNew' })
    })

    it('ignores level_ keys missing a field segment', () => {
      const original = [{ code: 'c1', name: 'Comp', children: [] }]
      const edited = [{ code: 'c1', level_L1: 'incomplete' }]
      const result = transformCompetencyForUpdate(original, edited)
      expect(result[0].children).toEqual([])
    })

    it('handles missing children array on original competency', () => {
      const original = [{ code: 'c1', name: 'Comp' }]
      const edited = [{ code: 'c1', name: 'Updated' }]
      const result = transformCompetencyForUpdate(original, edited)
      expect(result[0].children).toEqual([])
      expect(result[0].name).toBe('Updated')
    })
  })

  describe('transformCompetencies', () => {
    it('returns empty array for null/undefined input', () => {
      expect(transformCompetencies(null as any)).toEqual([])
      expect(transformCompetencies(undefined as any)).toEqual([])
    })

    it('builds levels from children when present', () => {
      const input: any = [
        {
          code: 'c1',
          name: 'Comp1',
          children: [
            { level: 'L1', entityCode: 'ec1' },
            { levelId: 2 },
          ],
        },
      ]
      const result = transformCompetencies(input)
      expect(result[0]).toEqual({
        code: 'c1',
        label: 'Comp1',
        levels: [
          { level: 'L1', code: 'ec1' },
          { level: 'L2', code: 'c1' },
        ],
      })
    })

    it('falls back to levels array when children absent, filtering invalid level numbers', () => {
      const input: any = [
        {
          code: 'c2',
          name: 'Comp2',
          levels: [
            { levelNumber: 1 },
            { level: 0 },
            { levelId: 3 },
            {},
          ],
        },
      ]
      const result = transformCompetencies(input)
      expect(result[0].levels).toEqual([
        { level: 'L1', code: 'c2' },
        { level: 'L3', code: 'c2' },
      ])
    })

    it('returns empty levels when neither children nor levels present', () => {
      const input: any = [{ code: 'c3', name: 'Comp3' }]
      const result = transformCompetencies(input)
      expect(result[0].levels).toEqual([])
    })
  })

  describe('transformActivities', () => {
    it('returns empty array for null/undefined', () => {
      expect(transformActivities(null as any)).toEqual([])
      expect(transformActivities(undefined as any)).toEqual([])
    })

    it('maps code and title with empty competencyDetails', () => {
      const input: any = [{ code: 'a1', name: 'Act1' }]
      const result = transformActivities(input)
      expect(result).toEqual([{ code: 'a1', title: 'Act1', competencyDetails: [] }])
    })
  })

  describe('extractEntityList', () => {
    it('returns [] for null/undefined', () => {
      expect(extractEntityList(null)).toEqual([])
      expect(extractEntityList(undefined)).toEqual([])
    })

    it('returns response directly when it is already an array', () => {
      const arr: any = [{ code: 'a' }]
      expect(extractEntityList(arr)).toBe(arr)
    })

    it('extracts from result.entity', () => {
      const response: any = { result: { entity: [{ code: 'x' }] } }
      expect(extractEntityList(response)).toEqual([{ code: 'x' }])
    })

    it('extracts from result.data.entity', () => {
      const response: any = { result: { data: { entity: [{ code: 'y' }] } } }
      expect(extractEntityList(response)).toEqual([{ code: 'y' }])
    })

    it('extracts from data.entity', () => {
      const response: any = { data: { entity: [{ code: 'z' }] } }
      expect(extractEntityList(response)).toEqual([{ code: 'z' }])
    })

    it('extracts from top-level entity', () => {
      const response: any = { entity: [{ code: 'w' }] }
      expect(extractEntityList(response)).toEqual([{ code: 'w' }])
    })

    it('returns [] when no known shape matches', () => {
      const response: any = { foo: 'bar' }
      expect(extractEntityList(response)).toEqual([])
    })
  })

  describe('transformActivityForUpdate', () => {
    it('returns originalData unchanged if inputs are not arrays', () => {
      expect(transformActivityForUpdate(null as any, [] as any)).toBeNull()
      expect(transformActivityForUpdate([{ code: 'a' }], null as any)).toEqual([{ code: 'a' }])
    })

    it('returns activity unchanged when no matching edited row', () => {
      const original = [{ code: 'a1', name: 'Old' }]
      const result = transformActivityForUpdate(original, [{ code: 'other' }])
      expect(result[0]).toEqual({ code: 'a1', name: 'Old' })
    })

    it('merges fields from edited row and preserves children copy', () => {
      const original = [{ code: 'a1', name: 'Old', description: 'OldDesc', type: 't1', status: 's1', children: [{ x: 1 }] }]
      const edited = [{ code: 'a1', name: 'New', description: 'NewDesc', type: 't2', status: 's2' }]
      const result = transformActivityForUpdate(original, edited)
      expect(result[0]).toMatchObject({ code: 'a1', name: 'New', description: 'NewDesc', type: 't2', status: 's2' })
      expect(result[0].children).toEqual([{ x: 1 }])
      expect(result[0].children).not.toBe(original[0].children)
    })

    it('defaults children to [] when original has no children array', () => {
      const original = [{ code: 'a1', name: 'Old' }]
      const edited = [{ code: 'a1', name: 'New' }]
      const result = transformActivityForUpdate(original, edited)
      expect(result[0].children).toEqual([])
    })
  })

  describe('transformRoles', () => {
    it('returns [] for non-array input', () => {
      expect(transformRoles(null as any)).toEqual([])
      expect(transformRoles(undefined as any)).toEqual([])
    })

    it('prefers additionalProperties.Code over code', () => {
      const input: any = [{ code: 'fallback', name: 'Role1', additionalProperties: { Code: 'AP1' } }]
      const result = transformRoles(input)
      expect(result[0]).toEqual({ code: 'AP1', title: 'Role1', expanded: false, activityDetails: [] })
    })

    it('falls back to code, then empty string, when additionalProperties.Code missing', () => {
      const input: any = [{ code: 'R1', name: 'Role1' }, { name: 'Role2' }]
      const result = transformRoles(input)
      expect(result[0].code).toBe('R1')
      expect(result[1].code).toBe('')
    })
  })

  describe('transformPositions', () => {
    it('returns [] for non-array input', () => {
      expect(transformPositions(null as any)).toEqual([])
      expect(transformPositions(undefined as any)).toEqual([])
    })

    it('prefers additionalProperties.Code over code', () => {
      const input: any = [{ code: 'fallback', name: 'Pos1', additionalProperties: { Code: 'AP2' } }]
      const result = transformPositions(input)
      expect(result[0]).toEqual({ code: 'AP2', title: 'Pos1', expanded: false, roleDetails: [] })
    })
  })

  describe('sortEntitiesForDisplay', () => {
    it('handles empty/null input', () => {
      expect(sortEntitiesForDisplay(null as any)).toEqual([])
      expect(sortEntitiesForDisplay([])).toEqual([])
    })

    it('sorts by code numerically', () => {
      const entities = [{ code: 'C10', name: 'B' }, { code: 'C2', name: 'A' }]
      const result = sortEntitiesForDisplay(entities)
      expect(result.map(e => e.code)).toEqual(['C2', 'C10'])
    })

    it('falls back to additionalProperties.Code, then sorts by name/title when codes are equal', () => {
      const entities = [
        { additionalProperties: { Code: 'X' }, name: 'Zebra' },
        { additionalProperties: { Code: 'X' }, title: 'Apple' },
      ]
      const result = sortEntitiesForDisplay(entities)
      expect(result[0].title).toBe('Apple')
      expect(result[1].name).toBe('Zebra')
    })

    it('does not mutate the original array', () => {
      const entities = [{ code: 'B' }, { code: 'A' }]
      const result = sortEntitiesForDisplay(entities)
      expect(result).not.toBe(entities)
      expect(entities.map(e => e.code)).toEqual(['B', 'A'])
    })
  })

  describe('normalizeSortValue', () => {
    it('handles null/undefined and trims strings', () => {
      expect(normalizeSortValue(null)).toBe('')
      expect(normalizeSortValue(undefined)).toBe('')
      expect(normalizeSortValue('  hello  ')).toBe('hello')
      expect(normalizeSortValue(42)).toBe('42')
    })
  })

  describe('compareSortValues', () => {
    it('compares strings with numeric-aware locale comparison', () => {
      expect(compareSortValues('a', 'b')).toBeLessThan(0)
      expect(compareSortValues('b', 'a')).toBeGreaterThan(0)
      expect(compareSortValues('item2', 'item10')).toBeLessThan(0)
      expect(compareSortValues('same', 'SAME')).toBe(0)
    })
  })

  describe('getLanguageCode', () => {
    it('maps known languages case-insensitively and with whitespace', () => {
      expect(getLanguageCode('English')).toBe('en')
      expect(getLanguageCode(' hindi ')).toBe('hi')
      expect(getLanguageCode('KANNADA')).toBe('kn')
      expect(getLanguageCode('Tamil')).toBe('ta')
    })

    it('defaults to en for unknown/empty/null input', () => {
      expect(getLanguageCode('french')).toBe('en')
      expect(getLanguageCode('')).toBe('en')
      expect(getLanguageCode(null as any)).toBe('en')
      expect(getLanguageCode(undefined as any)).toBe('en')
    })
  })

  describe('makeMappingKey', () => {
    it('builds a lowercased, trimmed composite key', () => {
      expect(makeMappingKey(' English ', ' C1 ')).toBe('english::C1')
    })

    it('handles empty entityCode', () => {
      expect(makeMappingKey('Hindi', null as any)).toBe('hindi::')
    })
  })

  describe('getCodeFromKey', () => {
    it('extracts the code portion after the separator', () => {
      expect(getCodeFromKey('english::C1')).toBe('C1')
    })

    it('returns the whole key when separator is absent', () => {
      expect(getCodeFromKey('nokeyseparator')).toBe('nokeyseparator')
    })

    it('handles empty string key', () => {
      expect(getCodeFromKey('')).toBe('')
    })
  })
})
