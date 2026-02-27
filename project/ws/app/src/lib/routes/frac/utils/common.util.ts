import { FracApiEntity, FracSearchResponse } from '../models/frac-api.models'

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
