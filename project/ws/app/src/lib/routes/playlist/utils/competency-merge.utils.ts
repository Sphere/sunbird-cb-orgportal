/**
 * Non-destructive merge utilities for competency playlist payloads.
 * These functions ensure updates ONLY modify changed fields and PRESERVE
 * all existing data — no deletions, no data loss.
 *
 * Extracted from CompetencyTransformer to keep that class focused on
 * raw-API → playlist-format transformations only.
 */

import {
    PlaylistCompetency,
    PlaylistCompetencyLevel,
    CourseLanguageMapping,
    CompetencyPayloadEntry,
} from './competency-transformer.types'

// ---------------------------------------------------------------------------

/**
 * Deep-merges two objects, preserving all keys from `existing`.
 * Only updates/adds keys present in `updates`. Never removes keys.
 */
export function deepMergePreserve(
    existing: Record<string, unknown>,
    updates: Record<string, unknown>
): Record<string, unknown> {
    if (!existing) return updates
    if (!updates) return existing

    const merged = { ...existing }

    Object.keys(updates).forEach(key => {
        const val = updates[key]
        if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
            merged[key] = deepMergePreserve(
                (existing[key] as Record<string, unknown>) || {},
                val as Record<string, unknown>
            )
        } else {
            merged[key] = val
        }
    })

    return merged
}

/**
 * Merges course language mappings for a single level.
 * Preserves courses for all languages; updates only the languages present in `newCourses`.
 */
export function mergeCourses(
    existingCourses: CourseLanguageMapping[],
    newCourses: CourseLanguageMapping[]
): CourseLanguageMapping[] {
    const merged = [...existingCourses]

    newCourses.forEach(newCourse => {
        const existingIndex = merged.findIndex(c => c.lang === newCourse.lang)
        if (existingIndex !== -1) {
            merged[existingIndex] = newCourse
        } else {
            merged.push(newCourse)
        }
    })

    return merged
}

/**
 * Merges level descriptions preserving ALL existing data.
 * - Preserves all existing levels
 * - Updates only specified fields for existing levels
 * - Adds new levels when they don't exist yet
 * - NEVER removes any level or field
 */
export function mergeLevelDescriptions(
    existingLevels: PlaylistCompetencyLevel[],
    newLevels: PlaylistCompetencyLevel[],
    language: string
): PlaylistCompetencyLevel[] {
    if (!existingLevels || existingLevels.length === 0) {
        return newLevels
    }

    const merged = [...existingLevels]

    newLevels.forEach(newLevel => {
        const existingIndex = merged.findIndex(l => l.level === newLevel.level)

        if (existingIndex !== -1) {
            const existing = merged[existingIndex]
            const mergedLevel: PlaylistCompetencyLevel = { ...existing }

            if (language === 'en') {
                if (newLevel.name) mergedLevel.name = newLevel.name
                if (newLevel.description) mergedLevel.description = newLevel.description
            } else {
                const langNameKey = `lang-${language}-name`
                const langDescKey = `lang-${language}-description`
                if (newLevel[langNameKey]) mergedLevel[langNameKey] = newLevel[langNameKey]
                if (newLevel[langDescKey]) mergedLevel[langDescKey] = newLevel[langDescKey]
            }

            if (newLevel.course) {
                mergedLevel.course = mergeCourses(existing.course || [], newLevel.course)
            }

            // Preserve any other custom fields not handled above
            Object.keys(newLevel).forEach(key => {
                if (!['level', 'name', 'description', 'course'].includes(key) && !key.startsWith('lang-')) {
                    mergedLevel[key] = newLevel[key]
                }
            })

            merged[existingIndex] = mergedLevel
        } else {
            merged.push(newLevel)
        }
    })

    return merged
}

/**
 * Merges a single competency (non-destructive).
 * Preserves ALL existing fields, updating only the changed ones.
 */
export function mergeCompetency(
    existing: PlaylistCompetency,
    update: PlaylistCompetency,
    language: string,
    authToken: string
): PlaylistCompetency {
    const merged = { ...existing } as PlaylistCompetency & Record<string, unknown>

    merged.updatedDate = new Date().toISOString()
    merged.updatedBy = authToken

    if (language === 'en') {
        if (update.name) merged.name = update.name
        if (update.description) merged.description = update.description
    }

    if (update.additionalProperties) {
        merged.additionalProperties = { ...existing.additionalProperties }

        if (language !== 'en') {
            const langNameKey = `lang-${language}-name`
            const langDescKey = `lang-${language}-description`
            if (update.additionalProperties[langNameKey]) {
                merged.additionalProperties[langNameKey] = update.additionalProperties[langNameKey]
            }
            if (update.additionalProperties[langDescKey]) {
                merged.additionalProperties[langDescKey] = update.additionalProperties[langDescKey]
            }
        }

        if (update.additionalProperties.competencyLevelDescription) {
            merged.additionalProperties.competencyLevelDescription = mergeLevelDescriptions(
                existing.additionalProperties.competencyLevelDescription || [],
                update.additionalProperties.competencyLevelDescription,
                language
            )
        }

        Object.keys(update.additionalProperties).forEach(key => {
            if (
                key !== 'competencyLevelDescription' &&
                !key.startsWith('lang-') &&
                !['CompentencyType', 'CompetencyArea', 'Code'].includes(key)
            ) {
                merged.additionalProperties[key] = update.additionalProperties[key]
            }
        })
    }

    // Preserve all other top-level fields from existing
    Object.keys(existing).forEach(key => {
        if (!(key in merged)) {
            (merged as unknown as Record<string, unknown>)[key] = (existing as unknown as Record<string, unknown>)[key]
        }
    })

    return merged as PlaylistCompetency
}

/**
 * Updates an existing playlist payload non-destructively.
 *
 * - Preserves ALL existing competencies
 * - Updates only changed fields
 * - Handles position changes (c2 → c3)
 * - Adds new competencies if needed
 * - NEVER removes any data
 */
export function updatePayloadNonDestructive(
    existingPayload: CompetencyPayloadEntry[],
    updates: CompetencyPayloadEntry[],
    language: string,
    authToken: string = 'system'
): CompetencyPayloadEntry[] {
    if (!existingPayload || existingPayload.length === 0) {
        return updates
    }

    const existingMap = new Map<number, { key: string; data: PlaylistCompetency; item: CompetencyPayloadEntry }>()
    existingPayload.forEach(item => {
        const key = Object.keys(item)[0]
        const comp = item[key]
        if (comp.id) {
            existingMap.set(comp.id, { key, data: comp, item })
        }
    })

    const result: CompetencyPayloadEntry[] = []
    const processedIds = new Set<number>()

    updates.forEach(updateItem => {
        const updateKey = Object.keys(updateItem)[0]
        const updateComp = updateItem[updateKey]

        if (existingMap.has(updateComp.id)) {
            const existing = existingMap.get(updateComp.id)!
            const merged = mergeCompetency(existing.data, updateComp, language, authToken)
            result.push({ [updateKey]: merged })
            processedIds.add(updateComp.id)
        } else {
            result.push(updateItem)
            processedIds.add(updateComp.id)
        }
    })

    // Keep any existing competencies not included in updates
    existingPayload.forEach(item => {
        const key = Object.keys(item)[0]
        const comp = item[key]
        if (comp.id && !processedIds.has(comp.id)) {
            result.push(item)
        }
    })

    return result
}

/**
 * Changes the root key of a competency item (e.g. c2 → c3) while preserving all data.
 */
export function changeCompetencyPosition(
    competencyItem: CompetencyPayloadEntry,
    newCode: string
): CompetencyPayloadEntry {
    const oldKey = Object.keys(competencyItem)[0]
    const competency = competencyItem[oldKey]
    const newKey = newCode.toLowerCase()

    if (competency.additionalProperties) {
        competency.additionalProperties.Code = newCode
    }

    return { [newKey]: competency }
}
