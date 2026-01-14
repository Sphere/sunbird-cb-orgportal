import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Competency } from '../models/competency.model'

@Injectable({
    providedIn: 'root',
})
export class CompetencyApiService {
    private readonly API_BASE = '/apis/proxies/v8/entity/v1'

    /**
     * Temporary API endpoint to get all competencies
     * TODO: Remove once playlist competency data is available
     */
    private readonly TEMP_COMPETENCY_API = '/apis/protected/v8/entityCompetency'

    constructor(private http: HttpClient) { }

    /**
     * Search competencies using entity API
     * Uses: POST /apis/proxies/v8/entity/v1/search
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
     * Get all competencies (temporary API)
     * Uses: POST /apis/protected/v8/entityCompetency/getAllEntity
     */
    getAllCompetencies(): Observable<Competency[]> {
        const payload = {
            search: {
                type: 'Competency'
            }
        }

        return this.http
            .post<any>(`${this.TEMP_COMPETENCY_API}/getAllEntity`, payload)
            .pipe(
                map(response => {
                    const entities = response?.result?.response || []
                    const mapped = entities.map((entity: any) => this.mapToCompetency(entity))

                    // Deduplicate by ID - keep first occurrence
                    const uniqueMap = new Map<string, Competency>()
                    mapped.forEach((c: Competency) => {
                        if (!uniqueMap.has(c.id)) {
                            uniqueMap.set(c.id, c)
                        }
                    })

                    return Array.from(uniqueMap.values())
                })
            )
    }


    /**
     * Map API response to Competency model
     * Handles competencyLevelDescription as JSON string or array
     */
    private mapToCompetency(entity: any): Competency {
        let levels: any[] = []

        // competencyLevelDescription can be a JSON string or array
        if (entity?.additionalProperties?.competencyLevelDescription) {
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
        }

        return {
            id: String(entity.id),
            code: entity.additionalProperties?.Code || `C${entity.id}`,
            name: entity.name || '',
            description: entity.description || '',
            type: entity.type || 'Competency',
            status: entity.status,
            levels: levels.map((l: any) => ({
                level: parseInt(l.level, 10),
                name: l.name,
                description: l.description
            }))
        }
    }
}

