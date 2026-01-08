/**
 * Playlist Data Models  
 * Defines TypeScript interfaces for playlist-related data structures
 */

/**
 * Filter criteria for playlist search and creation
 */
export interface PlaylistFilters {
    orgId: string
    role: string[]
    state?: string[]
    district?: string[]
    language: string
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
 */
export interface PlaylistSearchRequest {
    request: {
        filters: {
            orgId: string
            role: string[]
            language: string
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
