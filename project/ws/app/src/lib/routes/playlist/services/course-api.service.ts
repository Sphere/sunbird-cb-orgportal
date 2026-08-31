import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, of } from 'rxjs'
import { map, take } from 'rxjs/operators'
import {
    Course,
    CourseSearchRequest,
    CourseSearchResponse,
    CompetencyCourseSearchRequest,
    CompetencyInfo,
} from '../models/course.model'
import { getLevelCount } from '../config/competency.config'
import { log } from '../utils/playlist-logger.utils'
import { expandLanguageFilter } from '../utils/language.utils'

/**
 * Service for searching and retrieving course-related metadata.
 * Handles both general course searches and specialized competency-based course lookups.
 */
@Injectable({
    providedIn: 'root',
})
export class CourseApiService {
    private readonly API_BASE = `/apis/proxies/v8/sunbirdigot/search`

    constructor(private readonly http: HttpClient) { }

    /**
     * Executes a general search for all available courses.
     * Supports pagination via limit and offset, and filters results by the provided language.
     */
    searchCourses(
        language: string,
        limit: number = 20,
        offset: number = 0
    ): Observable<{ courses: Course[]; totalCount: number }> {
        const langFilter = expandLanguageFilter(language)
        const filters: any = {
            primaryCategory: ['Course'],
            status: ["Live"],
            competency: false,
        }

        const validLangFilter = langFilter.filter((l: string) => String(l).trim().length > 0)
        if (language && validLangFilter.length > 0) {
            filters.lang = validLangFilter
        }

        const payload: CourseSearchRequest = {
            request: {
                filters,
                limit,
                offset,
                sort_by: {
                    createdOn: 'desc',
                },
                fields: ["name", "sourceName", "competency", "status"]
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
        const langFilter = expandLanguageFilter(language)

        competencyIds.forEach(id => {
            for (let i = 1; i <= levelCount; i++) {
                competencySearch.push(`${id}-${i}`)
            }
        })

        const filters: any = {
            competencySearch,
            primaryCategory: ['Course'],
        }

        const validLangFilter = langFilter.filter((l: string) => String(l).trim().length > 0)
        if (language && validLangFilter.length > 0) {
            filters.lang = validLangFilter
        }

        const payload = {
            request: {
                filters,
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
        const langFilter = expandLanguageFilter(language)

        const filters: any = {
            competencySearch,
            primaryCategory: ['Course'],
        }

        const validLangFilter = langFilter.filter((l: string) => String(l).trim().length > 0)
        if (language && validLangFilter.length > 0) {
            filters.lang = validLangFilter
        }

        return {
            request: {
                filters,
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
            log.error('Failed to parse competencies_v1:', error)
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
            const hasCompetencyV1Match = competencies.some(comp =>
                String(comp.competencyId) === String(competencyId) &&
                String(comp.level) === String(level)
            )

            if (hasCompetencyV1Match) {
                return true
            }

            // Fallback: some responses only provide competencySearch tags like ["100-1", "100-2"].
            const tags = Array.isArray(course.competencySearch) ? course.competencySearch : []
            return tags.includes(`${competencyId}-${level}`)
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
            const doId = course.identifier?.toLowerCase() || ''
            const name = course.name?.toLowerCase() || ''
            const sourceName = course.sourceName?.toLowerCase() || ''
            return doId.includes(term) || name.includes(term) || sourceName.includes(term)
        })
    }

    /**
     * Fetches the entire available course library for a specific language.
     * This is useful for caching purposes and large-scale selection screens.
     */
    async loadAllCourses(language: string): Promise<Course[]> {
        const result = await this.searchCourses(language, 9999, 0).pipe(take(1)).toPromise()

        if (!result || !result.courses) {
            return []
        }

        return result.courses
    }

    /**
     * Searches for specific courses by their IDs.
     * Much more efficient than loading all courses when you only need a few.
     *
     * No language filter is applied: an identifier already resolves to exactly one
     * course, and courses are not reliably tagged with `lang`, so filtering by it
     * silently drops rows (they then render as "N/A").
     *
     * @param courseIds Array of course identifiers
     * @returns Observable of matching courses
     */
    searchCoursesByIds(
        courseIds: string[]
    ): Observable<{ courses: Course[]; totalCount: number }> {
        if (!courseIds || courseIds.length === 0) {
            return of({ courses: [], totalCount: 0 })
        }

        const identifiers = courseIds.map(id => id.trim()).filter(id => id.length > 0)

        const filters: any = {
            primaryCategory: ['Course'],
            identifier: identifiers,
        }

        const payload: CourseSearchRequest = {
            request: {
                filters,
                limit: identifiers.length + 10,
                offset: 0,
                sort_by: {
                    createdOn: 'desc',
                },
                fields: ["name", "sourceName", "identifier"]
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
}
