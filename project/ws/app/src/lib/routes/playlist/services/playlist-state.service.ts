import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { PlaylistFilters, Playlist } from '../models/playlist.model'
import { SelectableCourse } from '../models/course.model'

/**
 * Playlist State Management
 * Manages state across playlist workflow pages
 * Persists filter selections, existing playlist data, and course selections
 */
@Injectable({
    providedIn: 'root',
})
export class PlaylistStateService {
    // Filters selected on filter page
    private filtersSubject = new BehaviorSubject<PlaylistFilters | null>(null)
    public filters$ = this.filtersSubject.asObservable()

    // Full existing playlist object (for update - contains id)
    private existingPlaylistSubject = new BehaviorSubject<Playlist | null>(null)
    public existingPlaylist$ = this.existingPlaylistSubject.asObservable()

    // Course IDs from existing playlist (if any)
    private existingCourseIdsSubject = new BehaviorSubject<string[]>([])
    public existingCourseIds$ = this.existingCourseIdsSubject.asObservable()

    // Selected courses from course selection page
    private selectedCoursesSubject = new BehaviorSubject<SelectableCourse[]>([])
    public selectedCourses$ = this.selectedCoursesSubject.asObservable()

    // Ordered courses from manage order page
    private orderedCoursesSubject = new BehaviorSubject<SelectableCourse[]>([])
    public orderedCourses$ = this.orderedCoursesSubject.asObservable()

    constructor() { }

    /**
     * Set selected filters
     */
    setFilters(filters: PlaylistFilters): void {
        this.filtersSubject.next(filters)
    }

    /**
     * Get current filters
     */
    getFilters(): PlaylistFilters | null {
        return this.filtersSubject.value
    }

    /**
     * Set existing playlist course IDs
     * These will be preselected in course selection
     */
    setExistingCourseIds(ids: string[]): void {
        this.existingCourseIdsSubject.next(ids)
    }

    /**
     * Get existing playlist course IDs
     */
    getExistingCourseIds(): string[] {
        return this.existingCourseIdsSubject.value
    }

    /**
     * Set existing playlist object (for update - need id field)
     */
    setExistingPlaylist(playlist: Playlist | null): void {
        this.existingPlaylistSubject.next(playlist)
    }

    /**
     * Get existing playlist object
     */
    getExistingPlaylist(): Playlist | null {
        return this.existingPlaylistSubject.value
    }

    /**
     * Set selected courses
     */
    setSelectedCourses(courses: SelectableCourse[]): void {
        this.selectedCoursesSubject.next(courses)
    }

    /**
     * Get selected courses
     */
    getSelectedCourses(): SelectableCourse[] {
        return this.selectedCoursesSubject.value
    }

    /**
     * Set ordered courses (after drag & drop)
     */
    setOrderedCourses(courses: SelectableCourse[]): void {
        this.orderedCoursesSubject.next(courses)
    }

    /**
     * Get ordered courses
     */
    getOrderedCourses(): SelectableCourse[] {
        return this.orderedCoursesSubject.value
    }

    /**
     * Clear all state (for back navigation or reset)
     */
    clearState(): void {
        this.filtersSubject.next(null)
        this.existingPlaylistSubject.next(null)
        this.existingCourseIdsSubject.next([])
        this.selectedCoursesSubject.next([])
        this.orderedCoursesSubject.next([])
    }
}
