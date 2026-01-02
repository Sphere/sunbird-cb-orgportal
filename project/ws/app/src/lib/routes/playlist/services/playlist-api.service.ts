import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import {
    Playlist,
    PlaylistFilters,
    PlaylistSearchRequest,
    PlaylistSearchResponse,
} from '../models/playlist.model'

/**
 * Playlist API Service
 * Handles all playlist-related API calls
 */
@Injectable({
    providedIn: 'root',
})
export class PlaylistApiService {
    private readonly API_BASE = '/apis/protected/v8/playlist'

    constructor(private http: HttpClient) { }

    /**
     * Search for existing playlists based on filters
     * @param filters Organization, role, and language filters
     * @returns Observable of playlists array
     */
    searchPlaylist(filters: PlaylistFilters): Observable<Playlist[]> {
        const payload: PlaylistSearchRequest = {
            request: {
                filters: {
                    orgId: filters.orgId,
                    role: filters.role,
                    language: filters.language,
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
     * @param data Object with potential scope fields
     * @returns Scope object with only non-empty values
     */
    private buildScope(data: { orgId: string, role: string[], state?: string[], district?: string[], language: string }): any {
        const scope: any = {}

        // Add all non-empty values
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                // For arrays, only add if has items
                if (Array.isArray(value)) {
                    if (value.length > 0) {
                        scope[key] = value
                    }
                } else if (value !== '') {
                    // For strings, only add if not empty
                    scope[key] = value
                }
            }
        })

        return scope
    }

    /**
     * Create a new playlist
     * Used when search returns empty (new entry)
     * 
     * @param filters Playlist filters (org, role, state, district, language)
     * @param courseIds Ordered array of selected course IDs
     * @returns Observable of create response
     */
    createPlaylist(filters: PlaylistFilters, courseIds: string[]): Observable<any> {
        const playlistId = `playlistmdo${Math.floor(Math.random() * 1000000)}`

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

        console.log('📝 Creating new playlist:', payload)
        return this.http.post(`${this.API_BASE}/create`, payload)
    }

    /**
     * Update an existing playlist
     * Used when search returns existing data
     * Updates the dataSource.payload with new course IDs in new order
     * 
     * @param existingPlaylist The existing playlist object (contains id)
     * @param courseIds New ordered array of course IDs
     * @returns Observable of update response
     */
    updatePlaylist(existingPlaylist: Playlist, courseIds: string[]): Observable<any> {
        const payload = {
            request: {
                playlist: {
                    id: existingPlaylist.id,
                    playlistId: existingPlaylist.playlistId || existingPlaylist.name || `playlist${existingPlaylist.id}`,
                    scope: this.buildScope({
                        orgId: existingPlaylist.orgId,
                        role: existingPlaylist.role,
                        state: existingPlaylist.state,
                        district: existingPlaylist.district,
                        language: existingPlaylist.language,
                    }),
                    dataSource: {
                        type: 'static',
                        payload: courseIds,
                    },
                },
            },
        }

        console.log('🔄 Updating existing playlist:', payload)
        return this.http.put(`${this.API_BASE}/update`, payload)
    }

    /**
     * Save playlist (wrapper that decides create vs update)
     * 
     * @param filters Playlist filters
     * @param courseIds Ordered array of course IDs
     * @param existingPlaylist Optional existing playlist (if found from search)
     * @returns Observable of save response
     */
    savePlaylist(
        filters: PlaylistFilters,
        courseIds: string[],
        existingPlaylist?: Playlist
    ): Observable<any> {
        if (existingPlaylist) {
            return this.updatePlaylist(existingPlaylist, courseIds)
        } else {
            return this.createPlaylist(filters, courseIds)
        }
    }
}
