import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, of } from 'rxjs'
import { map } from 'rxjs/operators'
import { Competency } from '../models/competency.model'
import { MOCK_COMPETENCY_LIST_RESPONSE } from './competency-mock-data'
import { RawCompetencyEntity } from '../utils/competency-transformer'

/**
 * Service for retrieving competency data.
 * Currently serves as a wrapper for both legacy entity search and modern mock-based retrieval.
 */
@Injectable({
    providedIn: 'root',
})
export class CompetencyApiService {
    private readonly API_BASE = '/apis/proxies/v8/entity/v1'

    constructor(private http: HttpClient) { }

    /**
     * Retrieves the master list of competencies filtered by language.
     * Note: This currently pulls from a static mock source while global API integration is pending.
     */
    getCompetencyListByLanguage(_language: string = 'en'): Observable<RawCompetencyEntity[]> {
        // We are using mock data temporarily until the API is ready.
        const mockEntities = MOCK_COMPETENCY_LIST_RESPONSE.result.data.entity as RawCompetencyEntity[]

        // In a real API scenario, filtering would happen on the server.
        // For now, we return the mock data directly.
        return of(mockEntities)


    }

    /**
     * Searches for competencies using the legacy entity-based API.
     * Provides backward compatibility for older competency structures.
     */
    searchCompetencies(query?: string, limit: number = 100): Observable<Competency[]> {
        const payload: any = {
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
            .post<any>(`${this.API_BASE}/search`, payload)
            .pipe(
                map(response => {
                    const entities = response?.result?.entity || []
                    return entities.map((entity: any) => this.mapToCompetency(entity))
                })
            )
    }



    /**
     * Maps a raw API entity into a structured Competency model.
     * Normalizes varying response formats (nested children vs. additionalProperties) into a unified level structure.
     */
    private mapToCompetency(entity: any): Competency {
        let levels: any[] = []

        // Handle children array (new format from mock/API)
        if (entity?.children && Array.isArray(entity.children)) {
            levels = entity.children.map((child: any) => ({
                level: child.levelId || parseInt(child.level?.replace('L', '') || '0', 10),
                name: child.name,
                description: child.description
            }))
        }
        // Handle competencyLevelDescription (old format)
        else if (entity?.additionalProperties?.competencyLevelDescription) {
            const levelDesc = entity.additionalProperties.competencyLevelDescription
            if (typeof levelDesc === 'string') {
                try {
                    levels = JSON.parse(levelDesc)
                } catch {
                    levels = []
                }
            } else if (Array.isArray(levelDesc)) {
                levels = levelDesc
            }

            // Ensure level is a number
            levels = levels.map((l: any) => ({
                level: typeof l.level === 'number' ? l.level : parseInt(l.level, 10),
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
}

