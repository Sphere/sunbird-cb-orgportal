import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { finalize, take, timeout } from 'rxjs/operators'
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSelectModule } from '@angular/material/select'
import { MatOptionModule } from '@angular/material/core'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { PlaylistStateService } from '../../services/playlist-state.service'
import { PlaylistApiService, PlaylistType } from '../../services/playlist-api.service'
import { CourseApiService } from '../../services/course-api.service'
import { SelectableCompetency, CompetencyLevel } from '../../models/competency.model'
import { Course } from '../../models/course.model'
import { SuccessDialogComponent } from '../../components/success-dialog/success-dialog.component'
import { ErrorDialogComponent } from '../../components/error-dialog/error-dialog.component'
import { RoleConfirmDialogComponent, RoleConfirmDialogData } from '../../components/role-confirm-dialog/role-confirm-dialog.component'
import { getLevelNumbers } from '../../config/competency.config'
import { PLAYLIST_API, PLAYLIST_ROUTES, PLAYLIST_UI } from '../../constants/playlist.constants'
import {
    buildPlaylistPayload,
    restoreSavedCourseAssignments,
    CompetencyPayloadItem,
} from '../../utils/competency-payload.utils'
import { log } from '../../utils/playlist-logger.utils'
import { HideForViewOnlyDirective } from '../../../../shared/directives/hide-for-view-only.directive'
import { FeatureAccessService, FEATURE_KEY } from '../../../../shared/access/feature-access'

/**
 * Component for managing competency playlists.
 *
 * This is where users can:
 * - Reorder competencies by dragging them around
 * - Assign courses to each competency level (currently L1-L5, configurable)
 * - See which competencies already have courses assigned
 * - Save everything back to the playlist
 */
@Component({
    selector: 'app-manage-competency-order',
    templateUrl: './manage-competency-order.component.html',
    styleUrls: ['./manage-competency-order.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, FormsModule, DragDropModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatOptionModule, MatIconModule, MatInputModule, HideForViewOnlyDirective],
})
export class ManageCompetencyOrderComponent implements OnInit {
    readonly competencies = signal<SelectableCompetency[]>([])
    readonly filteredCompetencies = signal<SelectableCompetency[]>([])
    readonly selectedCompetency = signal<SelectableCompetency | null>(null)
    readonly courses = signal<Course[]>([])

    readonly loadingCourses = signal(false)
    readonly searchTerm = signal('')
    readonly saving = signal(false)
    readonly autoSaving = signal(false)
    private readonly _completionTick = signal(0)
    readonly allCompetenciesComplete = computed(() => {
        this._completionTick() // reactive dependency — bumped whenever coursesAssigned changes
        const comps = this.competencies()
        return comps.length > 0 && comps.every((c: SelectableCompetency) => this.isCompetencyComplete(c))
    })

    // Cache for competency-specific courses: Map<competencyId, Course[]>
    private readonly competencyCoursesCache = new Map<string, Course[]>()
    // Filtered courses per level for current competency: Map<level, Course[]>
    levelFilteredCourses = new Map<number, Course[]>()

    private readonly destroyRef = inject(DestroyRef)
    private readonly router = inject(Router)
    private readonly dialog = inject(MatDialog)
    private readonly state = inject(PlaylistStateService)
    private readonly playlistApi = inject(PlaylistApiService)
    private readonly courseApi = inject(CourseApiService)
    private readonly featureAccess = inject(FeatureAccessService)
    private readonly featureKey = inject(FEATURE_KEY, { optional: true })

    /** Read-only mode for view-only users — disables reordering and course dropdowns. */
    get isViewOnly(): boolean {
        return this.featureAccess.isViewOnly(this.featureKey)
    }

    /**
     * Component initialization.
     * Loads selected competencies from state and sets up initial data.
     */
    ngOnInit(): void {
        // Redirect if no competencies selected
        const selected = this.state.getSelectedCompetencies()
        if (!selected || selected.length === 0) {
            this.router.navigate([PLAYLIST_ROUTES.SELECT_COMPETENCIES])
            return
        }

        this.loadCompetencies()
    }

    /**
     * Loads the competencies that were selected on the previous page.
     * If we're editing an existing playlist, we also restore which courses were assigned before.
     */
    private loadCompetencies(): void {
        const selected = this.state.getSelectedCompetencies()
        if (!selected || selected.length === 0) {
            return
        }

        // Get existing playlist to pre-populate course assignments and order
        const existingPlaylist = this.state.getExistingCompetencyPlaylist()
        const existingPayload: CompetencyPayloadItem[] = (existingPlaylist?.dataSource?.payload as CompetencyPayloadItem[]) || []

        const comps = selected.map((c, arrayIndex) => {
            // Find existing competency data to get saved index/order
            const selectedCode = String(c.code || '').trim().toUpperCase()
            const selectedId = parseInt(c.id, 10)
            const existingComp = existingPayload.find(item =>
                (selectedCode && String(item?.code || '').trim().toUpperCase() === selectedCode) ||
                (!selectedCode && !isNaN(selectedId) && item?.id === selectedId)
            )

            // V2 format: index field determines position (0-based), displayOrder is 1-based
            // If index exists, use it; otherwise use array position
            const savedIndex = existingComp?.index
            const displayOrder = savedIndex !== undefined ? savedIndex + 1 : arrayIndex + 1

            const comp: SelectableCompetency = {
                ...c,
                displayOrder: displayOrder,
                levels: c.levels || this.getDefaultLevels()
            }

            if (existingPayload.length > 0) {
                restoreSavedCourseAssignments(comp, existingPayload)
            }

            // If this competency already has all 5 levels with courses assigned,
            // mark it as complete so it shows the checkmark
            if (comp.levels && comp.levels.length === 5) {
                const allLevelsHaveCourses = comp.levels.every(l => !!l.courseId)
                if (allLevelsHaveCourses) {
                    comp.coursesAssigned = true
                }
            }

            return comp
        })

        // Sort by displayOrder to ensure correct visual order
        comps.sort((a: SelectableCompetency, b: SelectableCompetency) => a.displayOrder - b.displayOrder)
        this.competencies.set(comps)
        this._completionTick.update(v => v + 1)

        this.filteredCompetencies.set([...comps])

        // Auto-select first competency and load its courses immediately
        if (comps.length > 0) {
            this.selectedCompetency.set(comps[0])
            this.loadCompetencyLevelCourses(comps[0])
        }
    }

    /**
     * Loads the courses that are mapped to a specific competency.
     * We cache the results in a local Map so we don't have to fetch them again
     * if the user switches back and forth between competencies.
     */
    private loadCompetencyLevelCourses(competency: SelectableCompetency): void {
        if (!competency?.id) return

        // Check local cache first to avoid redundant API calls
        const cached = this.competencyCoursesCache.get(competency.id)
        if (cached) {
            this.courses.set(cached)
            this.updateLevelFilteredCourses(competency.id, cached)
            return
        }
        // TODO: Temporarily using empty string for language until we have language specific courses mapped in the API
        // const filters = this.state.getFilters()
        // const language = filters?.language || 'en'

        const language = ''

        this.loadingCourses.set(true)
        const loadingGuard = setTimeout(() => {
            this.loadingCourses.set(false)
        }, PLAYLIST_UI.LOADING_GUARD_MS)

        this.courseApi.searchCoursesByCompetency(competency.id, language).pipe(
            take(1),
            timeout(PLAYLIST_UI.COURSE_LOAD_TIMEOUT_MS),
            finalize(() => {
                clearTimeout(loadingGuard)
                this.loadingCourses.set(false)
            })
        ).subscribe({
            next: (response) => {
                this.loadingCourses.set(false)
                const courses = response?.courses || []

                // Update main courses list for selection lookup
                this.courses.set(courses)

                // Save results to local cache Map
                this.competencyCoursesCache.set(competency.id, courses)

                // Update level-filtered courses for the UI
                this.updateLevelFilteredCourses(competency.id, courses)
            },
            error: (error) => {
                log.error('Failed to load competency courses:', error)
                this.levelFilteredCourses.clear()
                this.loadingCourses.set(false)
            }
        })
    }

    /**
     * Creates the default level structure for competencies.
     * Currently generates 5 levels: L1, L2, L3, L4, L5
     * This is configurable and can be changed to support more or fewer levels.
     */
    private getDefaultLevels(): CompetencyLevel[] {
        return getLevelNumbers().map(levelNum => ({
            level: levelNum
        }))
    }

    /** Handles when users drag and drop to reorder competencies */
    onDrop(event: CdkDragDrop<SelectableCompetency[]>): void {
        // Don't allow reordering while auto-saving
        if (this.autoSaving()) {
            return
        }

        const comps = [...this.competencies()]
        const filtered = [...this.filteredCompetencies()]
        if (!filtered.length || event.previousIndex === event.currentIndex) {
            return
        }

        // Reorder based on the rendered (filtered) list first.
        moveItemInArray(filtered, event.previousIndex, event.currentIndex)

        const hasSearch = this.searchTerm().trim().length > 0
        const reorderedComps = hasSearch
            // When searching, only reorder visible items while keeping hidden items in place.
            ? this.mergeFilteredOrderIntoFull(comps, filtered)
            // Without search, filtered == full list.
            : filtered

        reorderedComps.forEach((c: SelectableCompetency, index: number) => { c.displayOrder = index + 1 })
        this.competencies.set(reorderedComps)
        this.filteredCompetencies.set(hasSearch ? filtered : [...reorderedComps])

        // Update state service with new order
        this.state.setSelectedCompetencies(reorderedComps)

        // Auto-save to API if all competencies are complete
        this.autoSaveOrder()
    }

    /** Applies filtered drag order back into the full competency list */
    private mergeFilteredOrderIntoFull(
        fullList: SelectableCompetency[],
        reorderedFiltered: SelectableCompetency[]
    ): SelectableCompetency[] {
        const key = (c: SelectableCompetency) =>
            `${String(c.code || '').trim().toUpperCase()}::${String(c.id || '').trim()}`

        const filteredKeySet = new Set(reorderedFiltered.map(key))
        let filteredIndex = 0

        return fullList.map(item => {
            if (filteredKeySet.has(key(item))) {
                const next = reorderedFiltered[filteredIndex]
                filteredIndex += 1
                return next
            }
            return item
        })
    }

    /** Filters the competency list based on what the user types in the search box */
    onSearch(): void {
        this.filterCompetencies()
    }

    /** Actually does the filtering logic */
    filterCompetencies(): void {
        const comps = this.competencies()
        if (!comps.length) {
            this.filteredCompetencies.set([])
            return
        }

        const term = this.searchTerm().toLowerCase().trim()
        this.filteredCompetencies.set(term
            ? comps.filter((c: SelectableCompetency) =>
                c?.name?.toLowerCase().includes(term) ||
                c?.code?.toLowerCase().includes(term)
            )
            : [...comps]
        )
    }

    /**
     * When a user clicks on a competency card, we select it and load the courses for it.
     * Each competency has its own set of courses, so we fetch them on demand.
     */
    onSelectCompetency(competency: SelectableCompetency): void {
        this.selectedCompetency.set(competency)
        this.loadCompetencyLevelCourses(competency)
    }

    /**
     * Organizes courses by level.
     * Currently: L1, L2, L3, L4, L5 (configurable)
     * Each level dropdown will only show courses that are appropriate for that level.
     */
    private updateLevelFilteredCourses(competencyId: string, courses: Course[]): void {
        this.levelFilteredCourses.clear()

        // Iterate through all configured levels (currently 1-5)
        getLevelNumbers().forEach(level => {
            const filtered = this.courseApi.filterCoursesByLevel(courses, competencyId, level)
            this.levelFilteredCourses.set(level, filtered)
        })
    }

    /**
     * Gets the courses to show in a specific level's dropdown.
     */
    getCoursesForLevel(level: number): Course[] {
        return this.levelFilteredCourses.get(level) || this.courses()
    }

    /** Saves the course selection when a user picks one from the dropdown */
    onCourseSelect(level: CompetencyLevel, courseId: string): void {
        if (!level || !courseId) return

        const course = this.courses().find((c: Course) => c?.identifier === courseId)
        level.courseId = courseId
        level.courseName = course?.name || ''

        const comps = this.competencies()
        if (comps.length > 0) {
            this.state.setSelectedCompetencies(comps)
        }
    }

    /**
     * Validates if the currently selected competency is ready to be assigned.
     * Returns true only if all required levels (typically L1-L5) have a course selected.
     */
    isCurrentCompetencyComplete(): boolean {
        const sel = this.selectedCompetency()
        if (!sel?.levels) return false
        return sel.levels.every((l: CompetencyLevel) => !!l.courseId)
    }

    /**
     * Marks the current competency as done and moves to the next one that needs work.
     */
    onAssignCourses(): void {
        const sel = this.selectedCompetency()
        if (!sel || !this.isCurrentCompetencyComplete()) return

        // Mark as assigned - this will show the checkmark
        sel.coursesAssigned = true
        this._completionTick.update(v => v + 1)

        // Move to next incomplete competency and load its courses
        const nextIncomplete = this.competencies().find((c: SelectableCompetency) => !this.isCompetencyComplete(c))
        if (nextIncomplete) {
            this.selectedCompetency.set(nextIncomplete)
            this.loadCompetencyLevelCourses(nextIncomplete)
        }
    }

    /** Checks if a competency has all its courses assigned */
    isCompetencyComplete(competency: SelectableCompetency): boolean {
        if (!competency) return false
        // Only return true if explicitly marked as assigned via "Assign courses" button
        // This prevents auto-check when dropdowns are filled
        return competency.coursesAssigned === true
    }

    /** Takes the user back to the competency selection page */
    onBack(): void {
        this.router.navigate([PLAYLIST_ROUTES.SELECT_COMPETENCIES])
    }

    /**
     * Saves the entire competency playlist to the backend.
     * This is called when the user clicks the Save button.
     * Shows confirmation dialog if roles differ from existing configuration.
     */
    async onSave(): Promise<void> {
        // Get filters and existing playlist
        const filters = this.state.getFilters()
        const existingPlaylist = this.state.getExistingCompetencyPlaylist() || undefined

        if (!filters) {
            this.showError('Filter data not found')
            return
        }

        // Compare roles before saving
        const roleComparison = this.state.compareRoles(filters.role)

        // If roles differ, show confirmation dialog
        if (!roleComparison.isNewPlaylist && !roleComparison.isExactMatch) {
            const dialogData: RoleConfirmDialogData = {
                newRoles: roleComparison.newRoles,
                existingOnlyRoles: roleComparison.existingOnlyRoles,
                isNewPlaylist: roleComparison.isNewPlaylist
            }

            const dialogRef = this.dialog.open(RoleConfirmDialogComponent, {
                width: PLAYLIST_UI.DIALOG_WIDTH,
                disableClose: true,
                data: dialogData
            })

            const confirmed = await dialogRef.afterClosed().pipe(take(1)).toPromise()

            if (!confirmed) {
                return // User cancelled
            }
        }

        // Proceed with save
        this.saving.set(true)

        // Build competency payload
        const authToken = PLAYLIST_API.DEFAULT_AUTH_TOKEN

        const competencyPayload = buildPlaylistPayload(this.competencies(), authToken, existingPlaylist)

        // Merge roles (combine existing + selected)
        const mergedRoles = this.state.getMergedRoles(filters.role)
        const filtersWithMergedRoles = { ...filters, role: mergedRoles }

        this.playlistApi.savePlaylist(filtersWithMergedRoles, competencyPayload, existingPlaylist, PlaylistType.COMPETENCY)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.saving.set(false)
                    this.showSuccess(
                        'Competency Updated',
                        'Learners will now see the updated competencies and assigned courses on their home screen.',
                    )
                },
                error: (error: Error) => {
                    log.error('Failed to save playlist:', error)
                    this.saving.set(false)
                    this.showError('Failed to save playlist. Please try again.')
                }
            })
    }

    /** Shows a success message and takes the user to the summary page */
    private showSuccess(title: string, message: string): void {
        this.dialog.open(SuccessDialogComponent, { data: { title, message } })
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.router.navigate([PLAYLIST_ROUTES.HOME_SUMMARY]))
    }

    /**
     * Utility to display a standardized error message dialog.
     */
    private showError(message: string): void {
        this.dialog.open(ErrorDialogComponent, { data: { message } })
    }

    /**
     * Automatically saves the playlist after reordering.
     * We only do this if all competencies are complete (to avoid saving incomplete data).
     */
    private autoSaveOrder(): void {
        // Don't auto-save if not all competencies are complete
        if (!this.allCompetenciesComplete()) {
            return
        }

        const filters = this.state.getFilters()
        const existingPlaylist = this.state.getExistingCompetencyPlaylist()

        if (!filters) {
            log.error('Auto-save failed: No filters found')
            return
        }

        this.autoSaving.set(true)

        const authToken = PLAYLIST_API.DEFAULT_AUTH_TOKEN

        const competencyPayload = buildPlaylistPayload(this.competencies(), authToken, existingPlaylist || undefined)

        this.playlistApi.savePlaylist(
            filters,
            competencyPayload,
            existingPlaylist || undefined,
            PlaylistType.COMPETENCY
        ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.autoSaving.set(false)
            },
            error: (error: Error) => {
                log.error('Auto-save failed:', error)
                this.autoSaving.set(false)
                this.showError('Failed to save competency order. Please try again.')
            }
        })
    }

}
