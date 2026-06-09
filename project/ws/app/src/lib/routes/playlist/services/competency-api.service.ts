import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Competency } from '../models/competency.model'
import { RawCompetencyEntity, RawCompetencyLevel } from '../utils/competency-transformer'

// ---------------------------------------------------------------------------
// Internal API response shapes — used only within this service
// ---------------------------------------------------------------------------

/** Raw level shape as returned by the entity search API */
interface RawEntityLevel {
    levelNumber?: number
    levelName?: string
    levelDescription?: string
}

/** Raw child (level) shape used in legacy children-array format */
interface RawEntityChild {
    levelId?: number
    level?: string
    name?: string
    description?: string
}

/** Raw level shape used inside competencyLevelDescription (legacy format) */
interface RawLevelDesc {
    level?: number | string
    name?: string
    description?: string
}

/** Raw entity item as returned by /entity/v1/search */
interface RawEntityItem {
    entityId?: number
    id?: number
    name?: string
    code?: string
    description?: string
    type?: string
    status?: string
    area?: string
    language?: string
    languageCode?: string
    levels?: RawEntityLevel[]
    children?: RawEntityChild[]
    additionalProperties?: {
        Code?: string
        competencyLevelDescription?: string | RawLevelDesc[]
        parentCompetency?: string
        [key: string]: unknown
    }
    createdAt?: string
    createdBy?: string
    updatedAt?: string
    updatedBy?: string
}

interface EntitySearchApiResponse {
    result: { entity: RawEntityItem[] }
}

interface CompetencySearchPayload {
    request: {
        entity: {
            type: string
            limit: number
            query?: { name: string }
        }
    }
}

// ---------------------------------------------------------------------------

/**
 * Service for retrieving competency data.
 * Fetches competency data from entity search APIs and normalizes response shapes.
 */
@Injectable({
    providedIn: 'root',
})
export class CompetencyApiService {
    private readonly API_BASE = '/apis/proxies/v8/entity/v1'

    constructor(private http: HttpClient) { }

    /**
     * Retrieves the master list of competencies filtered by language.
     * Uses entity search API and normalizes response to RawCompetencyEntity format.
     */
    getCompetencyListByLanguage(language: string = 'en'): Observable<RawCompetencyEntity[]> {
        const payload = {
            entityType: 'Competency',
            language,
            query: '',
            strict: 'false',
            field: ['code', 'name'],
        }

        return this.http
            .post<EntitySearchApiResponse>(`${this.API_BASE}/search`, payload)
            .pipe(
                map(response => {
                    const entities: RawEntityItem[] = response?.result?.entity || []
                    return entities.map(entity => this.mapEntitySearchResponse(entity, language))
                })
            )
    }

    /**
     * Searches for competencies using the legacy entity-based API.
     * Provides backward compatibility for older competency structures.
     */
    searchCompetencies(query?: string, limit: number = 100): Observable<Competency[]> {
        const payload: CompetencySearchPayload = {
            request: {
                entity: {
                    type: 'competency',
                    limit
                }
            }
        }

        if (query && query.trim()) {
            payload.request.entity.query = { name: query.trim() }
        }

        return this.http
            .post<EntitySearchApiResponse>(`${this.API_BASE}/search`, payload)
            .pipe(
                map(response => {
                    const entities: RawEntityItem[] = response?.result?.entity || []
                    return entities.map(entity => this.mapToCompetency(entity))
                })
            )
    }



    /**
     * Maps a raw API entity into a structured Competency model.
     * Normalizes varying response formats (nested children vs. additionalProperties) into a unified level structure.
     */
    private mapToCompetency(entity: RawEntityItem): Competency {
        let levels: { level: number; name?: string; description?: string }[] = []

        // Handle children array (new format from mock/API)
        if (entity?.children && Array.isArray(entity.children)) {
            levels = entity.children.map((child: RawEntityChild) => ({
                level: child.levelId || parseInt(child.level?.replace('L', '') || '0', 10),
                name: child.name,
                description: child.description
            }))
        }
        // Handle competencyLevelDescription (old format)
        else if (entity?.additionalProperties?.competencyLevelDescription) {
            const levelDesc = entity.additionalProperties.competencyLevelDescription
            let rawLevels: RawLevelDesc[] = []
            if (typeof levelDesc === 'string') {
                try {
                    rawLevels = JSON.parse(levelDesc)
                } catch {
                    rawLevels = []
                }
            } else if (Array.isArray(levelDesc)) {
                rawLevels = levelDesc
            }

            // Ensure level is a number
            levels = rawLevels.map((l: RawLevelDesc) => ({
                level: typeof l.level === 'number' ? l.level : parseInt(String(l.level ?? '0'), 10),
                name: l.name,
                description: l.description
            }))
        }

        return {
            id: String(entity.id),
            code: entity.code || entity.additionalProperties?.Code || `C${entity.id}`,
            name: entity.name || '',
            description: entity.description || '',
            type: entity.type || 'Competency',
            status: entity.status,
            levels
        }
    }

    /**
     * Normalizes v8 entity search response to the existing RawCompetencyEntity contract.
     * Keeps downstream transformer and UI code unchanged.
     */
    private mapEntitySearchResponse(entity: RawEntityItem, language: string): RawCompetencyEntity {
        const entityLanguage = String(entity?.languageCode || language)
        const rawLevels: RawEntityLevel[] = Array.isArray(entity?.levels) ? entity.levels : []
        const children: RawCompetencyLevel[] = rawLevels.map((lvl: RawEntityLevel, index: number) => ({
            id: index + 1,
            code: `${entity?.code || 'C'}_L${lvl?.levelNumber || index + 1}`,
            level: `L${lvl?.levelNumber || index + 1}`,
            levelId: Number(lvl?.levelNumber || index + 1),
            name: String(lvl?.levelName || '').trim(),
            description: String(lvl?.levelDescription || '').trim(),
            language: entityLanguage,
            type: 'level',
            status: String(entity?.status || 'Active'),
            additionalProperties: {
                parentCompetency: String(entity?.name || '').trim(),
            },
        }))

        return {
            id: Number(entity?.entityId ?? entity?.id ?? 0),
            type: 'competency',
            name: String(entity?.name || '').trim(),
            description: String(entity?.description || '').trim(),
            language: entityLanguage,
            code: String(entity?.code || '').trim(),
            level: String(entity?.code || ''),
            levelId: 0,
            status: String(entity?.status || 'Active'),
            entityType: String(entity?.type || 'Domain'),
            area: String(entity?.area || ''),
            additionalProperties: entity?.additionalProperties || {},
            children,
            createdDate: entity?.createdAt || undefined,
            createdBy: entity?.createdBy || undefined,
            updatedDate: entity?.updatedAt || undefined,
            updatedBy: entity?.updatedBy || undefined,
        }
    }
}
