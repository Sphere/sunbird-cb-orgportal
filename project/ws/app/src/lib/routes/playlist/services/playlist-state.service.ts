import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { PlaylistFilters, Playlist, RoleComparisonResult } from '../models/playlist.model'
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

    /**
     * Clear selected/ordered courses
     * Used when starting a new playlist creation flow
     */
    clearSelectedCourses(): void {
        this.selectedCoursesSubject.next([])
        this.orderedCoursesSubject.next([])
    }

    /**
     * Compare selected roles with existing playlist roles
     * 
     * Use Cases:
     * 1. New roles added: User selected roles not in existing playlist
     * 2. Existing-only roles: Roles in DB but user didn't select
     * 3. Exact match: No differences
     * 4. New playlist: No existing data to compare
     * 
     * @param selectedRoles Roles user selected in the filter (can be null/undefined)
     * @returns RoleComparisonResult with newRoles, existingOnlyRoles, and flags
     */
    compareRoles(selectedRoles: string[] | null | undefined): RoleComparisonResult {
        // Default result for edge cases
        const defaultResult: RoleComparisonResult = {
            newRoles: [],
            existingOnlyRoles: [],
            isExactMatch: true,
            isNewPlaylist: true
        }

        // Handle null/undefined selectedRoles
        const safeSelectedRoles = selectedRoles ?? []

        const existingPlaylist = this.getExistingPlaylist()

        // No existing playlist - it's a new creation, no comparison needed
        if (!existingPlaylist) {
            return defaultResult
        }

        // Get existing roles with null safety
        const existingRoles = existingPlaylist.role ?? []

        // Edge case: both empty
        if (safeSelectedRoles.length === 0 && existingRoles.length === 0) {
            return { ...defaultResult, isNewPlaylist: false }
        }

        // Normalize to uppercase for case-insensitive comparison
        const selectedSet = new Set(safeSelectedRoles.map(r => r?.toUpperCase?.() ?? ''))
        const existingSet = new Set(existingRoles.map(r => r?.toUpperCase?.() ?? ''))

        // Remove empty strings from sets
        selectedSet.delete('')
        existingSet.delete('')

        // Find new roles (in selected but not in existing)
        const newRoles = safeSelectedRoles.filter(r =>
            r && !existingSet.has(r.toUpperCase())
        )

        // Find existing-only roles (in existing but not selected)
        const existingOnlyRoles = existingRoles.filter(r =>
            r && !selectedSet.has(r.toUpperCase())
        )

        // Check if exact match (no differences)
        const isExactMatch = newRoles.length === 0 && existingOnlyRoles.length === 0

        return {
            newRoles,
            existingOnlyRoles,
            isExactMatch,
            isNewPlaylist: false
        }
    }

    /**
     * Merge selected roles with existing playlist roles
     * Combines both sets without duplicates (case-insensitive deduplication)
     * 
     * Use Cases:
     * 1. Update playlist: Merge new roles with existing
     * 2. Create playlist: Return selected roles as-is
     * 
     * @param selectedRoles Roles user selected in the filter (can be null/undefined)
     * @returns Merged unique role array (preserves original case)
     */
    getMergedRoles(selectedRoles: string[] | null | undefined): string[] {
        // Handle null/undefined
        const safeSelectedRoles = selectedRoles ?? []

        const existingPlaylist = this.getExistingPlaylist()

        // No existing playlist - return selected roles only
        if (!existingPlaylist) {
            return safeSelectedRoles.filter(r => r) // Filter out null/empty
        }

        const existingRoles = existingPlaylist.role ?? []

        // Merge and deduplicate (case-insensitive but preserve original case)
        const roleMap = new Map<string, string>()

        // Add existing roles first
        existingRoles.forEach(role => {
            if (role) {
                roleMap.set(role.toUpperCase(), role)
            }
        })

        // Add selected roles (may override case, which is fine)
        safeSelectedRoles.forEach(role => {
            if (role) {
                roleMap.set(role.toUpperCase(), role)
            }
        })

        return Array.from(roleMap.values())
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

