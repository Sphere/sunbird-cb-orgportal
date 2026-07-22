import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { PlaylistFilters, Playlist, RoleComparisonResult } from '../models/playlist.model'
import { Course, SelectableCourse } from '../models/course.model'
import { SelectableCompetency } from '../models/competency.model'
import { RawCompetencyEntity } from '../utils/competency-transformer'
import { CourseContextKey, DEFAULT_COURSE_CONTEXT_KEY } from '../config/course-context.config'

/**
 * One independent set of course-playlist state.
 * There is one per course context (standard course playlist, ASKME course playlist, ...),
 * so selections made in one flow never leak into the other.
 */
interface CourseContextState {
    existingPlaylist: BehaviorSubject<Playlist | null>
    existingCourseIds: BehaviorSubject<string[]>
    selectedCourses: BehaviorSubject<SelectableCourse[]>
    orderedCourses: BehaviorSubject<SelectableCourse[]>
}



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

    // Course playlist state, one slice per course context (default / askme).
    // Created lazily so a new context needs no extra wiring here.
    private courseContexts = new Map<CourseContextKey, CourseContextState>()

    // Competency Playlist (for edit mode)
    private existingCompetencyPlaylistSubject = new BehaviorSubject<Playlist | null>(null)
    public existingCompetencyPlaylist$ = this.existingCompetencyPlaylistSubject.asObservable()

    // Competency IDs from existing playlist
    private existingCompetencyIdsSubject = new BehaviorSubject<string[]>([])
    public existingCompetencyIds$ = this.existingCompetencyIdsSubject.asObservable()

    // Search Playlist (query payload editor)
    private existingSearchPlaylistSubject = new BehaviorSubject<Playlist | null>(null)
    public existingSearchPlaylist$ = this.existingSearchPlaylistSubject.asObservable()

    // Competency codes from existing playlist (preferred key for preselection)
    private existingCompetencyCodesSubject = new BehaviorSubject<string[]>([])
    public existingCompetencyCodes$ = this.existingCompetencyCodesSubject.asObservable()

    // Course cache for search
    private courseCache: Course[] = []
    private courseCacheLanguage: string = ''

    // Competency cache for search
    private competencyCache: RawCompetencyEntity[] = []
    private competencyCacheLanguage: string = ''

    // Competency state
    private selectedCompetenciesSubject = new BehaviorSubject<SelectableCompetency[]>([])
    public selectedCompetencies$ = this.selectedCompetenciesSubject.asObservable()

    constructor() { }

    /** Returns the state slice for a course context, creating it on first use */
    private courseState(context: CourseContextKey = DEFAULT_COURSE_CONTEXT_KEY): CourseContextState {
        let slice = this.courseContexts.get(context)
        if (!slice) {
            slice = {
                existingPlaylist: new BehaviorSubject<Playlist | null>(null),
                existingCourseIds: new BehaviorSubject<string[]>([]),
                selectedCourses: new BehaviorSubject<SelectableCourse[]>([]),
                orderedCourses: new BehaviorSubject<SelectableCourse[]>([]),
            }
            this.courseContexts.set(context, slice)
        }
        return slice
    }

    /** Stores the current playlist filter criteria */
    setFilters(filters: PlaylistFilters): void {
        this.filtersSubject.next(filters)
    }

    /** Retrieves the currently active filters */
    getFilters(): PlaylistFilters | null {
        return this.filtersSubject.value
    }

    /** Stores the IDs of courses present in the existing playlist (for pre-selection) */
    setExistingCourseIds(ids: string[], context: CourseContextKey = DEFAULT_COURSE_CONTEXT_KEY): void {
        this.courseState(context).existingCourseIds.next(ids)
    }

    /** Retrieves pre-selection course IDs */
    getExistingCourseIds(context: CourseContextKey = DEFAULT_COURSE_CONTEXT_KEY): string[] {
        return this.courseState(context).existingCourseIds.value
    }

    /** Stores the full course playlist object for reference during updates */
    setExistingPlaylist(playlist: Playlist | null, context: CourseContextKey = DEFAULT_COURSE_CONTEXT_KEY): void {
        this.courseState(context).existingPlaylist.next(playlist)
    }

    /** Retrieves the existing course playlist object */
    getExistingPlaylist(context: CourseContextKey = DEFAULT_COURSE_CONTEXT_KEY): Playlist | null {
        return this.courseState(context).existingPlaylist.value
    }

    /** Stores the full competency playlist object */
    setExistingCompetencyPlaylist(playlist: Playlist | null): void {
        this.existingCompetencyPlaylistSubject.next(playlist)
    }

    /** Retrieves the existing competency playlist object */
    getExistingCompetencyPlaylist(): Playlist | null {
        return this.existingCompetencyPlaylistSubject.value
    }

    /** Stores the full search playlist object */
    setExistingSearchPlaylist(playlist: Playlist | null): void {
        this.existingSearchPlaylistSubject.next(playlist)
    }

    /** Retrieves the existing search playlist object */
    getExistingSearchPlaylist(): Playlist | null {
        return this.existingSearchPlaylistSubject.value
    }

    /** Stores the IDs of competencies present in the existing playlist */
    setExistingCompetencyIds(ids: string[]): void {
        this.existingCompetencyIdsSubject.next(ids)
    }

    /** Retrieves pre-selection competency IDs */
    getExistingCompetencyIds(): string[] {
        return this.existingCompetencyIdsSubject.value
    }

    /** Stores competency codes from existing playlist */
    setExistingCompetencyCodes(codes: string[]): void {
        this.existingCompetencyCodesSubject.next(codes)
    }

    /** Retrieves pre-selection competency codes */
    getExistingCompetencyCodes(): string[] {
        return this.existingCompetencyCodesSubject.value
    }

    /** Stores the user's current course selections */
    setSelectedCourses(courses: SelectableCourse[], context: CourseContextKey = DEFAULT_COURSE_CONTEXT_KEY): void {
        this.courseState(context).selectedCourses.next(courses)
    }

    /** Retrieves the active list of selected courses */
    getSelectedCourses(context: CourseContextKey = DEFAULT_COURSE_CONTEXT_KEY): SelectableCourse[] {
        return this.courseState(context).selectedCourses.value
    }

    /** Stores the final order of courses after drag-and-drop */
    setOrderedCourses(courses: SelectableCourse[], context: CourseContextKey = DEFAULT_COURSE_CONTEXT_KEY): void {
        this.courseState(context).orderedCourses.next(courses)
    }

    /** Retrieves the manually ordered list of courses */
    getOrderedCourses(context: CourseContextKey = DEFAULT_COURSE_CONTEXT_KEY): SelectableCourse[] {
        return this.courseState(context).orderedCourses.value
    }

    /** Caches the master list of courses to avoid redundant API calls */
    setCachedCourses(courses: Course[], language: string): void {
        this.courseCache = courses
        this.courseCacheLanguage = language
    }

    /** Retrieves courses from cache if the language matches */
    getCachedCourses(language: string): Course[] | null {
        if (this.courseCacheLanguage === language && this.courseCache.length > 0) {
            return this.courseCache
        }
        return null
    }

    /** Clears the course search cache */
    clearCourseCache(): void {
        this.courseCache = []
        this.courseCacheLanguage = ''
    }

    /** Caches raw competency data after a successful fetch */
    setCachedCompetencies(competencies: RawCompetencyEntity[], language: string): void {
        this.competencyCache = competencies
        this.competencyCacheLanguage = language
    }

    /** Retrieves raw competency data from cache */
    getCachedCompetencies(language: string): RawCompetencyEntity[] | null {
        if (this.competencyCacheLanguage === language && this.competencyCache.length > 0) {
            return this.competencyCache
        }
        return null
    }

    /** Clears the competency search cache */
    clearCompetencyCache(): void {
        this.competencyCache = []
        this.competencyCacheLanguage = ''
    }

    /** Resets all course-related selections */
    clearSelectedCourses(context: CourseContextKey = DEFAULT_COURSE_CONTEXT_KEY): void {
        const slice = this.courseState(context)
        slice.selectedCourses.next([])
        slice.orderedCourses.next([])
    }

    /** Stores the user's current competency selections */
    setSelectedCompetencies(competencies: SelectableCompetency[]): void {
        this.selectedCompetenciesSubject.next(competencies)
    }

    /** Retrieves the active list of selected competencies */
    getSelectedCompetencies(): SelectableCompetency[] {
        return this.selectedCompetenciesSubject.value
    }

    /** Resets current competency selections */
    clearSelectedCompetencies(): void {
        this.selectedCompetenciesSubject.next([])
    }

    /**
     * Compares currently selected roles with the roles defined in the existing playlist.
     * Helps determine if an update is needed or if a new playlist should be created.
     */
    compareRoles(
        selectedRoles: string[] | null | undefined,
        context: CourseContextKey = DEFAULT_COURSE_CONTEXT_KEY
    ): RoleComparisonResult {
        const defaultResult: RoleComparisonResult = {
            newRoles: [],
            existingOnlyRoles: [],
            isExactMatch: true,
            isNewPlaylist: true
        }

        const safeSelectedRoles = selectedRoles ?? []
        const existingPlaylist = this.getExistingPlaylist(context)

        if (!existingPlaylist) {
            return defaultResult
        }

        const existingRoles = existingPlaylist.role ?? []

        if (safeSelectedRoles.length === 0 && existingRoles.length === 0) {
            return { ...defaultResult, isNewPlaylist: false }
        }

        const selectedSet = new Set(safeSelectedRoles.map(r => r?.toUpperCase?.() ?? ''))
        const existingSet = new Set(existingRoles.map(r => r?.toUpperCase?.() ?? ''))

        selectedSet.delete('')
        existingSet.delete('')

        const newRoles = safeSelectedRoles.filter(r =>
            r && !existingSet.has(r.toUpperCase())
        )

        const existingOnlyRoles = existingRoles.filter(r =>
            r && !selectedSet.has(r.toUpperCase())
        )

        const isExactMatch = newRoles.length === 0 && existingOnlyRoles.length === 0

        return {
            newRoles,
            existingOnlyRoles,
            isExactMatch,
            isNewPlaylist: false
        }
    }

    /**
     * Combines currently selected roles with existing playlist roles.
     * Ensures a unique set of roles while preserving the original casing where possible.
     */
    getMergedRoles(
        selectedRoles: string[] | null | undefined,
        context: CourseContextKey = DEFAULT_COURSE_CONTEXT_KEY
    ): string[] {
        const safeSelectedRoles = selectedRoles ?? []
        const existingPlaylist = this.getExistingPlaylist(context)

        if (!existingPlaylist) {
            return safeSelectedRoles.filter(r => r)
        }

        const existingRoles = existingPlaylist.role ?? []
        const roleMap = new Map<string, string>()

        existingRoles.forEach(role => {
            if (role) {
                roleMap.set(role.toUpperCase(), role)
            }
        })

        safeSelectedRoles.forEach(role => {
            if (role) {
                roleMap.set(role.toUpperCase(), role)
            }
        })

        return Array.from(roleMap.values())
    }

    /** Full reset of all application state - used when leaving the playlist workflow */
    clearState(): void {
        this.filtersSubject.next(null)
        this.courseContexts.forEach(slice => {
            slice.existingPlaylist.next(null)
            slice.existingCourseIds.next([])
            slice.selectedCourses.next([])
            slice.orderedCourses.next([])
        })
        this.existingCompetencyPlaylistSubject.next(null)
        this.existingCompetencyIdsSubject.next([])
        this.existingCompetencyCodesSubject.next([])
        this.existingSearchPlaylistSubject.next(null)
        this.clearSelectedCompetencies()
        this.clearCourseCache()
        this.clearCompetencyCache()
    }
}
