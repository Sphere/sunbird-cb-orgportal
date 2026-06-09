/**
 * Type definitions for the competency transformer.
 * Shared by competency-transformer.ts and competency-merge.utils.ts.
 */

// ---------------------------------------------------------------------------
// Raw API Response Interfaces
// ---------------------------------------------------------------------------

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
    additionalProperties?: Record<string, unknown>
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
    additionalProperties?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Playlist Competency Format Interfaces
// ---------------------------------------------------------------------------

export interface PlaylistCompetency {
    id: number
    type: string
    name: string
    description: string
    additionalProperties: {
        CompentencyType?: string
        CompetencyArea?: string
        Code: string
        /** Language-specific name/description fields, e.g. lang-hi-name */
        [key: string]: unknown
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
    children: unknown[]
}

export interface PlaylistCompetencyLevel {
    level: string
    name: string
    description: string
    /** Language-specific name/description fields, e.g. lang-hi-name */
    [key: string]: unknown
    course?: CourseLanguageMapping[]
}

export interface CourseLanguageMapping {
    lang: string
    id: string
}

/**
 * A single entry in the playlist competency payload array.
 * Key is the lowercase code (e.g. "c97"), value is the full competency object.
 */
export type CompetencyPayloadEntry = Record<string, PlaylistCompetency>
