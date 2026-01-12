import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, throwError } from 'rxjs'
import { map, tap, catchError } from 'rxjs/operators'
import {
    Playlist,
    PlaylistFilters,
    PlaylistSearchRequest,
    PlaylistSearchResponse,
} from '../models/playlist.model'

/**
 * Playlist Types - for configurable playlist IDs
 */
export enum PlaylistType {
    COURSE = 'COURSE',
    COMPETENCY = 'COMPETENCY'
}

/**
 * Configurable Playlist IDs
 * Used when creating new playlists (CREATE operation)
 * For UPDATE, existing playlistId from API is used
 */
export const PLAYLIST_IDS = {
    [PlaylistType.COURSE]: 'Playlist_Course',
    [PlaylistType.COMPETENCY]: 'Playlist_Competency',
} as const

/**
 * Playlist API Service
 * Handles all playlist-related API calls
 */
@Injectable({
    providedIn: 'root',
})
export class PlaylistApiService {
    private readonly API_BASE = '/apis/protected/v8/playlist'
    private readonly ORG_API = '/apis/proxies/v8/org/v1'

    constructor(private http: HttpClient) { }


    /**
     * Fetch all root organizations for dropdown
     * Maps API response to dropdown format: { value: id, label: orgName }
     */
    searchOrganizations(): Observable<{ value: string, label: string }[]> {
        const payload = {
            request: {
                filters: {
                    isRootOrg: true
                },
                fields: [],
                sortBy: {
                    createdDate: 'Desc'
                },
                limit: 9999
            }
        }

        return this.http
            .post<any>(`${this.ORG_API}/search`, payload)
            .pipe(
                map(response => {
                    const organizations = response?.result?.response?.content || []
                    return organizations.map((org: any) => ({
                        value: org.id,
                        label: org.orgName || org.channel || 'Unknown Organization'
                    }))
                })
            )
    }


    /**
     * Search for existing playlists based on filters
     * Unique key: orgId + language + role + playlistId
     * 
     * @param filters Organization, role, and language filters
     * @param playlistType Type of playlist to search for (defaults to COURSE)
     * @returns Observable of playlists array
     */
    searchPlaylist(
        filters: PlaylistFilters,
        playlistType: PlaylistType = PlaylistType.COURSE
    ): Observable<Playlist[]> {
        const playlistId = PLAYLIST_IDS[playlistType]

        const payload: PlaylistSearchRequest = {
            request: {
                filters: {
                    orgId: filters.orgId,
                    role: filters.role,
                    language: filters.language,
                    playlistId: playlistId,  // Unique key includes playlistId
                },
            },
        }


        return this.http
            .post<PlaylistSearchResponse>(`${this.API_BASE}/search`, payload)
            .pipe(
                map(response => response.result.playlist || [])
            )
    }

    /**
     * Extract course IDs from existing playlist
     * Only processes 'static' type data sources
     * Deduplicates IDs before returning
     * 
     * @param playlists Array of playlists from search
     * @returns Deduplicated array of course do_ids
     */
    extractCourseIds(playlists: Playlist[]): string[] {
        if (!playlists || playlists.length === 0) {
            return []
        }

        const allIds: string[] = []

        playlists.forEach(playlist => {
            if (playlist?.dataSource) {
                if (playlist?.dataSource?.type === 'static' && Array.isArray(playlist?.dataSource?.payload)) {
                    allIds.push(...playlist?.dataSource?.payload)
                }
            }
        })

        // Deduplicate using Set
        return Array.from(new Set(allIds))
    }

    /**
     * Build scope object dynamically
     * Only includes keys that have non-empty values
     * Ensures state and district are always arrays
     */
    private buildScope(data: { orgId: string, role: string[], state?: string[], district?: string[], language: string }): any {
        const scope: any = {}

        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    // Only include non-empty arrays
                    if (value.length > 0) {
                        scope[key] = value
                    }
                } else if (typeof value === 'string' && value !== '') {
                    // For state and district, ensure they are arrays even if passed as string
                    if (key === 'state' || key === 'district') {
                        scope[key] = [value]
                    } else {
                        scope[key] = value
                    }
                }
            }
        })

        return scope
    }

    /**
     * Create a new playlist
     * Used when search returns empty (new entry)
     * Uses configurable playlistId based on type
     * 
     * @param filters Playlist filters (org, role, state, district, language)
     * @param courseIds Ordered array of selected course IDs
     * @param playlistType Type of playlist (COURSE or COMPETENCY) - defaults to COURSE
     * @returns Observable of create response
     */
    createPlaylist(
        filters: PlaylistFilters,
        courseIds: string[],
        playlistType: PlaylistType = PlaylistType.COURSE
    ): Observable<any> {
        // Use configured playlistId for new playlists
        const playlistId = PLAYLIST_IDS[playlistType]

        const payload = {
            request: {
                playlist: {
                    playlistId,
                    scope: this.buildScope({
                        orgId: filters.orgId,
                        role: filters.role,
                        state: filters.state,
                        district: filters.district,
                        language: filters.language,
                    }),
                    dataSource: {
                        type: 'static',
                        payload: courseIds,
                    },
                },
            },
        }

        return this.http.post<any>(`${this.API_BASE}/create`, payload).pipe(
            tap(response => {
                if (response?.responseCode !== 'OK' && response?.responseCode !== 'SUCCESS') {
                    throw response
                }
            }),
            catchError(err => throwError(err))
        )
    }


    /**
     * Update an existing playlist
     * Used when search returns existing data
     * Updates scope with merged roles from filters & course IDs
     * 
     * @param existingPlaylist The existing playlist object (contains id)
     * @param filters Filters containing merged roles
     * @param courseIds New ordered array of course IDs
     * @returns Observable of update response
     */
    updatePlaylist(existingPlaylist: Playlist, filters: PlaylistFilters, courseIds: string[]): Observable<any> {
        const payload = {
            request: {
                playlist: {
                    id: existingPlaylist.id,
                    playlistId: existingPlaylist.playlistId || existingPlaylist.name || `playlist${existingPlaylist.id}`,
                    scope: this.buildScope({
                        orgId: filters.orgId,
                        role: filters.role,
                        state: filters.state,
                        district: filters.district,
                        language: filters.language,
                    }),
                    dataSource: {
                        type: 'static',
                        payload: courseIds,
                    },
                },
            },
        }

        return this.http.put<any>(`${this.API_BASE}/update`, payload).pipe(
            tap(response => {
                if (response?.responseCode !== 'OK' && response?.responseCode !== 'SUCCESS') {
                    throw response
                }
            }),
            catchError(err => throwError(err))
        )
    }

    /**
     * Save playlist (wrapper that decides create vs update)
     * - For CREATE: Uses configured playlistId based on type
     * - For UPDATE: Uses existing playlistId from the playlist, roles from filters (merged)
     * 
     * @param filters Playlist filters (with merged roles for update)
     * @param courseIds Ordered array of course IDs
     * @param existingPlaylist Optional existing playlist (if found from search)
     * @param playlistType Type of playlist for new creation (defaults to COURSE)
     * @returns Observable of save response
     */
    savePlaylist(
        filters: PlaylistFilters,
        courseIds: string[],
        existingPlaylist?: Playlist,
        playlistType: PlaylistType = PlaylistType.COURSE
    ): Observable<any> {
        if (existingPlaylist) {
            return this.updatePlaylist(existingPlaylist, filters, courseIds)
        } else {
            return this.createPlaylist(filters, courseIds, playlistType)
        }
    }
}

