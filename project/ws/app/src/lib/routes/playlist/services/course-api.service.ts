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
import { getLevelCount } from '../config/competency.config'

/**
 * Service for searching and retrieving course-related metadata.
 * Handles both general course searches and specialized competency-based course lookups.
 */
@Injectable({
    providedIn: 'root',
})
export class CourseApiService {
    private readonly API_BASE = `/api/proxies/v8/sunbirdigot/search`

    constructor(private http: HttpClient) { }

    /**
     * Executes a general search for all available courses.
     * Supports pagination via limit and offset, and filters results by the provided language.
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
     * Searches for courses mapped to a specific competency across all configured levels.
     * Transforms competency ID (e.g., "100") into level-based search array.
     * Currently: ["100-1", "100-2", "100-3", "100-4", "100-5"] for 5 levels.
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
    /**
     * Searches for courses mapped to multiple competencies.
     * 
     * @param competencyIds Array of competency IDs (e.g., ["100", "200"])
     * @param language Language code
     */
    searchCoursesByMultipleCompetencies(
        competencyIds: string[],
        language: string
    ): Observable<{ courses: Course[]; totalCount: number }> {
        const levelCount = getLevelCount()
        const competencySearch: string[] = []

        competencyIds.forEach(id => {
            for (let i = 1; i <= levelCount; i++) {
                competencySearch.push(`${id}-${i}`)
            }
        })

        const payload = {
            request: {
                filters: {
                    competencySearch,
                    lang: [language],
                    primaryCategory: ['Course']
                },
                exists: ['competencies_v1'],
                fields: ['name', 'sourceName', 'competencies_v1', 'competencySearch'],
                limit: 9999
            }
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
     * Construct the API request payload for fetching courses by competency.
     * This method dynamically expands the requested levels based on system configuration.
     */
    buildCompetencySearchRequest(competencyId: string, language: string): CompetencyCourseSearchRequest {
        const levelCount = getLevelCount()
        const competencySearch = Array.from({ length: levelCount }, (_, i) => `${competencyId}-${i + 1}`)

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
     * @param level The specific level to filter (e.g., 1-5 for current 5-level system)
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
     * Performs a client-side filter of the course list.
     * Matches user input against course names and source provider names.
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
     * Fetches the entire available course library for a specific language.
     * This is useful for caching purposes and large-scale selection screens.
     */
    async loadAllCourses(language: string): Promise<Course[]> {
        const result = await this.searchCourses(language, 9999, 0).toPromise()

        if (!result || !result.courses) {
            return []
        }

        return result.courses
    }
}
