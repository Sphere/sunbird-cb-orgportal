import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import {
    Course,
    CourseSearchRequest,
    CourseSearchResponse,
} from '../models/course.model'

/**
 * Service for course search and retrieval operations.
 */
@Injectable({
    providedIn: 'root',
})
export class CourseApiService {
    private readonly API_BASE = '/apis/proxies/v8/sunbirdigot'
    private readonly CHANNEL_ID = '0132317968766894088'

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
                    status: ['Live'],
                    lang: [language],
                    channel: this.CHANNEL_ID,
                },
                limit,
                offset,
                sort_by: {
                    createdOn: 'desc',
                },
            },
        }

        return this.http
            .post<CourseSearchResponse>(`${this.API_BASE}/search`, payload)
            .pipe(
                map(response => ({
                    courses: response.result.content || [],
                    totalCount: response.result.count || 0,
                }))
            )
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
