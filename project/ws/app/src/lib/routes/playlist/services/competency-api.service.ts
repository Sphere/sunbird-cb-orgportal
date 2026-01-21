import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, of } from 'rxjs'
import { map } from 'rxjs/operators'
import { Competency } from '../models/competency.model'
import { MOCK_COMPETENCY_LIST_RESPONSE } from './competency-mock-data'
import { RawCompetencyEntity } from '../utils/competency-transformer'

/**
 * Service to handle competency data retrieval.
 * 
 * Note: Currently relies on mock data ('competency-mock-data.ts') 
 * because the backend API is not yet fully integrated.
 */
@Injectable({
    providedIn: 'root',
})
export class CompetencyApiService {
    private readonly API_BASE = '/apis/proxies/v8/entity/v1'

    constructor(private http: HttpClient) { }

    /**
     * Fetches the list of competencies, filtered by language.
     * 
     * Currently returns mock data. When the backend is ready, this should
     * be updated to call the real API endpoint.
     * 
     * @param _language The language code (e.g. 'en', 'hi') - currently unused until real API is ready
     * @returns An observable of raw competency entities
     */
    getCompetencyListByLanguage(_language: string = 'en'): Observable<RawCompetencyEntity[]> {
        // We are using mock data temporarily until the API is ready.
        const mockEntities = MOCK_COMPETENCY_LIST_RESPONSE.result.data.entity as RawCompetencyEntity[]

        // In a real API scenario, filtering would happen on the server.
        // For now, we return the mock data directly.
        return of(mockEntities)

        // Future Implementation:
        /*
        return this.http.post<any>(`${this.API_BASE}/upload`, { 
            request: { 
                entity: { type: 'competency', language: _language } 
            } 
        }).pipe(
            map(response => response?.result?.data?.entity || [])
        )
        */
    }

    /**
     * Searches for competencies using the legacy search API.
     * Kept for backward compatibility.
     * 
     * @param query Search term
     * @param limit Max results (default 100)
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
     * Map API response to Competency model
     * Handles competencyLevelDescription as JSON string or array
     * 
     * NOTE: This mapper works with both old and new API responses
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

