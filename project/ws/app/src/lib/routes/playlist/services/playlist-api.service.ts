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
    // Proxied endpoints (avoid CORS)
    private readonly CREATE_API = '/playlist-api/create'
    private readonly UPDATE_API = '/playlist-api/update'

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
                // playlist.dataSource.forEach(source => {
                // Only process static data sources (as per requirements)
                if (playlist?.dataSource?.type === 'static' && Array.isArray(playlist?.dataSource?.payload)) {
                    allIds.push(...playlist?.dataSource?.payload)
                }
                // })
            }
        })

        // Deduplicate using Set
        return Array.from(new Set(allIds))
    }

    /**
     * Create a new playlist
     * Used when search returns empty (new entry)
     * 
     * @param filters Playlist filters (org, role, language)
     * @param courseIds Ordered array of selected course IDs
     * @returns Observable of create response
     */
    createPlaylist(filters: PlaylistFilters, courseIds: string[]): Observable<any> {
        // Generate random playlist ID in format: playlistmdo{random}
        const playlistId = `playlistmdo${Math.floor(Math.random() * 1000000)}`

        const payload = {
            request: {
                playlist: {
                    playlistId,
                    scope: {
                        orgId: filters.orgId,
                        role: filters.role,
                        language: filters.language,
                    },
                    dataSource: {
                        type: 'static' as const,
                        payload: courseIds,
                    },
                },
            },
        }

        console.log('📝 Creating new playlist:', payload)
        return this.http.post(this.CREATE_API, payload)
    }

    /**
     * Update an existing playlist
     * Used when search returns existing data
     * Updates only the dataSource.payload with new course IDs in new order
     * 
     * @param existingPlaylist The existing playlist object (contains id)
     * @param courseIds New ordered array of course IDs
     * @returns Observable of update response
     */
    updatePlaylist(existingPlaylist: Playlist, courseIds: string[]): Observable<any> {
        const payload = {
            request: {
                playlist: {
                    id: existingPlaylist.id, // Required for update
                    playlistId: existingPlaylist.name || `playlistmdo${Math.floor(Math.random() * 1000000)}`,
                    scope: {
                        orgId: existingPlaylist.orgId,
                        role: existingPlaylist.role,
                        language: existingPlaylist.language,
                    },
                    dataSource: {
                        type: 'static' as const,
                        payload: courseIds, // New course IDs in new order
                    },
                },
            },
        }

        console.log('🔄 Updating existing playlist:', payload)
        return this.http.put(this.UPDATE_API, payload)
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
            // Update existing
            return this.updatePlaylist(existingPlaylist, courseIds)
        } else {
            // Create new
            return this.createPlaylist(filters, courseIds)
        }
    }
}
