/**
 * Competency Data Transformer
 * 
 * This utility transforms raw competency data from the entity API
 * into the playlist-compatible format required for competency-based playlists.
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

/**
 * Raw API Response Interfaces
 */
export interface RawCompetencyEntity {
    id: number
    type: string
    name: string
    description: string
    language: string
    code: string
    level: string
    levelId: number
    status: string
    entityType?: string
    area?: string
    additionalProperties?: any
    children: RawCompetencyLevel[]
    createdDate?: string
    createdBy?: string
    updatedDate?: string
    updatedBy?: string
}

export interface RawCompetencyLevel {
    id: number
    code: string
    level: string
    levelId: number
    name: string
    description: string
    language: string
    type: string
    status: string
    additionalProperties?: any
}

/**
 * Playlist Competency Format Interfaces
 */
export interface PlaylistCompetency {
    id: number
    type: string
    name: string
    description: string
    additionalProperties: {
        CompentencyType?: string
        CompetencyArea?: string
        Code: string
        [key: string]: any  // For lang-{code}-name, lang-{code}-description
        competencyLevelDescription: PlaylistCompetencyLevel[]
    }
    status: string
    source: null
    level: string
    levelId: number
    isActive: boolean
    createdDate: string
    createdBy: string
    updatedDate: string
    updatedBy: string
    reviewedDate: string | null
    reviewedBy: string | null
    wfId: null
    children: any[]
}

export interface PlaylistCompetencyLevel {
    level: string
    name: string
    description: string
    [key: string]: any  // For lang-{code}-name, lang-{code}-description, course
    course?: CourseLanguageMapping[]
}

export interface CourseLanguageMapping {
    lang: string
    id: string
}

/**
 * Competency Transformer Class
 * Handles all transformations from raw API data to playlist format
 */
export class CompetencyTransformer {

    /**
     * Transform raw competency entity to playlist competency format
     * 
     * @param rawEntity - Raw competency data from API
     * @param language - Selected language code (e.g., 'en', 'hi', 'ka')
     * @param existingCompetency - Optional existing competency data for updates
     * @param authToken - Logged-in user token for audit fields
     * @returns Transformed competency object ready for playlist payload
     * 
     * @example
     * ```typescript
     * const raw = apiResponse.result.data.entity[0]
     * const transformed = CompetencyTransformer.transformToPlaylistFormat(raw, 'hi', null, 'user@example.com')
     * // Result: { c97: { id: 661, name: "Pregnancy Identification", ... } }
     * ```
     */
    static transformToPlaylistFormat(
        rawEntity: RawCompetencyEntity,
        language: string = 'en',
        existingCompetency?: any,
        authToken: string = 'system'
    ): { [key: string]: PlaylistCompetency } {



        // Generate root key: lowercase code (C97 → c97)
        const rootKey = rawEntity.code.toLowerCase()

        // Current timestamp for audit fields
        const timestamp = new Date().toISOString()

        // Build name and description based on language
        const { name, description, langNameKey, langDescKey } = this.buildLanguageFields(
            rawEntity.name,
            rawEntity.description,
            language
        )

        // Transform competency levels
        const levelDescriptions = this.transformLevels(
            rawEntity.children,
            language,
            existingCompetency
        )

        // Build additionalProperties
        const additionalProperties: any = {
            CompentencyType: rawEntity.entityType || 'Domain',
            CompetencyArea: rawEntity.area || 'General',
            Code: rawEntity.code,
            competencyLevelDescription: levelDescriptions
        }

        // Add language-specific name/description if not English
        if (language !== 'en') {
            additionalProperties[langNameKey] = name
            additionalProperties[langDescKey] = description
        }

        // Preserve existing language data if updating
        if (existingCompetency?.additionalProperties) {
            Object.keys(existingCompetency.additionalProperties).forEach(key => {
                if (key.startsWith('lang-') && !key.includes(`lang-${language}-`)) {
                    additionalProperties[key] = existingCompetency.additionalProperties[key]
                }
            })
        }

        // Build the competency object
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
            children: []
        }



        return { [rootKey]: competency }
    }

    /**
     * Build language-specific name and description fields
     * 
     * @param name - Raw name from API
     * @param description - Raw description from API
     * @param language - Language code
     * @returns Object with name, description, and language-specific key names
     */
    private static buildLanguageFields(
        name: string,
        description: string,
        language: string
    ): { name: string; description: string; langNameKey: string; langDescKey: string } {

        const langNameKey = `lang-${language}-name`
        const langDescKey = `lang-${language}-description`



        return {
            name,
            description,
            langNameKey,
            langDescKey
        }
    }

    /**
     * Transform competency levels (children) to playlist format
     * 
     * @param rawLevels - Raw level data from API (children array)
     * @param language - Selected language code
     * @param existingCompetency - Existing competency for preserving course mappings
     * @returns Array of transformed levels
     */
    private static transformLevels(
        rawLevels: RawCompetencyLevel[],
        language: string,
        existingCompetency?: any
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
                course: []
            }

            // Add language-specific fields if not English
            if (language !== 'en') {
                level[langNameKey] = name
                level[langDescKey] = description

                // Preserve English name/description from existing if available
                const existingLevel = this.findExistingLevel(existingCompetency, levelNumber)
                if (existingLevel) {
                    level.name = existingLevel.name || ''
                    level.description = existingLevel.description || ''
                }
            }

            // Preserve existing course mappings and add/update for current language
            if (existingCompetency) {
                const existingLevel = this.findExistingLevel(existingCompetency, levelNumber)
                if (existingLevel?.course) {
                    // Keep all existing course mappings
                    level.course = [...existingLevel.course]


                }
            }



            return level
        })
    }

    /**
     * Find existing level by level number
     * 
     * @param existingCompetency - Existing competency object
     * @param levelNumber - Level number to find
     * @returns Existing level or undefined
     */
    private static findExistingLevel(existingCompetency: any, levelNumber: string): PlaylistCompetencyLevel | undefined {
        if (!existingCompetency?.additionalProperties?.competencyLevelDescription) {
            return undefined
        }

        return existingCompetency.additionalProperties.competencyLevelDescription.find(
            (l: PlaylistCompetencyLevel) => l.level === levelNumber
        )
    }

    /**
     * Update course mapping for a specific competency level
     * 
     * @param competency - Playlist competency object
     * @param levelNumber - Level number (1-5)
     * @param courseId - Course identifier
     * @param language - Language code
     * @returns Updated competency object
     * 
     * @example
     * ```typescript
     * const updated = CompetencyTransformer.updateLevelCourse(
     *   competency,
     *   '1',
     *   'do_11373489010840371211888',
     *   'en'
     * )
     * ```
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
            console.warn(`[CompetencyTransformer] Level ${levelNumber} not found`)
            return competency
        }

        const level = levels[levelIndex]

        // Initialize course array if needed
        if (!level.course) {
            level.course = []
        }

        // Find or create course mapping for this language
        const existingCourseIndex = level.course.findIndex(c => c.lang === language)

        if (existingCourseIndex !== -1) {
            // Update existing mapping
            level.course[existingCourseIndex].id = courseId

        } else {
            // Add new mapping
            level.course.push({ lang: language, id: courseId })

        }

        // Update timestamp
        competency.updatedDate = new Date().toISOString()

        return competency
    }

    /**
     * Build complete playlist payload from multiple competencies
     * 
     * @param rawEntities - Array of raw competency entities
     * @param language - Selected language
     * @param existingPayload - Existing playlist payload for updates
     * @param authToken - User token
     * @returns Array of competency objects in playlist format
     * 
     * @example
     * ```typescript
     * const payload = CompetencyTransformer.buildPlaylistPayload(
     *   apiResponse.result.data.entity,
     *   'hi',
     *   existingPlaylist?.dataSource?.payload
     * )
     * // Result: [{ c97: {...} }, { c98: {...} }]
     * ```
     */
    static buildPlaylistPayload(
        rawEntities: RawCompetencyEntity[],
        language: string = 'en',
        existingPayload?: any[],
        authToken: string = 'system'
    ): any[] {



        return rawEntities.map((rawEntity) => {
            // Find existing competency by ID
            const existingCompetency = existingPayload?.find((item: any) => {
                const keys = Object.keys(item)
                if (keys.length > 0) {
                    const comp = item[keys[0]]
                    return comp.id === rawEntity.id
                }
                return false
            })

            const existingData = existingCompetency ? existingCompetency[Object.keys(existingCompetency)[0]] : undefined

            return this.transformToPlaylistFormat(rawEntity, language, existingData, authToken)
        })
    }

    /**
     * Validate that all levels have courses assigned for all languages
     * 
     * @param competency - Playlist competency object
     * @param requiredLanguages - Array of required language codes
     * @returns True if all levels have courses for all required languages
     */
    static validateCoursesComplete(competency: PlaylistCompetency, requiredLanguages: string[]): boolean {
        const levels = competency.additionalProperties.competencyLevelDescription

        for (const level of levels) {
            if (!level.course || level.course.length === 0) {
                console.warn(`[CompetencyTransformer] Level ${level.level} has no courses`)
                return false
            }

            for (const lang of requiredLanguages) {
                const hasCourse = level.course.some(c => c.lang === lang && c.id)
                if (!hasCourse) {
                    console.warn(`[CompetencyTransformer] Level ${level.level} missing course for language: ${lang}`)
                    return false
                }
            }
        }


        return true
    }

    /**
     * ========================================================================
     * NON-DESTRUCTIVE UPDATE METHODS
     * ========================================================================
     * 
     * These methods ensure that updates ONLY modify changed fields
     * and PRESERVE all existing data (no data loss)
     */

    /**
     * Deep merge two objects, preserving all keys from existing
     * Only updates/adds keys from updates object
     * Never removes keys
     * 
     * @param existing - Existing object with all current data
     * @param updates - Object with only the fields to update/add
     * @returns Merged object with all fields preserved
     */
    static deepMergePreserve(existing: any, updates: any): any {
        if (!existing) return updates
        if (!updates) return existing

        const merged = { ...existing }

        Object.keys(updates).forEach(key => {
            if (updates[key] !== null && typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
                // Recursively merge nested objects
                merged[key] = this.deepMergePreserve(existing[key] || {}, updates[key])
            } else {
                // For primitives and arrays, use update value
                merged[key] = updates[key]
            }
        })

        return merged
    }

    /**
     * Merge competency level descriptions preserving ALL existing data
     * - Preserves all existing levels
     * - Updates only specified fields for existing levels
     * - Adds new levels if they don't exist
     * - NEVER removes any level or field
     * 
     * @param existingLevels - Current level descriptions
     * @param newLevels - New/updated level descriptions
     * @param language - Language being updated
     * @returns Merged levels with all data preserved
     */
    static mergeLevelDescriptions(
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
                // Level exists - merge preserving all fields
                const existing = merged[existingIndex]

                // Preserve ALL existing fields
                const mergedLevel: any = { ...existing }

                // Update only for the selected language
                if (language === 'en') {
                    // For English, update outer name/description
                    if (newLevel.name) mergedLevel.name = newLevel.name
                    if (newLevel.description) mergedLevel.description = newLevel.description
                } else {
                    // For other languages, update lang-specific keys
                    const langNameKey = `lang-${language}-name`
                    const langDescKey = `lang-${language}-description`

                    if (newLevel[langNameKey]) mergedLevel[langNameKey] = newLevel[langNameKey]
                    if (newLevel[langDescKey]) mergedLevel[langDescKey] = newLevel[langDescKey]
                }

                // Merge course mappings (don't replace, merge)
                if (newLevel.course) {
                    mergedLevel.course = this.mergeCourses(
                        existing.course || [],
                        newLevel.course
                    )
                }

                // Preserve any other custom fields
                Object.keys(newLevel).forEach(key => {
                    if (!['level', 'name', 'description', 'course'].includes(key) &&
                        !key.startsWith('lang-')) {
                        mergedLevel[key] = newLevel[key]
                    }
                })

                merged[existingIndex] = mergedLevel


            } else {
                // New level - add it
                merged.push(newLevel)

            }
        })

        return merged
    }

    /**
     * Merge course mappings for a level
     * Preserves courses for all languages, updates only specified language
     * 
     * @param existingCourses - Current course mappings
     * @param newCourses - New course mappings
     * @param language - Language being updated
     * @returns Merged course array
     */
    static mergeCourses(
        existingCourses: CourseLanguageMapping[],
        newCourses: CourseLanguageMapping[]
    ): CourseLanguageMapping[] {

        const merged = [...existingCourses]

        newCourses.forEach(newCourse => {
            const existingIndex = merged.findIndex(c => c.lang === newCourse.lang)

            if (existingIndex !== -1) {
                // Update existing course for this language
                merged[existingIndex] = newCourse

            } else {
                // Add new course for new language
                merged.push(newCourse)

            }
        })

        return merged
    }

    /**
     * Update existing playlist payload with changes (NON-DESTRUCTIVE)
     * 
     * This method:
     * 1. Preserves ALL existing competencies
     * 2. Updates only changed fields
     * 3. Handles position changes (c2 → c3)
     * 4. Adds new competencies if needed
     * 5. NEVER removes any data
     * 
     * @param existingPayload - Current playlist payload
     * @param updates - Array of updated competencies from user changes
     * @param language - Language being updated
     * @returns Updated payload with all data preserved
     * 
     * @example
     * ```typescript
     * // User changes:
     * // - Changed course for C97 level 1 from A to B
     * // - Moved C98 from position 2 to position 3
     * 
     * const updated = CompetencyTransformer.updatePayloadNonDestructive(
     *   existingPaylist.dataSource.payload,
     *   userChanges,
     *   'hi'
     * )
     * // Result: All existing data preserved, only course ID changed
     * ```
     */
    static updatePayloadNonDestructive(
        existingPayload: any[],
        updates: any[],
        language: string,
        authToken: string = 'system'
    ): any[] {



        if (!existingPayload || existingPayload.length === 0) {
            return updates
        }

        // Create a map of existing competencies by ID
        const existingMap = new Map<number, any>()
        existingPayload.forEach(item => {
            const key = Object.keys(item)[0]
            const comp = item[key]
            if (comp.id) {
                existingMap.set(comp.id, { key, data: comp, item })
            }
        })

        const result: any[] = []
        const processedIds = new Set<number>()

        // Process updates in the new order
        updates.forEach((updateItem) => {
            const updateKey = Object.keys(updateItem)[0]
            const updateComp = updateItem[updateKey]

            if (existingMap.has(updateComp.id)) {
                // Existing competency - merge changes
                const existing = existingMap.get(updateComp.id)!

                // Deep merge to preserve all fields
                const merged = this.mergeCompetency(
                    existing.data,
                    updateComp,
                    language,
                    authToken
                )

                // Use the NEW key (handles position changes like c2 → c3)
                result.push({ [updateKey]: merged })
                processedIds.add(updateComp.id)


            } else {
                // New competency - add as is
                result.push(updateItem)
                processedIds.add(updateComp.id)

            }
        })

        // Add any existing competencies that weren't in updates
        // (This ensures we never lose competencies)
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
     * Merge a single competency (non-destructive)
     * Preserves ALL existing fields, updates only changed ones
     * 
     * @param existing - Existing competency data
     * @param update - Updated competency data
     * @param language - Language being updated
     * @param authToken - User token
     * @returns Merged competency with all data preserved
     */
    static mergeCompetency(
        existing: PlaylistCompetency,
        update: PlaylistCompetency,
        language: string,
        authToken: string
    ): PlaylistCompetency {



        // Start with existing data
        const merged: any = { ...existing }

        // Update timestamp and user
        merged.updatedDate = new Date().toISOString()
        merged.updatedBy = authToken

        // Update outer name/description only for English
        if (language === 'en') {
            if (update.name) merged.name = update.name
            if (update.description) merged.description = update.description
        }

        // Merge additionalProperties
        if (update.additionalProperties) {
            merged.additionalProperties = {
                ...existing.additionalProperties
            }

            // Update language-specific fields
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

            // Merge level descriptions (preserving all levels and fields)
            if (update.additionalProperties.competencyLevelDescription) {
                merged.additionalProperties.competencyLevelDescription = this.mergeLevelDescriptions(
                    existing.additionalProperties.competencyLevelDescription || [],
                    update.additionalProperties.competencyLevelDescription,
                    language
                )
            }

            // Preserve any other custom fields in additionalProperties
            Object.keys(update.additionalProperties).forEach(key => {
                if (key !== 'competencyLevelDescription' &&
                    !key.startsWith('lang-') &&
                    !['CompentencyType', 'CompetencyArea', 'Code'].includes(key)) {
                    merged.additionalProperties[key] = update.additionalProperties[key]
                }
            })
        }

        // Preserve all other top-level fields from existing
        // (status, level, levelId, isActive, etc.)
        Object.keys(existing).forEach(key => {
            if (!(key in merged)) {
                merged[key] = (existing as any)[key]
            }
        })


        return merged as PlaylistCompetency
    }

    /**
     * Handle competency position change (e.g., c2 → c3)
     * Updates the root key while preserving all data
     * 
     * @param competencyItem - Competency item with old key
     * @param newCode - New code (e.g., "C3")
     * @returns Competency item with new key
     * 
     * @example
     * ```typescript
     * const item = { c2: { id: 101, ... } }
     * const updated = CompetencyTransformer.changeCompetencyPosition(item, 'C3')
     * // Result: { c3: { id: 101, ... } } (all data preserved)
     * ```
     */
    static changeCompetencyPosition(competencyItem: any, newCode: string): any {
        const oldKey = Object.keys(competencyItem)[0]
        const competency = competencyItem[oldKey]
        const newKey = newCode.toLowerCase()


        // Update the code in additionalProperties
        if (competency.additionalProperties) {
            competency.additionalProperties.Code = newCode
        }

        return { [newKey]: competency }
    }
}
