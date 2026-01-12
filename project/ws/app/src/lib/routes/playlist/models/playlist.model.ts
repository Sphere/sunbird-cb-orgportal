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
 * Data source within a playlist
 * Only 'static' type is used for course management
 */
export interface PlaylistDataSource {
    type: 'static' | 'dynamic'
    payload: string[]  // Array of course do_ids
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
