import { FracApiEntity, FracHierarchyNode, FracHierarchyResponse, FracSearchResponse } from '../models/frac-api.models'

// ---------------------------------------------------------------------------
// Position Hierarchy Tree — shared model
// ---------------------------------------------------------------------------

export interface MappedCompetency {
  code: string
  name: string
  levels: string[]
}

export interface MappedActivity {
  code: string
  name: string
  competencies: MappedCompetency[]
}

export interface MappedRole {
  code: string
  name: string
  activities: MappedActivity[]
}

/**
 * Converts a FracHierarchyResponse into a nested MappedRole tree.
 * Walks Position → Role → Activity → Competency hierarchy.
 * @param response Raw hierarchy API response for a position.
 * @returns Ordered list of roles, each with their activities and competencies.
 */
export function buildPositionMappingTree(response: FracHierarchyResponse | null | undefined): MappedRole[] {
  const resultNode = response?.result
  const roots: FracHierarchyNode[] = Array.isArray(resultNode)
    ? resultNode
    : resultNode ? [resultNode] : []

  const roleMap = new Map<string, MappedRole>()

  const normalizeCode = (code: unknown): string => (code || '').toString().trim().toUpperCase()
  const normalizeName = (node: FracHierarchyNode): string =>
    ((node.entityName || node.entityDescription || '') as string).toString().trim()

  const visitNode = (node: FracHierarchyNode, parentRole: MappedRole | null, parentActivity: MappedActivity | null): void => {
    if (!node) {
      return
    }

    const entityType = (node.entityType || '').toString().trim().toUpperCase()
    const code = normalizeCode(node.entityCode)
    const name = normalizeName(node)

    let currentRole = parentRole
    let currentActivity = parentActivity

    if (entityType === 'ROLE') {
      if (!roleMap.has(code)) {
        roleMap.set(code, { code, name: name || code, activities: [] })
      }
      currentRole = roleMap.get(code)!
      currentActivity = null
    } else if (entityType === 'ACTIVITY' && currentRole) {
      let activity = currentRole.activities.find(a => a.code === code)
      if (!activity) {
        activity = { code, name: name || code, competencies: [] }
        currentRole.activities.push(activity)
      }
      currentActivity = activity
    } else if (entityType === 'COMPETENCY' && currentActivity) {
      let competency = currentActivity.competencies.find(c => c.code === code)
      if (!competency) {
        competency = { code, name: name || code, levels: [] }
        currentActivity.competencies.push(competency)
      }
      const levels = extractLevelsFromNode(node)
      levels.forEach(level => {
        if (!competency!.levels.includes(level)) {
          competency!.levels.push(level)
        }
      })
      sortLevels(competency.levels)
    }

    const children: FracHierarchyNode[] = Array.isArray(node.children)
      ? (node.children as FracHierarchyNode[])
      : Array.isArray(node.childHierarchy) ? (node.childHierarchy as FracHierarchyNode[]) : []

    children.forEach(child => visitNode(child, currentRole, currentActivity))
  }

  roots.forEach(root => visitNode(root, null, null))
  return [...roleMap.values()]
}

/**
 * Extracts level labels (e.g. 'L1', 'L2') from a competency hierarchy node.
 * @param node A FRAC hierarchy node for a competency.
 * @returns Array of level strings like ['L1', 'L2'].
 */
function extractLevelsFromNode(node: FracHierarchyNode): string[] {
  if (!Array.isArray(node.competencies)) {
    return []
  }

  const levelSet = new Set<string>()
  node.competencies.forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return
    }

    const obj = entry as Record<string, unknown>
    const levelNumber = Number(obj.levelNumber)
    if (Number.isFinite(levelNumber) && levelNumber > 0) {
      levelSet.add(`L${levelNumber}`)
      return
    }

    const rawLevel = (obj.level || '').toString().trim()
    if (rawLevel) {
      const normalizedLevel = rawLevel.toUpperCase().startsWith('L') ? rawLevel.toUpperCase() : `L${rawLevel}`
      levelSet.add(normalizedLevel)
    }
  })

  return [...levelSet]
}

/**
 * Sorts level strings numerically in place (L1, L2, L3...).
 * @param levels Array of level strings to sort.
 */
function sortLevels(levels: string[]): void {
  levels.sort((a, b) => {
    const aNum = Number(a.replace(/[^0-9]/g, ''))
    const bNum = Number(b.replace(/[^0-9]/g, ''))
    if (Number.isFinite(aNum) && Number.isFinite(bNum) && aNum !== bNum) {
      return aNum - bNum
    }
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  })
}



export type FlatEntityRow = Record<string, unknown>

interface CompetencyLevelUpdate extends Record<string, unknown> {
  level: string
  type: 'level'
  name?: unknown
  description?: unknown
}

interface CompetencyLevelView {
  level: string
  code: string
}

/**
 * Builds updated competency payload rows by merging edited table rows into original API data.
 */
export function transformCompetencyForUpdate(originalData: FlatEntityRow[], editedRows: FlatEntityRow[]): FlatEntityRow[] {
  if (!Array.isArray(originalData) || !Array.isArray(editedRows)) {
    return originalData
  }

  return originalData.map((competency) => {
    const competencyCode = (competency.code ?? '').toString()
    const edited = editedRows.find(row => (row.code ?? '').toString() === competencyCode)
    if (!edited) {
      return competency
    }

    const existingChildren = Array.isArray(competency.children)
      ? [...(competency.children as FlatEntityRow[])]
      : []

    const updatedCompetency: FlatEntityRow = {
      ...competency,
      code: edited.code ?? competency.code,
      name: edited.name ?? competency.name,
      description: edited.description ?? competency.description,
      type: edited.type ?? competency.type,
      status: edited.status ?? competency.status,
      children: existingChildren,
    }

    const levelKeys = Object.keys(edited).filter(key => key.startsWith('level_'))
    const levelUpdates: Record<string, CompetencyLevelUpdate> = {}

    levelKeys.forEach((key) => {
      const parts = key.split('_')
      const level = parts[1]
      const field = parts[2]
      if (!level || !field) {
        return
      }

      if (!levelUpdates[level]) {
        levelUpdates[level] = { level, type: 'level' }
      }

      if (field === 'label') {
        levelUpdates[level].name = edited[key]
      }
      if (field === 'description') {
        levelUpdates[level].description = edited[key]
      }
    })

    const mergedChildren = existingChildren.map((child) => {
      const childLevel = (child.level ?? '').toString()
      const update = levelUpdates[childLevel]
      if (!update) {
        return child
      }

      return {
        ...child,
        name: update.name ?? child.name,
        description: update.description ?? child.description,
      }
    })

    Object.keys(levelUpdates).forEach((level) => {
      const exists = mergedChildren.some(child => (child.level ?? '').toString() === level)
      if (!exists) {
        mergedChildren.push(levelUpdates[level])
      }
    })

    updatedCompetency.children = mergedChildren.sort((left, right) => {
      const leftNumber = Number((left.level ?? '').toString().replace('L', ''))
      const rightNumber = Number((right.level ?? '').toString().replace('L', ''))
      return leftNumber - rightNumber
    })

    return updatedCompetency
  })
}

/**
 * Converts competency API rows into the map-page list format.
 */
export function transformCompetencies(apiData: FracApiEntity[]): Array<{ code: string; label: string; levels: CompetencyLevelView[] }> {
  return (apiData || []).map((item) => {
    const code = (item.code ?? '').toString()
    const fromChildren = Array.isArray(item.children)
      ? item.children.map((child) => ({
        level: (child.level || `L${child.levelId || ''}`).toString(),
        code: (child.entityCode || code).toString(),
      }))
      : []

    const fromLevels = Array.isArray(item.levels)
      ? item.levels
        .map((level) => {
          const levelNumber = Number(level?.levelNumber ?? level?.level ?? level?.levelId)
          if (!Number.isFinite(levelNumber) || levelNumber <= 0) {
            return null
          }

          return {
            level: `L${levelNumber}`,
            code,
          }
        })
        .filter((level): level is CompetencyLevelView => Boolean(level))
      : []

    return {
      code,
      label: (item.name ?? '').toString(),
      levels: fromChildren.length ? fromChildren : fromLevels,
    }
  })
}

/**
 * Converts activity API rows into the map-page list format.
 */
export function transformActivities(entity: FracApiEntity[]): Array<{
  code: string
  title: string
  competencyDetails: Array<{ code: string; label: string; levels: string }>
}> {
  return (entity || []).map(item => ({
    code: (item.code ?? '').toString(),
    title: (item.name ?? '').toString(),
    competencyDetails: [],
  }))
}

/**
 * Extracts entity array from all known FRAC backend response shapes.
 */
export function extractEntityList(response: FracSearchResponse | FracApiEntity[] | null | undefined): FracApiEntity[] {
  if (!response) {
    return []
  }

  if (Array.isArray(response)) {
    return response
  }

  const entityList =
    response?.result?.entity ||
    response?.result?.data?.entity ||
    response?.data?.entity ||
    response?.entity

  return Array.isArray(entityList) ? entityList : []
}

/**
 * Builds updated activity payload rows by merging edited table rows into original API data.
 */
export function transformActivityForUpdate(originalData: FlatEntityRow[], editedRows: FlatEntityRow[]): FlatEntityRow[] {
  if (!Array.isArray(originalData) || !Array.isArray(editedRows)) {
    return originalData
  }

  return originalData.map((activity) => {
    const activityCode = (activity.code ?? '').toString()
    const edited = editedRows.find(row => (row.code ?? '').toString() === activityCode)
    if (!edited) {
      return activity
    }

    return {
      ...activity,
      code: edited.code ?? activity.code,
      name: edited.name ?? activity.name,
      description: edited.description ?? activity.description,
      type: edited.type ?? activity.type,
      status: edited.status ?? activity.status,
      children: Array.isArray(activity.children) ? [...(activity.children as FlatEntityRow[])] : [],
    }
  })
}

export interface RoleActivityDetail {
  code: string
  label: string
}

export interface RoleItem {
  code: string
  title: string
  expanded?: boolean
  activityDetails?: RoleActivityDetail[]
}

/**
 * Converts role API rows into the role-mapping list format.
 */
export function transformRoles(apiEntity: FracApiEntity[]): RoleItem[] {
  if (!Array.isArray(apiEntity)) {
    return []
  }

  return apiEntity.map(item => ({
    code: (item.additionalProperties?.Code || item.code || '').toString(),
    title: (item.name || '').toString(),
    expanded: false,
    activityDetails: [],
  }))
}

export interface PositionRoleDetail {
  code: string
  label: string
}

export interface PositionItem {
  code: string
  title: string
  expanded?: boolean
  roleDetails?: PositionRoleDetail[]
}

/**
 * Converts position API rows into the position-mapping list format.
 */
export function transformPositions(apiEntity: FracApiEntity[]): PositionItem[] {
  if (!Array.isArray(apiEntity)) {
    return []
  }

  return apiEntity.map(item => ({
    code: (item.additionalProperties?.Code || item.code || '').toString(),
    title: (item.name || '').toString(),
    expanded: false,
    roleDetails: [],
  }))
}

/**
 * Sorts entities by code first and by title/name second.
 */
export function sortEntitiesForDisplay(entities: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return [...(entities || [])].sort((left, right) => {
    const leftCode = normalizeSortValue(left?.code || (left?.additionalProperties as Record<string, unknown> | undefined)?.Code)
    const rightCode = normalizeSortValue(right?.code || (right?.additionalProperties as Record<string, unknown> | undefined)?.Code)
    const codeComparison = compareSortValues(leftCode, rightCode)
    if (codeComparison !== 0) {
      return codeComparison
    }

    const leftName = normalizeSortValue(left?.name || left?.title)
    const rightName = normalizeSortValue(right?.name || right?.title)
    return compareSortValues(leftName, rightName)
  })
}

/**
 * Converts raw values into normalized sort strings.
 */
export function normalizeSortValue(value: unknown): string {
  return (value ?? '').toString().trim()
}

/**
 * Locale-aware comparator with numeric ordering support.
 */
export function compareSortValues(left: string, right: string): number {
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' })
}

/**
 * Maps language display text to API language code.
 */
export function getLanguageCode(language: string): string {
  const normalized = (language || '').trim().toLowerCase()
  const languageMap: Record<string, string> = {
    english: 'en',
    hindi: 'hi',
    kannada: 'kn',
    tamil: 'ta',
  }

  return languageMap[normalized] || 'en'
}

/**
 * Creates stable cache keys for mapping screens.
 */
export function makeMappingKey(language: string, entityCode: string): string {
  return `${language.trim().toLowerCase()}::${(entityCode || '').trim()}`
}

/**
 * Reads the entity code part from a mapping cache key.
 */
export function getCodeFromKey(key: string): string {
  const separator = '::'
  const separatorIndex = key.indexOf(separator)
  if (separatorIndex === -1) {
    return key
  }

  return key.slice(separatorIndex + separator.length)
}
