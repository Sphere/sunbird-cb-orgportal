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
 * Different types of playlists we support.
 * This helps us organize and manage different kinds of learning content.
 */
export enum PlaylistType {
    COURSE = 'COURSE',
    COMPETENCY = 'COMPETENCY'
}

/**
 * Playlist identifiers for each type.
 * When creating a new playlist, we use these IDs to tell the backend what kind it is.
 * When updating an existing one, we use whatever ID it already has.
 */
export const PLAYLIST_IDS = {
    [PlaylistType.COURSE]: 'Playlist_Course',
    [PlaylistType.COMPETENCY]: 'COMPETENCY_PLAYLIST_V2',
} as const

/**
 * Service for managing playlists.
 * This handles everything related to creating, updating, and searching for playlists.
 */
@Injectable({
    providedIn: 'root',
})
export class PlaylistApiService {
    private readonly API_BASE = '/apis/protected/v8/playlist'
    private readonly ORG_API = '/apis/proxies/v8/org/v1'

    constructor(private http: HttpClient) { }


    /**
     * Gets the list of organizations to show in the dropdown.
     * We only fetch root organizations (not sub-orgs) and format them nicely for the UI.
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
     * Looks for playlists that match the given criteria.
     * Each playlist is unique based on: organization, language, role, and playlist type.
     * 
     * @param filters What organization, role, and language to search for
     * @param playlistType Whether we're looking for course or competency playlists
     * @returns List of matching playlists
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
     * Pulls out the course IDs from a playlist.
     * We only look at 'static' playlists (not dynamic ones) and remove any duplicates.
     * 
     * @param playlists The playlists to extract from
     * @returns Clean list of unique course IDs
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
     * Gets competency IDs from a competency playlist.
     * The V2 format stores competencies as a flat array with id, code, and other details.
     */
    extractCompetencyIds(playlists: Playlist[]): string[] {
        if (!playlists || playlists.length === 0) {
            return []
        }

        const allIds: string[] = []

        playlists.forEach(playlist => {
            if (playlist?.dataSource?.type === 'competency' && Array.isArray(playlist?.dataSource?.payload)) {
                playlist.dataSource.payload.forEach((item: any) => {
                    // V2 format: item is directly { id: 100, code: "C1", ... }
                    if (item?.id) {
                        allIds.push(String(item.id))
                    }
                })
            }
        })

        // Return all IDs (including duplicates) to get correct count
        // Note: If backend sends duplicate IDs, that's a data issue
        return allIds
    }

    /**
     * Extracts complete competency information from a playlist.
     * This is used when editing an existing playlist - we need to show what was already selected.
     */
    extractCompetencyData(playlists: Playlist[]): any[] {
        if (!playlists || playlists.length === 0) {
            return []
        }

        const competencies: any[] = []

        playlists.forEach(playlist => {
            if (playlist?.dataSource?.type === 'competency' && Array.isArray(playlist?.dataSource?.payload)) {
                playlist.dataSource.payload.forEach((item: any) => {
                    // V2 format: flat structure with direct fields
                    if (item) {
                        competencies.push({
                            id: String(item.id),
                            code: item.code || `C${item.id}`,
                            name: item.name,
                            description: item.description || '',
                            type: item.type || 'Domain',
                            levels: item.levels || []
                        })
                    }
                })
            }
        })

        return competencies
    }

    /**
     * Builds the scope object for the API request.
     * We only include fields that actually have values, and make sure state/district are arrays.
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
     * Formats competencies for the API.
     * Takes our UI competency objects and converts them to the c1, c2, c3 format the backend expects.
     * 
     * @param competencies The competencies to format
     * @returns Formatted array ready for the API
     */
    buildCompetencyPayload(competencies: any[]): any[] {
        return competencies.map((comp, index) => {
            const key = `c${index + 1}`
            return {
                [key]: {
                    id: comp.id,
                    name: comp.name,
                    type: comp.type || 'Competency',
                    description: comp.description || '',
                    additionalProperties: {
                        Code: comp.code || key.toUpperCase(),
                        competencyLevelDescription: comp.levels || []
                    }
                }
            }
        })
    }

    /**
     * Creates a brand new playlist.
     * This is called when we don't find an existing playlist for the given filters.
     * 
     * @param filters Who this playlist is for (organization, role, etc.)
     * @param courseIds The courses or competencies to include
     * @param playlistType What kind of playlist we're creating
     * @returns API response
     */
    createPlaylist(
        filters: PlaylistFilters,
        courseIds: string[],
        playlistType: PlaylistType = PlaylistType.COURSE
    ): Observable<any> {
        // Use configured playlistId for new playlists
        const playlistId = PLAYLIST_IDS[playlistType]

        // Build dataSource based on playlist type
        const dataSource = playlistType === PlaylistType.COMPETENCY
            ? {
                type: 'competency',
                payload: courseIds  // For competency, this should be the competency objects array
            }
            : {
                type: 'static',
                payload: courseIds
            }

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
                    dataSource,
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
     * Updates an existing playlist with new content.
     * This is called when we found a playlist and want to modify it.
     * 
     * @param existingPlaylist The playlist we're updating
     * @param filters Updated filter values (roles might be merged)
     * @param courseIds The new list of courses/competencies
     * @returns API response
     */
    updatePlaylist(existingPlaylist: Playlist, filters: PlaylistFilters, courseIds: string[], isCompetency: boolean = false): Observable<any> {
        // Build dataSource based on existing playlist type
        const dataSource = isCompetency || existingPlaylist.dataSource?.type === 'competency'
            ? {
                type: 'competency',
                payload: courseIds  // For competency, this is the competency objects array
            }
            : {
                type: 'static',
                payload: courseIds
            }

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
                    dataSource,
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
     * Saves a playlist - either creates a new one or updates an existing one.
     * This is the main method you'll call. It figures out whether to create or update automatically.
     * 
     * @param filters Who this playlist is for
     * @param courseIds What content to include
     * @param existingPlaylist If we found an existing playlist, pass it here
     * @param playlistType What kind of playlist this is
     * @returns API response
     */
    savePlaylist(
        filters: PlaylistFilters,
        courseIds: string[],
        existingPlaylist?: Playlist,
        playlistType: PlaylistType = PlaylistType.COURSE
    ): Observable<any> {
        const isCompetency = playlistType === PlaylistType.COMPETENCY
        if (existingPlaylist) {
            return this.updatePlaylist(existingPlaylist, filters, courseIds, isCompetency)
        } else {
            return this.createPlaylist(filters, courseIds, playlistType)
        }
    }
}

