import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { PlaylistFilters, Playlist } from '../models/playlist.model'
import { Course, SelectableCourse } from '../models/course.model'

/**
 * State management service for playlist workflow.
 * Maintains filter selections, existing playlist data, and course selections.
 */
@Injectable({
    providedIn: 'root',
})
export class PlaylistStateService {
    // Filter selections
    private filtersSubject = new BehaviorSubject<PlaylistFilters | null>(null)
    public filters$ = this.filtersSubject.asObservable()

    // Existing playlist (for edit mode)
    private existingPlaylistSubject = new BehaviorSubject<Playlist | null>(null)
    public existingPlaylist$ = this.existingPlaylistSubject.asObservable()

    // Course IDs from existing playlist (for preselection)
    private existingCourseIdsSubject = new BehaviorSubject<string[]>([])
    public existingCourseIds$ = this.existingCourseIdsSubject.asObservable()

    // Selected courses
    private selectedCoursesSubject = new BehaviorSubject<SelectableCourse[]>([])
    public selectedCourses$ = this.selectedCoursesSubject.asObservable()

    // Ordered courses (after drag & drop)
    private orderedCoursesSubject = new BehaviorSubject<SelectableCourse[]>([])
    public orderedCourses$ = this.orderedCoursesSubject.asObservable()

    // Course cache for search
    private courseCache: Course[] = []
    private courseCacheLanguage: string = ''

    constructor() { }

    setFilters(filters: PlaylistFilters): void {
        this.filtersSubject.next(filters)
    }

    getFilters(): PlaylistFilters | null {
        return this.filtersSubject.value
    }

    setExistingCourseIds(ids: string[]): void {
        this.existingCourseIdsSubject.next(ids)
    }

    getExistingCourseIds(): string[] {
        return this.existingCourseIdsSubject.value
    }

    setExistingPlaylist(playlist: Playlist | null): void {
        this.existingPlaylistSubject.next(playlist)
    }

    getExistingPlaylist(): Playlist | null {
        return this.existingPlaylistSubject.value
    }

    setSelectedCourses(courses: SelectableCourse[]): void {
        this.selectedCoursesSubject.next(courses)
    }

    getSelectedCourses(): SelectableCourse[] {
        return this.selectedCoursesSubject.value
    }

    setOrderedCourses(courses: SelectableCourse[]): void {
        this.orderedCoursesSubject.next(courses)
    }

    getOrderedCourses(): SelectableCourse[] {
        return this.orderedCoursesSubject.value
    }

    setCachedCourses(courses: Course[], language: string): void {
        this.courseCache = courses
        this.courseCacheLanguage = language
    }

    getCachedCourses(language: string): Course[] | null {
        if (this.courseCacheLanguage === language && this.courseCache.length > 0) {
            return this.courseCache
        }
        return null
    }

    clearCourseCache(): void {
        this.courseCache = []
        this.courseCacheLanguage = ''
    }

    clearState(): void {
        this.filtersSubject.next(null)
        this.existingPlaylistSubject.next(null)
        this.existingCourseIdsSubject.next([])
        this.selectedCoursesSubject.next([])
        this.orderedCoursesSubject.next([])
        this.clearCourseCache()
    }
}
