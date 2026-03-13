/**
 * Playlist Data Models  
 * Defines TypeScript interfaces for playlist-related data structures
 */

/**
 * Filter criteria for playlist search and creation
 */
export interface PlaylistFilters {
    orgId: string
    orgName?: string
    role: string[]
    state?: string[]
    district?: string[]
    language: string
}


/**
 * Result of comparing selected roles with existing playlist roles
 * Used to show confirmation dialog when roles differ
 */
export interface RoleComparisonResult {
    /** Roles selected by user but not in existing playlist (new additions) */
    newRoles: string[]
    /** Roles in existing playlist but not selected by user */
    existingOnlyRoles: string[]
    /** True if selected roles exactly match existing roles */
    isExactMatch: boolean
    /** True if no existing playlist (new creation) */
    isNewPlaylist: boolean
}

/**
 * Playlist scope for create/update requests
 */
export interface PlaylistScope {
    orgId: string
    role: string[]
    state?: string[]
    district?: string[]
    language: string
}

/**
 * Playlist search request payload
 * Unique key: orgId + language + role + playlistId
 */
export interface PlaylistSearchRequest {
    request: {
        filters: {
            orgId: string
            role: string[]
            language: string
            playlistId: string  // Unique key includes playlistId
        }
    }
}

/**
 * Competency level shape used inside competency playlist payload.
 */
export interface PlaylistCompetencyLevelPayload {
    level: number | string
    name?: string
    description?: string
    courseId?: string
}

/**
 * Competency item shape used in competency playlist payload.
 * Additional fields are allowed because backend payload can include audit metadata.
 */
export interface PlaylistCompetencyPayload {
    id: number | string
    code?: string
    name?: string
    description?: string
    type?: string
    levels?: PlaylistCompetencyLevelPayload[]
    index?: number
    [key: string]: unknown
}

/**
 * Payload accepted by playlist create/update APIs.
 * - Course playlist: array of course identifiers
 * - Competency playlist: array of competency objects
 */
export type PlaylistPayload = string[] | PlaylistCompetencyPayload[]

/**
 * Data source within a playlist
 * 'static' for course management, 'competency' for competency management
 */
export interface PlaylistDataSource {
    type: 'static' | 'dynamic' | 'competency'
    payload: unknown[]  // Runtime response can vary; service methods use PlaylistPayload for request typing
}


/**
 * Playlist object from API response
 */
export interface Playlist {
    id: string
    playlistId?: string
    name?: string
    orgId: string
    role: string[]
    state?: string[]
    district?: string[]
    language: string
    dataSource: PlaylistDataSource
    createdOn?: string
    updatedOn?: string
    updated_at?: string
}

/**
 * Playlist create/update request payload
 */
export interface PlaylistCreateUpdateRequest {
    request: {
        playlist: {
            id?: string  // Required for update only
            playlistId: string
            scope: PlaylistScope
            dataSource: PlaylistDataSource
        }
    }
}

/**
 * Playlist search API response
 */
export interface PlaylistSearchResponse {
    result: {
        playlist: Playlist[]
    }
}

/**
 * Playlist summary statistics
 */
export interface PlaylistSummary {
    totalPlaylists: number
    totalCourses: number
    lastUpdated?: string
}
