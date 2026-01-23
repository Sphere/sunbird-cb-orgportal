import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import {
    Course,
    CourseSearchRequest,
    CourseSearchResponse,
    CompetencyCourseSearchRequest,
    CompetencyInfo,
} from '../models/course.model'

/**
 * Service for course search and retrieval operations.
 */
@Injectable({
    providedIn: 'root',
})
export class CourseApiService {
    // private readonly API_BASE = '/apis/public/v8/mobileApp/contentSearch'
    private readonly API_BASE = `/apis/proxies/v8/sunbirdigot/search`
    // private readonly CHANNEL_ID = '0132317968766894088'

    constructor(private http: HttpClient) { }

    /**
     * Searches for courses using Sunbird API.
     * @param language Language code for filtering
     * @param limit Number of results per page
     * @param offset Pagination offset
     */
    searchCourses(
        language: string,
        limit: number = 20,
        offset: number = 0
    ): Observable<{ courses: Course[]; totalCount: number }> {
        const payload: CourseSearchRequest = {
            request: {
                filters: {
                    primaryCategory: ['Course'],
                    lang: [language]
                },
                limit,
                offset,
                sort_by: {
                    createdOn: 'desc',
                },
                fields: ["name", "sourceName"]
            },
        }


        return this.http
            .post<CourseSearchResponse>(`${this.API_BASE}`, payload)
            .pipe(
                map(response => ({
                    courses: response.result.content || [],
                    totalCount: response.result.count || 0,
                }))
            )
    }

    /**
     * Searches for courses mapped to a specific competency across all 5 levels.
     * Transforms competency ID (e.g., "100") into level-based search array ["100-1", "100-2", "100-3", "100-4", "100-5"].
     * 
     * @param competencyId The competency ID (e.g., "100", "200")
     * @param language Language code for filtering
     * @returns Observable of courses with competency mappings
     * 
     * @example
     * ```typescript
     * searchCoursesByCompetency("100", "en").subscribe(result => {
     *   console.log(result.courses); // Courses mapped to competency 100
     * });
     * ```
     */
    searchCoursesByCompetency(
        competencyId: string,
        language: string
    ): Observable<{ courses: Course[]; totalCount: number }> {
        const payload = this.buildCompetencySearchRequest(competencyId, language)

        return this.http
            .post<CourseSearchResponse>(`${this.API_BASE}`, payload)
            .pipe(
                map(response => ({
                    courses: response.result.content || [],
                    totalCount: response.result.count || 0,
                }))
            )
    }

    /**
     * Builds the competency-based course search request payload.
     * Transforms a competency ID into an array of level-based search terms.
     * 
     * @param competencyId The competency ID (e.g., "100")
     * @param language Language code
     * @returns Request payload for competency-based search
     * 
     * @example
     * Input: competencyId = "100", language = "en"
     * Output: {
     *   request: {
     *     filters: {
     *       competencySearch: ["100-1", "100-2", "100-3", "100-4", "100-5"],
     *       lang: ["en"],
     *       primaryCategory: ["Course"]
     *     },
     *     exists: ["competencies_v1"],
     *     fields: ["name", "sourceName", "competencies_v1", "competencySearch"]
     *   }
     * }
     */
    buildCompetencySearchRequest(competencyId: string, language: string): CompetencyCourseSearchRequest {
        // Generate competency search array: ["100-1", "100-2", "100-3", "100-4", "100-5"]
        const competencySearch = Array.from({ length: 5 }, (_, i) => `${competencyId}-${i + 1}`)

        return {
            request: {
                filters: {
                    competencySearch,
                    lang: [language],
                    primaryCategory: ['Course']
                },
                exists: ['competencies_v1'],
                fields: ['name', 'sourceName', 'competencies_v1', 'competencySearch']
            }
        }
    }

    /**
     * Parses the competencies_v1 JSON string field from a course.
     * 
     * @param course Course object with competencies_v1 field
     * @returns Array of parsed competency info, or empty array if parsing fails
     * 
     * @example
     * ```typescript
     * const course = {
     *   competencies_v1: '[{"competencyName":"Pregnancy","competencyId":"100","level":"1"}]'
     * };
     * const info = parseCompetencyLevels(course);
     * // Returns: [{ competencyName: "Pregnancy", competencyId: "100", level: "1" }]
     * ```
     */
    parseCompetencyLevels(course: Course): CompetencyInfo[] {
        if (!course.competencies_v1) {
            return []
        }

        try {
            const parsed = JSON.parse(course.competencies_v1)
            return Array.isArray(parsed) ? parsed : []
        } catch (error) {
            console.error('Failed to parse competencies_v1:', error)
            return []
        }
    }

    /**
     * Filters courses to only include those mapped to a specific competency level.
     * 
     * @param courses Array of courses with competency mappings
     * @param competencyId The competency ID to filter by
     * @param level The specific level to filter (1-5)
     * @returns Filtered array of courses
     * 
     * @example
     * ```typescript
     * const levelOneCourses = filterCoursesByLevel(allCourses, "100", 1);
     * // Returns only courses mapped to competency 100, level 1
     * ```
     */
    filterCoursesByLevel(courses: Course[], competencyId: string, level: number): Course[] {
        return courses.filter(course => {
            const competencies = this.parseCompetencyLevels(course)
            return competencies.some(comp =>
                String(comp.competencyId) === String(competencyId) &&
                String(comp.level) === String(level)
            )
        })
    }

    /**
     * Filters courses by name or source (client-side).
     * @param courses Array of courses to filter
     * @param searchTerm Search query
     */
    filterCourses<T extends Course>(courses: T[], searchTerm: string): T[] {
        if (!searchTerm || searchTerm.trim() === '') {
            return courses
        }

        const term = searchTerm.toLowerCase().trim()

        return courses.filter(course => {
            const name = course.name?.toLowerCase() || ''
            const sourceName = course.sourceName?.toLowerCase() || ''
            return name.includes(term) || sourceName.includes(term)
        })
    }

    /**
     * Loads all courses for a language in a single request.
     * @param language Language code
     */
    async loadAllCourses(language: string): Promise<Course[]> {
        const result = await this.searchCourses(language, 9999, 0).toPromise()

        if (!result || !result.courses) {
            return []
        }

        return result.courses
    }
}
