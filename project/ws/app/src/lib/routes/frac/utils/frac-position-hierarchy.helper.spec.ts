import { FracPositionHierarchyHelper } from './frac-position-hierarchy.helper'
import { FracHierarchyNode, FracHierarchyResponse } from '../models/frac-api.models'

describe('FracPositionHierarchyHelper', () => {
  describe('normalizeCode', () => {
    it('should trim and uppercase a code', () => {
      expect(FracPositionHierarchyHelper.normalizeCode('  abc123  ')).toBe('ABC123')
    })

    it('should return an empty string for null/undefined', () => {
      expect(FracPositionHierarchyHelper.normalizeCode(null)).toBe('')
      expect(FracPositionHierarchyHelper.normalizeCode(undefined)).toBe('')
    })
  })

  describe('extractAggregateFromResponse', () => {
    it('should return zeroed counts and empty details for a null/undefined response', () => {
      expect(FracPositionHierarchyHelper.extractAggregateFromResponse(null)).toEqual({
        counts: { role: 0, activity: 0, competency: 0 },
        details: { role: [], activity: [], competency: [] },
      })
      expect(FracPositionHierarchyHelper.extractAggregateFromResponse(undefined)).toEqual({
        counts: { role: 0, activity: 0, competency: 0 },
        details: { role: [], activity: [], competency: [] },
      })
    })

    it('should count and categorize a single root node by entityType', () => {
      const response: FracHierarchyResponse = {
        result: { entityType: 'role', entityCode: 'r1', entityName: 'Role One' },
      }

      const aggregate = FracPositionHierarchyHelper.extractAggregateFromResponse(response)
      expect(aggregate.counts).toEqual({ role: 1, activity: 0, competency: 0 })
      expect(aggregate.details.role).toEqual([{ entityCode: 'R1', entityName: 'Role One', levels: undefined }])
    })

    it('should support an array of root nodes', () => {
      const response: FracHierarchyResponse = {
        result: [
          { entityType: 'ROLE', entityCode: 'r1', entityName: 'Role One' },
          { entityType: 'ACTIVITY', entityCode: 'a1', entityName: 'Activity One' },
        ],
      }

      const aggregate = FracPositionHierarchyHelper.extractAggregateFromResponse(response)
      expect(aggregate.counts).toEqual({ role: 1, activity: 1, competency: 0 })
    })

    it('should recurse into children', () => {
      const response: FracHierarchyResponse = {
        result: {
          entityType: 'ROLE',
          entityCode: 'r1',
          entityName: 'Role One',
          children: [
            { entityType: 'ACTIVITY', entityCode: 'a1', entityName: 'Activity One' },
          ],
        } as FracHierarchyNode,
      }

      const aggregate = FracPositionHierarchyHelper.extractAggregateFromResponse(response)
      expect(aggregate.counts).toEqual({ role: 1, activity: 1, competency: 0 })
    })

    it('should recurse into childHierarchy when children is not an array', () => {
      const response: FracHierarchyResponse = {
        result: {
          entityType: 'ROLE',
          entityCode: 'r1',
          entityName: 'Role One',
          childHierarchy: [
            { entityType: 'COMPETENCY', entityCode: 'c1', entityName: 'Competency One' },
          ],
        } as FracHierarchyNode,
      }

      const aggregate = FracPositionHierarchyHelper.extractAggregateFromResponse(response)
      expect(aggregate.counts).toEqual({ role: 1, activity: 0, competency: 1 })
    })

    it('should fall back to entityDescription when entityName is missing', () => {
      const response: FracHierarchyResponse = {
        result: { entityType: 'ROLE', entityCode: 'r1', entityDescription: 'Role Description' },
      }
      const aggregate = FracPositionHierarchyHelper.extractAggregateFromResponse(response)
      expect(aggregate.details.role[0].entityName).toBe('Role Description')
    })

    it('should default entityName to "-" when both name and description are missing', () => {
      const response: FracHierarchyResponse = {
        result: { entityType: 'ROLE', entityCode: 'r1' },
      }
      const aggregate = FracPositionHierarchyHelper.extractAggregateFromResponse(response)
      expect(aggregate.details.role[0].entityName).toBe('-')
    })

    it('should skip nodes without an entity code', () => {
      const response: FracHierarchyResponse = {
        result: { entityType: 'ROLE', entityName: 'No Code' },
      }
      const aggregate = FracPositionHierarchyHelper.extractAggregateFromResponse(response)
      expect(aggregate.counts.role).toBe(1)
      expect(aggregate.details.role).toEqual([])
    })

    it('should merge duplicate codes into one item and count each occurrence', () => {
      const response: FracHierarchyResponse = {
        result: {
          entityType: 'ROLE',
          entityCode: 'r1',
          entityName: 'Role One',
          children: [
            { entityType: 'ROLE', entityCode: 'r1', entityName: 'Role One Duplicate' },
          ],
        } as FracHierarchyNode,
      }

      const aggregate = FracPositionHierarchyHelper.extractAggregateFromResponse(response)
      expect(aggregate.counts.role).toBe(2)
      expect(aggregate.details.role).toHaveLength(1)
    })

    it('should sort details by entity code numerically', () => {
      const response: FracHierarchyResponse = {
        result: [
          { entityType: 'ROLE', entityCode: 'r10', entityName: 'Ten' },
          { entityType: 'ROLE', entityCode: 'r2', entityName: 'Two' },
        ],
      }

      const aggregate = FracPositionHierarchyHelper.extractAggregateFromResponse(response)
      expect(aggregate.details.role.map(item => item.entityCode)).toEqual(['R2', 'R10'])
    })

    it('should extract and sort competency levels from levelNumber entries', () => {
      const response: FracHierarchyResponse = {
        result: {
          entityType: 'COMPETENCY',
          entityCode: 'c1',
          entityName: 'Competency One',
          competencies: [{ levelNumber: 2 }, { levelNumber: 1 }],
        },
      }

      const aggregate = FracPositionHierarchyHelper.extractAggregateFromResponse(response)
      expect(aggregate.details.competency[0].levels).toEqual(['L1', 'L2'])
    })

    it('should extract competency levels from a raw level string', () => {
      const response: FracHierarchyResponse = {
        result: {
          entityType: 'COMPETENCY',
          entityCode: 'c1',
          entityName: 'Competency One',
          competencies: [{ level: '3' }, { level: 'L4' }],
        },
      }

      const aggregate = FracPositionHierarchyHelper.extractAggregateFromResponse(response)
      expect(aggregate.details.competency[0].levels).toEqual(['L3', 'L4'])
    })

    it('should merge levels across duplicate competency codes without dropping earlier levels', () => {
      const response: FracHierarchyResponse = {
        result: {
          entityType: 'ROLE',
          entityCode: 'r1',
          entityName: 'Role',
          children: [
            { entityType: 'COMPETENCY', entityCode: 'c1', entityName: 'Comp', competencies: [{ levelNumber: 1 }] },
            { entityType: 'COMPETENCY', entityCode: 'c1', entityName: 'Comp', competencies: [{ levelNumber: 2 }] },
          ],
        } as FracHierarchyNode,
      }

      const aggregate = FracPositionHierarchyHelper.extractAggregateFromResponse(response)
      expect(aggregate.details.competency[0].levels).toEqual(['L1', 'L2'])
    })

    it('should ignore non-array competencies and malformed entries', () => {
      const response: FracHierarchyResponse = {
        result: {
          entityType: 'COMPETENCY',
          entityCode: 'c1',
          entityName: 'Competency One',
          competencies: 'not-an-array' as any,
        },
      }

      const aggregate = FracPositionHierarchyHelper.extractAggregateFromResponse(response)
      expect(aggregate.details.competency[0].levels).toBeUndefined()
    })

    it('should ignore an entityType that is not ROLE/ACTIVITY/COMPETENCY', () => {
      const response: FracHierarchyResponse = {
        result: { entityType: 'UNKNOWN', entityCode: 'x1', entityName: 'Unknown' },
      }
      const aggregate = FracPositionHierarchyHelper.extractAggregateFromResponse(response)
      expect(aggregate.counts).toEqual({ role: 0, activity: 0, competency: 0 })
    })

    it('should skip null/undefined child nodes safely', () => {
      const response: FracHierarchyResponse = {
        result: {
          entityType: 'ROLE',
          entityCode: 'r1',
          entityName: 'Role',
          children: [null as any, undefined as any],
        } as FracHierarchyNode,
      }
      expect(() => FracPositionHierarchyHelper.extractAggregateFromResponse(response)).not.toThrow()
    })
  })
})
