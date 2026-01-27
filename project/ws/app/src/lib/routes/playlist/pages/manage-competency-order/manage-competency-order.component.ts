import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { PlaylistStateService } from '../../services/playlist-state.service'
import { PlaylistApiService, PlaylistType } from '../../services/playlist-api.service'
import { CourseApiService } from '../../services/course-api.service'
import { SelectableCompetency, CompetencyLevel } from '../../models/competency.model'
import { Course } from '../../models/course.model'
import { SuccessDialogComponent } from '../../components/success-dialog/success-dialog.component'
import { ErrorDialogComponent } from '../../components/error-dialog/error-dialog.component'
import { RoleConfirmDialogComponent, RoleConfirmDialogData } from '../../components/role-confirm-dialog/role-confirm-dialog.component'

/**
 * Component for managing competency playlists.
 * 
 * This is where users can:
 * - Reorder competencies by dragging them around
 * - Assign courses to each competency level (L1-L5)
 * - See which competencies already have courses assigned
 * - Save everything back to the playlist
 */
@Component({
    selector: 'app-manage-competency-order',
    templateUrl: './manage-competency-order.component.html',
    styleUrls: ['./manage-competency-order.component.scss'],
})
export class ManageCompetencyOrderComponent implements OnInit {
    competencies: SelectableCompetency[] = []
    filteredCompetencies: SelectableCompetency[] = []
    selectedCompetency: SelectableCompetency | null = null

    courses: Course[] = []
    loadingCourses = false
    searchTerm = ''
    saving = false
    autoSaving = false

    // Cache for competency-specific courses: Map<competencyId, Course[]>
    private competencyCoursesCache = new Map<string, Course[]>()
    // Filtered courses per level for current competency: Map<level, Course[]>
    levelFilteredCourses = new Map<number, Course[]>()

    constructor(
        private router: Router,
        private dialog: MatDialog,
        private state: PlaylistStateService,
        private playlistApi: PlaylistApiService,
        private courseApi: CourseApiService
    ) { }

    ngOnInit(): void {
        this.loadCompetencies()
        // Note: Courses are now loaded per competency when selected (loadCompetencyLevelCourses)
        // No need to load all courses upfront
    }

    /**
     * Loads the competencies that were selected on the previous page.
     * If nothing was selected, we send them back to the selection page.
     * If we're editing an existing playlist, we also restore which courses were assigned before.
     */
    private loadCompetencies(): void {
        const selected = this.state.getSelectedCompetencies()
        if (!selected || selected.length === 0) {
            this.router.navigate(['/app/playlist/select-competencies'])
            return
        }

        // Get existing playlist to pre-populate course assignments and order
        const existingPlaylist = this.state.getExistingCompetencyPlaylist()
        const existingPayload = existingPlaylist?.dataSource?.payload || []

        this.competencies = selected.map((c, arrayIndex) => {
            // Find existing competency data to get saved index/order
            const existingComp = existingPayload.find((item: any) =>
                item?.id === parseInt(c.id, 10)
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
                this.restoreSavedCourseAssignments(comp, existingPayload)
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
        this.competencies.sort((a, b) => a.displayOrder - b.displayOrder)

        this.filteredCompetencies = [...this.competencies]

        // Auto-select first competency and load its courses
        if (this.competencies.length > 0) {
            this.selectedCompetency = this.competencies[0]
            this.loadCompetencyLevelCourses(this.competencies[0])
        }
    }

    /** Creates the default 5-level structure for competencies */
    private getDefaultLevels(): CompetencyLevel[] {
        return [
            { level: 1 },
            { level: 2 },
            { level: 3 },
            { level: 4 },
            { level: 5 }
        ]
    }

    /**
     * When editing an existing playlist, we need to show which courses were already assigned.
     * This method fills in those course selections so users can see what they had before.
     */
    private restoreSavedCourseAssignments(competency: SelectableCompetency, playlistPayload: any[]): void {
        if (!playlistPayload || !competency?.id || !competency.levels) return

        // V2 format: payload is flat array, find by id directly
        const existingComp = playlistPayload.find((item: any) =>
            item?.id === parseInt(competency.id, 10)
        )

        if (!existingComp || !existingComp.levels) return



        // V2 format: levels array with courseId directly
        competency.levels.forEach(level => {
            const savedLevel = existingComp.levels.find((l: any) => l.level === level.level)

            if (savedLevel?.courseId) {
                level.courseId = savedLevel.courseId
                level.courseName = savedLevel.name || ''

            }
        })
    }

    /** Handles when users drag and drop to reorder competencies */
    onDrop(event: CdkDragDrop<SelectableCompetency[]>): void {
        // Don't allow reordering while auto-saving
        if (this.autoSaving) {
            return
        }

        moveItemInArray(this.competencies, event.previousIndex, event.currentIndex)
        this.updateOrderNumbers()
        this.filteredCompetencies = this.searchTerm ? this.filteredCompetencies : [...this.competencies]

        // Update state service with new order
        this.state.setSelectedCompetencies(this.competencies)

        // Auto-save to API if all competencies are complete
        this.autoSaveOrder()
    }

    /** Updates the display numbers after reordering (1, 2, 3, etc.) */
    private updateOrderNumbers(): void {
        this.competencies.forEach((c, index) => {
            c.displayOrder = index + 1
        })
    }

    /** Filters the competency list based on what the user types in the search box */
    onSearch(): void {
        this.filterCompetencies()
    }

    /** Actually does the filtering logic */
    filterCompetencies(): void {
        if (!this.competencies) {
            this.filteredCompetencies = []
            return
        }

        const term = (this.searchTerm || '').toLowerCase().trim()
        this.filteredCompetencies = term
            ? this.competencies.filter(c =>
                c?.name?.toLowerCase().includes(term) ||
                c?.code?.toLowerCase().includes(term)
            )
            : [...this.competencies]
    }

    /** 
     * When a user clicks on a competency card, we select it and load the courses for it.
     * Each competency has its own set of courses, so we fetch them on demand.
     */
    onSelectCompetency(competency: SelectableCompetency): void {
        this.selectedCompetency = competency
        this.loadCompetencyLevelCourses(competency)
    }

    /**
     * Loads the courses that are mapped to a specific competency.
     * We cache the results so we don't have to fetch them again if the user switches back.
     */
    private async loadCompetencyLevelCourses(competency: SelectableCompetency): Promise<void> {
        if (!competency?.id) return

        // Check cache first
        const cached = this.competencyCoursesCache.get(competency.id)
        if (cached) {

            this.updateLevelFilteredCourses(competency.id, cached)
            return
        }

        // Fetch from API
        const filters = this.state.getFilters()
        const language = filters?.language || 'en'

        this.loadingCourses = true

        try {
            const response = await this.courseApi.searchCoursesByCompetency(competency.id, language).toPromise()
            const courses = response?.courses || []



            // Cache the results
            this.competencyCoursesCache.set(competency.id, courses)

            // Update level-filtered courses
            this.updateLevelFilteredCourses(competency.id, courses)
        } catch (error) {
            console.error('Failed to load competency courses:', error)
            this.levelFilteredCourses.clear()
        } finally {
            this.loadingCourses = false
        }
    }

    /**
     * Organizes courses by level (L1, L2, L3, L4, L5).
     * Each level dropdown will only show courses that are appropriate for that level.
     */
    private updateLevelFilteredCourses(competencyId: string, courses: Course[]): void {
        this.levelFilteredCourses.clear()

        for (let level = 1; level <= 5; level++) {
            const filtered = this.courseApi.filterCoursesByLevel(courses, competencyId, level)
            this.levelFilteredCourses.set(level, filtered)

        }
    }

    /**
     * Gets the courses to show in a specific level's dropdown.
     */
    getCoursesForLevel(level: number): Course[] {
        return this.levelFilteredCourses.get(level) || this.courses
    }

    /** Saves the course selection when a user picks one from the dropdown */
    onCourseSelect(level: CompetencyLevel, courseId: string): void {
        if (!level || !courseId) return

        const course = this.courses.find(c => c?.identifier === courseId)
        level.courseId = courseId
        level.courseName = course?.name || ''

        if (this.competencies && this.competencies.length > 0) {
            this.state.setSelectedCompetencies(this.competencies)
        }
    }

    /** Checks if the currently selected competency has all 5 levels filled in */
    isCurrentCompetencyComplete(): boolean {
        if (!this.selectedCompetency?.levels) return false
        return this.selectedCompetency.levels.every(l => !!l.courseId)
    }

    /**
     * Marks the current competency as done and moves to the next one that needs work.
     */
    onAssignCourses(): void {
        if (!this.selectedCompetency || !this.isCurrentCompetencyComplete()) return

        // Mark as assigned - this will show the checkmark
        this.selectedCompetency.coursesAssigned = true

        // Move to next incomplete competency and load its courses
        const nextIncomplete = this.competencies.find(c => !this.isCompetencyComplete(c))
        if (nextIncomplete) {
            this.selectedCompetency = nextIncomplete
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

    /** Returns true only if every competency has all its courses assigned */
    get allCompetenciesComplete(): boolean {
        if (!this.competencies || this.competencies.length === 0) return false
        return this.competencies.every(c => this.isCompetencyComplete(c))
    }

    /** Takes the user back to the competency selection page */
    onBack(): void {
        this.router.navigate(['/app/playlist/select-competencies'])
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
                width: '450px',
                disableClose: true,
                data: dialogData
            })

            const confirmed = await dialogRef.afterClosed().toPromise()

            if (!confirmed) {
                return // User cancelled
            }
        }

        // Proceed with save
        this.saving = true

        // Build competency payload
        const authToken = 'system'

        const competencyPayload = this.buildPlaylistPayload(
            this.competencies,
            authToken,
            existingPlaylist
        )



        // Merge roles (combine existing + selected)
        const mergedRoles = this.state.getMergedRoles(filters.role)
        const filtersWithMergedRoles = { ...filters, role: mergedRoles }

        this.playlistApi.savePlaylist(filtersWithMergedRoles, competencyPayload, existingPlaylist, PlaylistType.COMPETENCY)
            .subscribe({
                next: () => {
                    this.saving = false
                    this.showSuccess(
                        'Competency Updated',
                        'Learners will now see the updated competencies and assigned courses on their home screen.'
                    )
                },
                error: (error: Error) => {
                    console.error('Failed to save playlist:', error)
                    this.saving = false
                    this.showError('Failed to save playlist. Please try again.')
                }
            })
    }

    /** Shows a success message and takes the user to the summary page */
    private showSuccess(title: string, message: string): void {
        this.dialog.open(SuccessDialogComponent, { data: { title, message } })
            .afterClosed()
            .subscribe(() => this.router.navigate(['/app/home/playlist/summary']))
    }

    /** Shows an error message to the user */
    private showError(message: string): void {
        this.dialog.open(ErrorDialogComponent, { data: { message } })
    }

    /**
     * Automatically saves the playlist after reordering.
     * We only do this if all competencies are complete (to avoid saving incomplete data).
     */
    private autoSaveOrder(): void {
        // Don't auto-save if not all competencies are complete
        if (!this.allCompetenciesComplete) {

            return
        }

        const filters = this.state.getFilters()
        const existingPlaylist = this.state.getExistingCompetencyPlaylist()

        if (!filters) {
            console.error('Auto-save failed: No filters found')
            return
        }

        this.autoSaving = true

        // Build competency payload using CompetencyTransformer
        const authToken = 'system'

        const competencyPayload = this.buildPlaylistPayload(
            this.competencies,
            authToken,
            existingPlaylist || undefined
        )

        this.playlistApi.savePlaylist(
            filters,
            competencyPayload,
            existingPlaylist || undefined,
            PlaylistType.COMPETENCY
        ).subscribe({
            next: () => {
                this.autoSaving = false

                // Optional: Show subtle toast notification
            },
            error: (error: Error) => {
                console.error('Auto-save failed:', error)
                this.autoSaving = false
                this.showError('Failed to save competency order. Please try again.')
            }
        })
    }

    /**
     * Converts our UI data into the format the API expects (V2 format).
     * The new format uses a flat array where each competency has an index field.
     * 
     * Example:
     * [
     *   { index: 0, id: 100, code: "C1", name: "...", levels: [...] },
     *   { index: 1, id: 200, code: "C2", name: "...", levels: [...] }
     * ]
     */
    private buildPlaylistPayload(
        competencies: SelectableCompetency[],
        authToken: string,
        existingPlaylist?: any
    ): any[] {
        const filters = this.state.getFilters()
        if (!filters) {
            console.error('[BuildPayload] No filters available')
            return []
        }

        return competencies.map((comp, arrayIndex) => {
            const competencyCode = comp.code || this.generateCompetencyCode(comp)

            // Build the competency data
            const competencyData = this.buildCompetencyData(
                comp,
                competencyCode,
                authToken,
                existingPlaylist
            )

            // Add index field based on array position (0-based)
            // Array position 0 → index: 0 (shows as card 1)
            // Array position 1 → index: 1 (shows as card 2)
            competencyData.index = arrayIndex

            return competencyData
        })
    }

    /**
     * Generates a stable code for a competency based on its database ID.
     * This way the code stays the same even if we reorder things.
     */
    private generateCompetencyCode(comp: SelectableCompetency): string {
        return `C${comp.id}`
    }

    /**
     * Builds a complete competency object with all the metadata the API needs.
     * This includes timestamps, status, and all the other fields the backend expects.
     */
    private buildCompetencyData(
        comp: SelectableCompetency,
        code: string,
        authToken: string,
        existingPlaylist?: any
    ): any {
        const now = new Date().toISOString()

        const existingCompetency = this.findExistingCompetency(comp.id, existingPlaylist)

        const data: any = {
            id: parseInt(comp.id, 10),
            code: code,
            name: comp.name,
            description: comp.description || '',
            type: comp.type || 'Domain',
            area: 'Management',
            levels: this.buildLevels(comp),

            // Status and metadata
            status: 'UNVERIFIED',
            source: null,
            level: 'INITIATE',
            levelId: 0,
            isActive: true,

            // Audit timestamps - preserve original creation info, update modification info
            createdDate: existingCompetency?.createdDate || now,
            createdBy: existingCompetency?.createdBy || authToken,
            updatedDate: now,
            updatedBy: authToken,

            // Review workflow fields
            reviewedDate: existingCompetency?.reviewedDate || null,
            reviewedBy: existingCompetency?.reviewedBy || null
        }

        return data
    }

    /**
     * Finds a competency in the existing playlist data.
     * We need this to preserve creation dates and other audit info when updating.
     */
    private findExistingCompetency(competencyId: string, existingPlaylist?: any): any {
        if (!existingPlaylist?.dataSource?.payload || !competencyId) return null

        const compId = parseInt(competencyId, 10)
        if (isNaN(compId)) return null

        // V2 format: payload is a flat array of competency objects
        for (const item of existingPlaylist.dataSource.payload) {
            if (item?.id === compId) {
                return item
            }
        }
        return null
    }

    /**
     * Builds the levels array with the assigned courses.
     * In V2 format, we put the courseId directly in each level object.
     */
    private buildLevels(comp: SelectableCompetency): any[] {
        if (!comp.levels || comp.levels.length === 0) {
            return []
        }

        return comp.levels.map((level) => {
            const levelData: any = {
                level: level.level,
                name: level.name || '',
                description: level.description || ''
            }

            // Add courseId directly if assigned
            if (level.courseId) {
                levelData.courseId = level.courseId
            }

            return levelData
        })
    }
}
