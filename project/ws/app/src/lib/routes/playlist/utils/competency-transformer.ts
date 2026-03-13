/**
 * Competency Data Transformer
 *
 * Transforms raw competency data from the entity API into the playlist-compatible
 * format required for competency-based playlists.
 *
 * Key Transformations:
 * 1. Root key transformation: Uses lowercase code (c97 → c97, C98 → c98)
 * 2. Language-based field mapping:
 *    - English: Uses outer name/description fields
 *    - Other languages: Adds lang-{code}-name and lang-{code}-description to additionalProperties
 * 3. Level-wise transformations with language support
 * 4. Course mapping (language-specific)
 *
 * @module CompetencyTransformer
 */

import { log } from './playlist-logger.utils'

// ---------------------------------------------------------------------------
// Re-export types so existing imports stay unchanged
// ---------------------------------------------------------------------------
export type {
    RawCompetencyEntity,
    RawCompetencyLevel,
    PlaylistCompetency,
    PlaylistCompetencyLevel,
    CourseLanguageMapping,
    CompetencyPayloadEntry,
} from './competency-transformer.types'

// Re-export merge utils so callers that import from this file still work
export {
    deepMergePreserve,
    mergeCourses,
    mergeLevelDescriptions,
    mergeCompetency,
    updatePayloadNonDestructive,
    changeCompetencyPosition,
} from './competency-merge.utils'

import type {
    RawCompetencyEntity,
    RawCompetencyLevel,
    PlaylistCompetency,
    PlaylistCompetencyLevel,
    CompetencyPayloadEntry,
} from './competency-transformer.types'

// ---------------------------------------------------------------------------
// Legacy type alias — kept for backward compatibility
// ---------------------------------------------------------------------------
/** @deprecated Use CompetencyPayloadEntry instead */
export type CompetencyPayloadItem = CompetencyPayloadEntry

// ---------------------------------------------------------------------------
// Core transformer class
// ---------------------------------------------------------------------------

/**
 * Handles all transformations from raw API data to playlist format.
 */
export class CompetencyTransformer {

    /**
     * Transforms a raw competency entity into the playlist competency format.
     *
     * @param rawEntity - Raw competency data from API
     * @param language - Selected language code (e.g. 'en', 'hi', 'kn')
     * @param existingCompetency - Optional existing competency for non-destructive updates
     * @param authToken - Logged-in user token for audit fields
     * @returns Transformed competency keyed by its lowercase code, e.g. `{ c97: {...} }`
     */
    static transformToPlaylistFormat(
        rawEntity: RawCompetencyEntity,
        language: string = 'en',
        existingCompetency?: PlaylistCompetency,
        authToken: string = 'system'
    ): CompetencyPayloadEntry {
        const rootKey = rawEntity.code.toLowerCase()
        const timestamp = new Date().toISOString()

        const { name, description, langNameKey, langDescKey } = this.buildLanguageFields(
            rawEntity.name,
            rawEntity.description,
            language
        )

        const levelDescriptions = this.transformLevels(rawEntity.children, language, existingCompetency)

        const additionalProperties: PlaylistCompetency['additionalProperties'] = {
            CompentencyType: rawEntity.entityType || 'Domain',
            CompetencyArea: rawEntity.area || 'General',
            Code: rawEntity.code,
            competencyLevelDescription: levelDescriptions,
        }

        if (language !== 'en') {
            additionalProperties[langNameKey] = name
            additionalProperties[langDescKey] = description
        }

        // Preserve existing language fields when updating
        if (existingCompetency?.additionalProperties) {
            Object.keys(existingCompetency.additionalProperties).forEach(key => {
                if (key.startsWith('lang-') && !key.includes(`lang-${language}-`)) {
                    additionalProperties[key] = existingCompetency.additionalProperties[key]
                }
            })
        }

        const competency: PlaylistCompetency = {
            id: rawEntity.id,
            type: 'Competency',
            name: language === 'en' ? name : (existingCompetency?.name || name),
            description: language === 'en' ? description : (existingCompetency?.description || description),
            additionalProperties,
            status: 'UNVERIFIED',
            source: null,
            level: 'INITIATE',
            levelId: 0,
            isActive: true,
            createdDate: existingCompetency?.createdDate || timestamp,
            createdBy: existingCompetency?.createdBy || authToken,
            updatedDate: timestamp,
            updatedBy: authToken,
            reviewedDate: existingCompetency?.reviewedDate || null,
            reviewedBy: existingCompetency?.reviewedBy || null,
            wfId: null,
            children: [],
        }

        return { [rootKey]: competency }
    }

    /**
     * Builds language-specific name/description fields and their key names.
     */
    private static buildLanguageFields(
        name: string,
        description: string,
        language: string
    ): { name: string; description: string; langNameKey: string; langDescKey: string } {
        return {
            name,
            description,
            langNameKey: `lang-${language}-name`,
            langDescKey: `lang-${language}-description`,
        }
    }

    /**
     * Transforms raw competency levels (children) into playlist level format.
     */
    private static transformLevels(
        rawLevels: RawCompetencyLevel[],
        language: string,
        existingCompetency?: PlaylistCompetency
    ): PlaylistCompetencyLevel[] {
        return rawLevels.map((rawLevel, index) => {
            const levelNumber = String(rawLevel.levelId || index + 1)

            const { name, description, langNameKey, langDescKey } = this.buildLanguageFields(
                rawLevel.name,
                rawLevel.description,
                language
            )

            const level: PlaylistCompetencyLevel = {
                level: levelNumber,
                name: language === 'en' ? name : '',
                description: language === 'en' ? description : '',
                course: [],
            }

            if (language !== 'en') {
                level[langNameKey] = name
                level[langDescKey] = description

                const existingLevel = this.findExistingLevel(existingCompetency, levelNumber)
                if (existingLevel) {
                    level.name = existingLevel.name || ''
                    level.description = existingLevel.description || ''
                }
            }

            if (existingCompetency) {
                const existingLevel = this.findExistingLevel(existingCompetency, levelNumber)
                if (existingLevel?.course) {
                    level.course = [...existingLevel.course]
                }
            }

            return level
        })
    }

    /** Finds an existing level by level number within a competency's additionalProperties. */
    private static findExistingLevel(
        existingCompetency: PlaylistCompetency | undefined,
        levelNumber: string
    ): PlaylistCompetencyLevel | undefined {
        if (!existingCompetency?.additionalProperties?.competencyLevelDescription) {
            return undefined
        }
        return existingCompetency.additionalProperties.competencyLevelDescription.find(
            l => l.level === levelNumber
        )
    }

    /**
     * Updates the course mapping for a specific competency level.
     */
    static updateLevelCourse(
        competency: PlaylistCompetency,
        levelNumber: string,
        courseId: string,
        language: string
    ): PlaylistCompetency {
        const levels = competency.additionalProperties.competencyLevelDescription
        const levelIndex = levels.findIndex(l => l.level === levelNumber)

        if (levelIndex === -1) {
            log.warn(`Level ${levelNumber} not found`)
            return competency
        }

        const level = levels[levelIndex]

        if (!level.course) {
            level.course = []
        }

        const existingCourseIndex = level.course.findIndex(c => c.lang === language)
        if (existingCourseIndex !== -1) {
            level.course[existingCourseIndex].id = courseId
        } else {
            level.course.push({ lang: language, id: courseId })
        }

        competency.updatedDate = new Date().toISOString()
        return competency
    }

    /**
     * Builds a complete playlist payload from multiple raw competency entities.
     */
    static buildPlaylistPayload(
        rawEntities: RawCompetencyEntity[],
        language: string = 'en',
        existingPayload?: CompetencyPayloadEntry[],
        authToken: string = 'system'
    ): CompetencyPayloadEntry[] {
        return rawEntities.map(rawEntity => {
            const existingCompetency = existingPayload?.find(item => {
                const keys = Object.keys(item)
                return keys.length > 0 && item[keys[0]].id === rawEntity.id
            })

            const existingData = existingCompetency
                ? existingCompetency[Object.keys(existingCompetency)[0]]
                : undefined

            return this.transformToPlaylistFormat(rawEntity, language, existingData, authToken)
        })
    }

    /**
     * Validates that all levels have courses assigned for all required languages.
     */
    static validateCoursesComplete(competency: PlaylistCompetency, requiredLanguages: string[]): boolean {
        const levels = competency.additionalProperties.competencyLevelDescription

        for (const level of levels) {
            if (!level.course || level.course.length === 0) {
                log.warn(`Level ${level.level} has no courses`)
                return false
            }

            for (const lang of requiredLanguages) {
                const hasCourse = level.course.some(c => c.lang === lang && c.id)
                if (!hasCourse) {
                    log.warn(`Level ${level.level} missing course for language: ${lang}`)
                    return false
                }
            }
        }

        return true
    }
}
