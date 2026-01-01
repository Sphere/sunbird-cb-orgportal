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
 * Course API Service
 * Handles course search and retrieval from Sunbird
 */
@Injectable({
    providedIn: 'root',
})
export class CourseApiService {
    private readonly API_BASE = '/apis/proxies/v8/sunbirdigot'
    private readonly CHANNEL_ID = '0132317968766894088'

    constructor(private http: HttpClient) { }

    /**
     * Search for courses using Sunbird API
     * Filters by Live status and Course primary category
     * 
     * @param language Language code for filtering
     * @param limit Number of results per page (default: 20)
     * @param offset Pagination offset (default: 0)
     * @returns Observable of courses and total count
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
     * Search courses by name or source
     * Client-side filtering for search functionality
     * Generic to work with both Course and SelectableCourse types
     * 
     * @param courses Array of courses to filter
     * @param searchTerm Search query
     * @returns Filtered array of courses
     */
    filterCourses<T extends Course>(courses: T[], searchTerm: string): T[] {
        if (!searchTerm || searchTerm.trim() === '') {
            return courses
        }

        const term = searchTerm.toLowerCase().trim()

        return courses.filter(course =>
            course.name.toLowerCase().includes(term) ||
            course.sourceName.toLowerCase().includes(term)
        )
    }
}
