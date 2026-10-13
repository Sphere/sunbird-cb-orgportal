import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, throwError } from 'rxjs'
import { map, tap, catchError } from 'rxjs/operators'
import {
    Playlist,
    PlaylistCompetencyPayload,
    PlaylistFilters,
    PlaylistPayload,
    PlaylistSearchRequest,
    PlaylistSearchResponse,
} from '../models/playlist.model'
import { PLAYLIST_API } from '../constants/playlist.constants'

// ---------------------------------------------------------------------------
// Internal API response shapes — used only within this service
// ---------------------------------------------------------------------------

interface OrgApiItem {
    id: string
    orgName?: string
    channel?: string
}

interface OrgSearchApiResponse {
    result: { response: { content: OrgApiItem[] } }
}

interface EntityApiItem {
    name?: string
}

interface EntitySearchApiResponse {
    result: { entity: EntityApiItem[] }
}

/** Minimal shape returned by playlist create / update endpoints */
interface PlaylistMutationResponse {
    responseCode: string
    result?: Record<string, unknown>
}

// ---------------------------------------------------------------------------

/**
 * Different types of playlists we support.
 * This helps us organize and manage different kinds of learning content.
 */
export enum PlaylistType {
    COURSE = 'COURSE',
    COMPETENCY = 'COMPETENCY',
    SEARCH = 'SEARCH',
    /** ASKME course playlist — same static course payload as COURSE, stored under its own playlistId */
    ASKME_COURSE = 'ASKME_COURSE'
}

/**
 * Playlist identifiers for each type.
 * When creating a new playlist, we use these IDs to tell the backend what kind it is.
 * When updating an existing one, we use whatever ID it already has.
 */
export const PLAYLIST_IDS = {
    [PlaylistType.COURSE]: 'Playlist_Course',
    [PlaylistType.COMPETENCY]: 'COMPETENCY_PLAYLIST_V2',
    [PlaylistType.SEARCH]: 'SEARCH_PLAYLIST',
    [PlaylistType.ASKME_COURSE]: 'ASKME_COURSES_V1',
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
    private readonly ENTITY_API = '/apis/proxies/v8/entity/v1'

    constructor(private readonly http: HttpClient) { }

    /** Normalizes competency payload item from flat or key-wrapped formats */
    private toCompetencyPayloadItem(item: unknown): PlaylistCompetencyPayload | null {
        if (!item || typeof item !== 'object') {
            return null
        }

        if ('id' in item) {
            return item as PlaylistCompetencyPayload
        }

        const wrapped = Object.values(item as Record<string, unknown>).find(
            value => !!value && typeof value === 'object' && 'id' in (value as Record<string, unknown>)
        )
        return (wrapped as PlaylistCompetencyPayload) || null
    }

    /** Normalizes playlist object to consistently expose top-level fields used by UI/state */
    private normalizePlaylist(raw: Playlist): Playlist {
        const rawObj = raw as unknown as Record<string, unknown>
        const scope = (rawObj?.['scope'] as Record<string, unknown> | undefined) || {}

        const roles = Array.isArray(rawObj?.['role'])
            ? rawObj['role'] as string[]
            : Array.isArray(scope?.['roles'])
                ? scope['roles'] as string[]
                : Array.isArray(scope?.['role'])
                    ? scope['role'] as string[]
                    : []

        const state = Array.isArray(rawObj?.['state'])
            ? rawObj['state'] as string[]
            : Array.isArray(scope?.['state'])
                ? scope['state'] as string[]
                : undefined

        const district = Array.isArray(rawObj?.['district'])
            ? rawObj['district'] as string[]
            : Array.isArray(scope?.['district'])
                ? scope['district'] as string[]
                : undefined

        const orgId = String(rawObj?.['orgId'] || scope?.['orgId'] || '')
        const language = String(rawObj?.['language'] || scope?.['language'] || '')

        return {
            ...raw,
            orgId,
            role: roles,
            state,
            district,
            language,
        }
    }


    /**
     * Gets the list of organizations to show in the dropdown.
     * We only fetch root organizations (not sub-orgs) and format them nicely for the UI.
     */
    searchOrganizations(): Observable<{ value: string, label: string }[]> {
        const payload = {
            request: {
                filters: {
                    // isRootOrg: true
                },
                fields: [],
                sortBy: {
                    createdDate: 'Desc'
                },
                limit: PLAYLIST_API.ORG_SEARCH_LIMIT
            }
        }

        return this.http
            .post<OrgSearchApiResponse>(`${this.ORG_API}/search`, payload)
            .pipe(
                map(response => {
                    const organizations: OrgApiItem[] = response?.result?.response?.content || []
                    return organizations.map(org => ({
                        value: String(org.id),
                        label: org.orgName || org.channel || 'Unknown Organization'
                    }))
                })
            )
    }

    /**
     * Fetches positions from entity search API.
     * Uses position name for both value and label.
     */
    searchPositions(language: string = 'en'): Observable<{ value: string, label: string }[]> {
        const payload = {
            entityType: 'Position',
            language,
            query: '',
            strict: 'false',
            field: ['code', 'name'],
        }

        return this.http.post<EntitySearchApiResponse>(`${this.ENTITY_API}/search`, payload).pipe(
            map(response => {
                const entities: EntityApiItem[] = response?.result?.entity || []
                const seen = new Set<string>()

                return entities
                    .map((item: EntityApiItem) => String(item?.name || '').trim())
                    .filter((name: string) => !!name)
                    .filter((name: string) => {
                        const normalized = name.toLowerCase()
                        if (seen.has(normalized)) {
                            return false
                        }
                        seen.add(normalized)
                        return true
                    })
                    .sort((a: string, b: string) => a.localeCompare(b))
                    .map((name: string) => ({
                        value: name,
                        label: name,
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
                map(response => (response?.result?.playlist || []).map(item => this.normalizePlaylist(item)))
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
                    const courseIds = playlist.dataSource.payload.filter(
                        (item): item is string => typeof item === 'string' && item.trim().length > 0
                    )
                    allIds.push(...courseIds)
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
                const competencyItems = playlist.dataSource.payload
                    .map(item => this.toCompetencyPayloadItem(item))
                    .filter((item): item is PlaylistCompetencyPayload => !!item)

                competencyItems.forEach((item: PlaylistCompetencyPayload) => {
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
     * Gets competency codes from a competency playlist.
     * Used for resilient preselection because code is stable across environments.
     */
    extractCompetencyCodes(playlists: Playlist[]): string[] {
        if (!playlists || playlists.length === 0) {
            return []
        }

        const allCodes: string[] = []

        playlists.forEach(playlist => {
            if (playlist?.dataSource?.type === 'competency' && Array.isArray(playlist?.dataSource?.payload)) {
                const competencyItems = playlist.dataSource.payload
                    .map(item => this.toCompetencyPayloadItem(item))
                    .filter((item): item is PlaylistCompetencyPayload => !!item)

                competencyItems.forEach((item: PlaylistCompetencyPayload) => {
                    const code = String(
                        item?.code || (item?.additionalProperties as { Code?: string } | undefined)?.Code || ''
                    ).trim()
                    if (code) {
                        allCodes.push(code.toUpperCase())
                    }
                })
            }
        })

        return Array.from(new Set(allCodes))
    }

    /**
     * Extracts complete competency information from a playlist.
     * This is used when editing an existing playlist - we need to show what was already selected.
     */
    extractCompetencyData(playlists: Playlist[]): PlaylistCompetencyPayload[] {
        if (!playlists || playlists.length === 0) {
            return []
        }

        const competencies: PlaylistCompetencyPayload[] = []

        playlists.forEach(playlist => {
            if (playlist?.dataSource?.type === 'competency' && Array.isArray(playlist?.dataSource?.payload)) {
                const competencyItems = playlist.dataSource.payload
                    .map(item => this.toCompetencyPayloadItem(item))
                    .filter((item): item is PlaylistCompetencyPayload => !!item)

                competencyItems.forEach((item: PlaylistCompetencyPayload) => {
                    // V2 format: flat structure with direct fields
                    if (item) {
                        competencies.push({
                            id: String(item.id),
                            code: item.code || (item?.additionalProperties as { Code?: string } | undefined)?.Code || `C${item.id}`,
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
    private buildScope(data: { orgId: string, role: string[], state?: string[], district?: string[], language: string }): Record<string, unknown> {
        const scope: Record<string, unknown> = {}

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
    buildCompetencyPayload(competencies: PlaylistCompetencyPayload[]): Record<string, unknown>[] {
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

    private buildDataSource(
        playlistType: PlaylistType,
        payloadItems: PlaylistPayload
    ): { type: 'static' | 'competency' | 'query', payload: PlaylistPayload } {
        if (playlistType === PlaylistType.COMPETENCY) {
            return {
                type: 'competency',
                payload: payloadItems,
            }
        }

        if (playlistType === PlaylistType.SEARCH) {
            return {
                type: 'query',
                payload: payloadItems,
            }
        }

        return {
            type: 'static',
            payload: payloadItems,
        }
    }

    /**
     * Creates a brand new playlist.
     * This is called when we don't find an existing playlist for the given filters.
     *
     * @param filters Who this playlist is for (organization, role, etc.)
     * @param payloadItems The courses or competencies to include
     * @param playlistType What kind of playlist we're creating
     * @returns API response
     */
    createPlaylist(
        filters: PlaylistFilters,
        payloadItems: PlaylistPayload,
        playlistType: PlaylistType = PlaylistType.COURSE
    ): Observable<PlaylistMutationResponse> {
        // Use configured playlistId for new playlists
        const playlistId = PLAYLIST_IDS[playlistType]

        const dataSource = this.buildDataSource(playlistType, payloadItems)

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

        return this.http.post<PlaylistMutationResponse>(`${this.API_BASE}/create`, payload).pipe(
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
     * @param payloadItems The new list of courses/competencies
     * @returns API response
     */
    updatePlaylist(
        existingPlaylist: Playlist,
        filters: PlaylistFilters,
        payloadItems: PlaylistPayload,
        playlistType: PlaylistType = PlaylistType.COURSE
    ): Observable<PlaylistMutationResponse> {
        const dataSource = this.buildDataSource(playlistType, payloadItems)

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

        return this.http.put<PlaylistMutationResponse>(`${this.API_BASE}/update`, payload).pipe(
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
     * @param payloadItems What content to include
     * @param existingPlaylist If we found an existing playlist, pass it here
     * @param playlistType What kind of playlist this is
     * @returns API response
     */
    savePlaylist(
        filters: PlaylistFilters,
        payloadItems: PlaylistPayload,
        existingPlaylist?: Playlist,
        playlistType: PlaylistType = PlaylistType.COURSE
    ): Observable<PlaylistMutationResponse> {
        if (existingPlaylist) {
            return this.updatePlaylist(existingPlaylist, filters, payloadItems, playlistType)
        } else {
            return this.createPlaylist(filters, payloadItems, playlistType)
        }
    }
}
