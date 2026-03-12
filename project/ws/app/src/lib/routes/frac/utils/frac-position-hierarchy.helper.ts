import { FracHierarchyNode, FracHierarchyResponse } from '../models/frac-api.models'
import { HierarchyDetailItem } from '../components/hierarchy-chip-details-modal/hierarchy-chip-details-modal.component'

export interface PositionHierarchyCounts {
  role: number
  activity: number
  competency: number
}

export interface PositionHierarchyDetails {
  role: HierarchyDetailItem[]
  activity: HierarchyDetailItem[]
  competency: HierarchyDetailItem[]
}

export interface PositionHierarchyAggregate {
  counts: PositionHierarchyCounts
  details: PositionHierarchyDetails
}

/**
 * Static utility for processing and normalizing position hierarchy data.
 */
export class FracPositionHierarchyHelper {

  /**
   * Processes a raw API response into an aggregate object with counts and sorted details.
   */
  static extractAggregateFromResponse(response: FracHierarchyResponse | null | undefined): PositionHierarchyAggregate {
    const resultNode = response?.result
    const roots = Array.isArray(resultNode) ? resultNode : resultNode ? [resultNode] : []
    const roleMap = new Map<string, HierarchyDetailItem>()
    const activityMap = new Map<string, HierarchyDetailItem>()
    const competencyMap = new Map<string, HierarchyDetailItem>()

    // We track raw totals to match the "non-unique" visual representation in the modal
    let totalRoles = 0
    let totalActivities = 0
    let totalCompetencies = 0

    const visitNode = (node: FracHierarchyNode | null | undefined): void => {
      if (!node) {
        return
      }

      const entityType = (node.entityType || '').toString().trim().toUpperCase()
      const code = this.normalizeCode(node.entityCode)
      const name = (node.entityName || node.entityDescription || '').toString().trim()

      if (entityType === 'ROLE') {
        totalRoles++
        this.upsertItem(roleMap, code, name)
      } else if (entityType === 'ACTIVITY') {
        totalActivities++
        this.upsertItem(activityMap, code, name)
      } else if (entityType === 'COMPETENCY') {
        totalCompetencies++
        const levels = this.extractCompetencyLevels(node.competencies)
        this.upsertItem(competencyMap, code, name, levels)
      }

      const children = Array.isArray(node.children)
        ? node.children
        : Array.isArray(node.childHierarchy) ? node.childHierarchy : []
      children.forEach((child) => visitNode(child))
    }

    roots.forEach((root) => visitNode(root))
    const details = {
      role: this.getSortedItems(roleMap),
      activity: this.getSortedItems(activityMap),
      competency: this.getSortedItems(competencyMap),
    }

    return {
      counts: {
        role: totalRoles,
        activity: totalActivities,
        competency: totalCompetencies,
      },
      details,
    }
  }

  /**
   * Normalizes an entity code to a trimmed uppercase string.
   */
  static normalizeCode(code: unknown): string {
    return (code || '').toString().trim().toUpperCase()
  }

  /**
   * Internal helper to upsert items into a hierarchy map.
   */
  private static upsertItem(
    store: Map<string, HierarchyDetailItem>,
    code: string,
    name: string,
    levels: string[] = [],
  ): void {
    if (!code) {
      return
    }

    const existing = store.get(code)
    if (!existing) {
      store.set(code, {
        entityCode: code,
        entityName: name || '-',
        levels: levels.length ? [...levels] : undefined,
      })
      return
    }

    if (!existing.entityName || existing.entityName === '-') {
      existing.entityName = name || existing.entityName
    }

    if (levels.length) {
      const merged = new Set<string>([...(existing.levels || []), ...levels])
      existing.levels = this.sortLevels(Array.from(merged))
    }
  }

  /**
   * Returns a sorted array of hierarchy items from a map.
   */
  private static getSortedItems(store: Map<string, HierarchyDetailItem>): HierarchyDetailItem[] {
    return Array.from(store.values()).sort((a, b) =>
      (a.entityCode || '').localeCompare((b.entityCode || ''), undefined, { numeric: true, sensitivity: 'base' }),
    )
  }

  /**
   * Extracts and normalizes competency levels from a tree-like competencies structure.
   */
  private static extractCompetencyLevels(competencies: unknown): string[] {
    if (!Array.isArray(competencies)) {
      return []
    }

    const levelSet = new Set<string>()
    competencies.forEach((entry) => {
      if (entry && typeof entry === 'object') {
        const obj = entry as Record<string, unknown>
        const levelNumber = Number(obj.levelNumber)
        if (Number.isFinite(levelNumber) && levelNumber > 0) {
          levelSet.add(`L${levelNumber}`)
          return
        }

        const rawLevel = (obj.level || '').toString().trim()
        if (!rawLevel) {
          return
        }
        const normalizedLevel = rawLevel.toUpperCase().startsWith('L') ? rawLevel.toUpperCase() : `L${rawLevel}`
        levelSet.add(normalizedLevel)
      }
    })

    return this.sortLevels(Array.from(levelSet))
  }

  /**
   * Sorts level strings numerically (e.g., L1, L2, L10).
   */
  private static sortLevels(levels: string[]): string[] {
    return levels.sort((a, b) => {
      const aNum = Number((a || '').replace(/[^0-9]/g, ''))
      const bNum = Number((b || '').replace(/[^0-9]/g, ''))
      if (Number.isFinite(aNum) && Number.isFinite(bNum) && aNum !== bNum) {
        return aNum - bNum
      }
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    })
  }
}
