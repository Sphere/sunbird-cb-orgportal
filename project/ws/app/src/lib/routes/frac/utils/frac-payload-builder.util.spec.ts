import { FracPayloadBuilder } from './frac-payload-builder.util'

describe('FracPayloadBuilder', () => {
  describe('buildCompetencyUpdate', () => {
    it('should return null when row has no code', () => {
      expect(FracPayloadBuilder.buildCompetencyUpdate({} as any, {}, 'en')).toBeNull()
    })

    it('should return null when row itself is null/undefined', () => {
      expect(FracPayloadBuilder.buildCompetencyUpdate(null as any, {}, 'en')).toBeNull()
    })

    it('should build payload using row values when present', () => {
      const row: any = {
        code: 'C1',
        name: 'Name',
        description: 'Desc',
        area: 'Area',
        type: 'Type',
        level_L1_label: 'L1',
        level_L1_description: 'D1',
      }
      const result = FracPayloadBuilder.buildCompetencyUpdate(row, {}, 'en')
      expect(result).toEqual({
        entityType: 'Competency',
        code: 'C1',
        languageCode: 'en',
        name: 'Name',
        description: 'Desc',
        status: 'Active',
        area: 'Area',
        type: 'Type',
        competencyLevels: [{ levelNumber: 1, levelName: 'L1', levelDescription: 'D1' }],
      })
    })

    it('should fall back to original values when row fields are missing', () => {
      const row: any = { code: 'C1' }
      const original: any = { name: 'OrigName', description: 'OrigDesc', status: 'Inactive', area: 'OrigArea', type: 'OrigType' }
      const result = FracPayloadBuilder.buildCompetencyUpdate(row, original, 'en')
      expect(result.name).toBe('OrigName')
      expect(result.description).toBe('OrigDesc')
      expect(result.status).toBe('Inactive')
      expect(result.area).toBe('OrigArea')
      expect(result.type).toBe('OrigType')
    })

    it('should default to empty string / Active status when neither row nor original has values', () => {
      const row: any = { code: 'C1' }
      const result = FracPayloadBuilder.buildCompetencyUpdate(row, {}, 'en')
      expect(result.name).toBe('')
      expect(result.description).toBe('')
      expect(result.status).toBe('Active')
      expect(result.area).toBe('')
      expect(result.type).toBe('')
      expect(result.competencyLevels).toEqual([])
    })
  })

  describe('buildGenericUpdate', () => {
    it('should return null when row has no code', () => {
      expect(FracPayloadBuilder.buildGenericUpdate('Activity', {} as any, {}, 'en')).toBeNull()
    })

    it('should return null when row is null/undefined', () => {
      expect(FracPayloadBuilder.buildGenericUpdate('Role', null as any, {}, 'en')).toBeNull()
    })

    it('should prefer original id/code/name over row values', () => {
      const row: any = { id: 'rowId', code: 'rowCode', name: 'rowName' }
      const original: any = { id: 'origId', code: 'origCode', name: 'origName' }
      const result = FracPayloadBuilder.buildGenericUpdate('Position', row, original, 'en')
      expect(result).toEqual({
        entityType: 'Position',
        id: 'origId',
        code: 'origCode',
        languageCode: 'en',
        name: 'rowName',
      })
    })

    it('should fall back to row id/code/name when original lacks them', () => {
      const row: any = { id: 'rowId', code: 'rowCode', name: 'rowName' }
      const result = FracPayloadBuilder.buildGenericUpdate('Activity', row, {}, 'en')
      expect(result.id).toBe('rowId')
      expect(result.code).toBe('rowCode')
      expect(result.name).toBe('rowName')
    })

    it('should default id/code to empty string and name to empty string when nothing present', () => {
      const row: any = { code: 'C1' }
      const result = FracPayloadBuilder.buildGenericUpdate('Role', row, {}, 'en')
      expect(result.id).toBe('')
      expect(result.name).toBe('')
    })
  })

  describe('buildDelete', () => {
    it('should return null when code is missing', () => {
      expect(FracPayloadBuilder.buildDelete('Activity', {} as any, 'en')).toBeNull()
    })

    it('should return null when row is null/undefined', () => {
      expect(FracPayloadBuilder.buildDelete('Activity', null as any, 'en')).toBeNull()
    })

    it('should return null when code trims to empty string', () => {
      expect(FracPayloadBuilder.buildDelete('Activity', { code: '   ' } as any, 'en')).toBeNull()
    })

    it('should build delete payload with trimmed code', () => {
      const result = FracPayloadBuilder.buildDelete('Activity', { code: '  C1  ' } as any, 'en')
      expect(result).toEqual({
        entityCode: 'C1',
        entityType: 'Activity',
        language: 'en',
        purgeAllLanguage: false,
      })
    })

    it('should coerce non-string code values to string', () => {
      const result = FracPayloadBuilder.buildDelete('Role', { code: 123 } as any, 'en')
      expect(result.entityCode).toBe('123')
    })
  })

  describe('extractCompetencyLevels (via buildCompetencyUpdate)', () => {
    it('should ignore keys that do not match the level pattern', () => {
      const row: any = { code: 'C1', someOtherField: 'value', level_bad_label: 'x' }
      const result = FracPayloadBuilder.buildCompetencyUpdate(row, {}, 'en')
      expect(result.competencyLevels).toEqual([])
    })

    it('should ignore levels with non-positive or non-finite level numbers', () => {
      const row: any = { code: 'C1', level_L0_label: 'zero', 'level_L-1_label': 'neg' }
      const result = FracPayloadBuilder.buildCompetencyUpdate(row, {}, 'en')
      expect(result.competencyLevels).toEqual([])
    })

    it('should filter out levels where both name and description are empty', () => {
      const row: any = { code: 'C1', level_L1_label: '', level_L1_description: '   ' }
      const result = FracPayloadBuilder.buildCompetencyUpdate(row, {}, 'en')
      expect(result.competencyLevels).toEqual([])
    })

    it('should sort levels numerically by level number', () => {
      const row: any = {
        code: 'C1',
        level_L3_label: 'Three',
        level_L1_label: 'One',
        level_L2_label: 'Two',
      }
      const result = FracPayloadBuilder.buildCompetencyUpdate(row, {}, 'en')
      expect(result.competencyLevels.map((l: any) => l.levelNumber)).toEqual([1, 2, 3])
    })

    it('should merge label and description for the same level', () => {
      const row: any = { code: 'C1', level_L2_label: 'Name2', level_L2_description: 'Desc2' }
      const result = FracPayloadBuilder.buildCompetencyUpdate(row, {}, 'en')
      expect(result.competencyLevels).toEqual([{ levelNumber: 2, levelName: 'Name2', levelDescription: 'Desc2' }])
    })

    it('should handle non-string level values via toString/trim coercion', () => {
      const row: any = { code: 'C1', level_L1_label: 42 }
      const result = FracPayloadBuilder.buildCompetencyUpdate(row, {}, 'en')
      expect(result.competencyLevels).toEqual([{ levelNumber: 1, levelName: '42', levelDescription: '' }])
    })

    it('should return empty array when row is empty object', () => {
      const result = FracPayloadBuilder.buildCompetencyUpdate({ code: 'C1' } as any, {}, 'en')
      expect(result.competencyLevels).toEqual([])
    })
  })
})
