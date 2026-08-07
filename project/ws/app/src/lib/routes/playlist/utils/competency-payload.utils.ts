/**
 * Utility functions for building competency playlist API payloads.
 * Extracted from ManageCompetencyOrderComponent to keep business logic
 * testable and the component focused on UI concerns.
 */

import { SelectableCompetency, CompetencyLevel } from '../models/competency.model'
import { Playlist } from '../models/playlist.model'
import { PLAYLIST_COMPETENCY_DEFAULTS } from '../constants/playlist.constants'

// ---------------------------------------------------------------------------
// Internal shapes — used only within this file
// ---------------------------------------------------------------------------

interface ExistingCompetencyItem {
    id?: any
    code?: string
    createdDate?: string
    createdBy?: string
    reviewedDate?: string | null
    reviewedBy?: string | null
    [key: string]: unknown
}

interface ExistingLevelItem {
    level: number | string
    courseId?: string
    name?: string
    courseName?: string
    description?: string
}

export interface CompetencyLevelPayload {
    level: number
    name: string
    description: string
    courseId?: string
}

export interface CompetencyPayloadItem {
    id: any
    code: string
    name: string | undefined
    description: string
    type: string
    area: string
    levels: CompetencyLevelPayload[]
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
    index?: number
    [key: string]: unknown
}

// ---------------------------------------------------------------------------

/**
 * Normalizes competency code for reliable comparisons.
 */
function normalizeCode(code: string | null | undefined): string {
    return String(code || '').trim().toUpperCase()
}

/**
 * Finds a competency entry in the existing playlist payload by code (preferred) with ID fallback.
 * Returns null if not found or if input is invalid.
 */
export function findExistingCompetency(
    competencyCode: string,
    competencyId: string,
    existingPlaylist?: Playlist
): ExistingCompetencyItem | null {
    if (!existingPlaylist?.dataSource?.payload) return null

    const targetCode = normalizeCode(competencyCode)
    const compId = parseInt(competencyId, 10)

    for (const item of existingPlaylist.dataSource.payload as ExistingCompetencyItem[]) {
        const itemCode = normalizeCode(item?.code)
        if (targetCode && itemCode && itemCode === targetCode) {
            return item
        }
        if (!targetCode && !isNaN(compId) && item?.id === compId) return item
    }
    return null
}

/**
 * Builds the levels array for a competency in V2 API format.
 * Includes courseId directly on each level when assigned.
 */
export function buildLevels(comp: SelectableCompetency): CompetencyLevelPayload[] {
    if (!comp.levels || comp.levels.length === 0) {
        return []
    }

    return comp.levels.map((level: CompetencyLevel) => {
        const levelData: CompetencyLevelPayload = {
            level: level.level,
            name: level.name || '',
            description: level.description || '',
        }

        if (level.courseId) {
            levelData.courseId = level.courseId
        }

        return levelData
    })
}

/**
 * Builds a single competency object in the V2 format the API expects.
 * Preserves original audit timestamps from the existing playlist when available.
 */
export function buildCompetencyData(
    comp: SelectableCompetency,
    code: string,
    authToken: string,
    existingPlaylist?: Playlist
): CompetencyPayloadItem {
    const now = new Date().toISOString()
    const existingCompetency = findExistingCompetency(code, comp.id, existingPlaylist)

    return {
        id: comp.id || 10,
        code,
        name: comp.name,
        description: comp.description || '',
        type: comp.type || PLAYLIST_COMPETENCY_DEFAULTS.TYPE,
        area: PLAYLIST_COMPETENCY_DEFAULTS.AREA,
        levels: buildLevels(comp),

        status: PLAYLIST_COMPETENCY_DEFAULTS.STATUS,
        source: null,
        level: PLAYLIST_COMPETENCY_DEFAULTS.LEVEL,
        levelId: PLAYLIST_COMPETENCY_DEFAULTS.LEVEL_ID,
        isActive: true,

        createdDate: existingCompetency?.createdDate || now,
        createdBy: existingCompetency?.createdBy || authToken,
        updatedDate: now,
        updatedBy: authToken,

        reviewedDate: existingCompetency?.reviewedDate || null,
        reviewedBy: existingCompetency?.reviewedBy || null,
    }
}

/**
 * Converts the ordered UI competency list into the flat V2 payload array.
 * Each item gets an `index` field reflecting its 0-based position.
 */
export function buildPlaylistPayload(
    competencies: SelectableCompetency[],
    authToken: string,
    existingPlaylist?: Playlist
): CompetencyPayloadItem[] {
    return competencies.map((comp, arrayIndex) => {
        const code = comp.code || `C${comp.id}`
        const competencyData = buildCompetencyData(comp, code, authToken, existingPlaylist)
        competencyData.index = arrayIndex
        return competencyData
    })
}

/**
 * Restores previously saved course assignments onto a competency's levels.
 * Used when editing an existing playlist to pre-populate dropdowns.
 */
export function restoreSavedCourseAssignments(
    competency: SelectableCompetency,
    playlistPayload: ExistingCompetencyItem[]
): void {
    if (!playlistPayload || !competency?.id || !competency.levels) return

    const targetCode = normalizeCode(competency.code)
    const targetId = parseInt(competency.id, 10)

    const existingComp = playlistPayload.find(item => {
        const itemCode = normalizeCode(item?.code)
        if (targetCode && itemCode) {
            return itemCode === targetCode
        }
        return !isNaN(targetId) && item?.id === targetId
    })

    if (!existingComp || !existingComp['levels']) return

    const savedLevels = existingComp['levels'] as ExistingLevelItem[]

    competency.levels.forEach(level => {
        const savedLevel = savedLevels.find(l => String(l.level) === String(level.level))
        if (savedLevel) {
            if (savedLevel.courseId) {
                level.courseId = savedLevel.courseId
            }
            if (savedLevel.courseName) {
                level.courseName = savedLevel.courseName
            }
            if (savedLevel.name) {
                level.name = savedLevel.name
            }
            if (savedLevel.description) {
                level.description = savedLevel.description
            }
        }
    })
}
