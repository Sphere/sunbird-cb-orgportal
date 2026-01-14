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

/**
 * Manage Competency Order Component
 * Allows users to reorder competencies and assign courses to each level
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

    constructor(
        private router: Router,
        private dialog: MatDialog,
        private state: PlaylistStateService,
        private playlistApi: PlaylistApiService,
        private courseApi: CourseApiService
    ) { }

    ngOnInit(): void {
        this.loadCompetencies()
        this.loadCourses()
    }

    /**
     * Load selected competencies from state
     * Redirects to selection page if none selected
     */
    private loadCompetencies(): void {
        const selected = this.state.getSelectedCompetencies()
        if (!selected || selected.length === 0) {
            this.router.navigate(['/app/playlist/select-competencies'])
            return
        }

        this.competencies = selected.map((c, index) => ({
            ...c,
            displayOrder: index + 1,
            levels: c.levels || this.getDefaultLevels()
        }))
        this.filteredCompetencies = [...this.competencies]

        if (this.competencies.length > 0) {
            this.selectedCompetency = this.competencies[0]
        }
    }

    /** Returns default 5 levels structure */
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
     * Load courses for dropdown selection
     * Falls back to 'en' if filters not available
     */
    private async loadCourses(): Promise<void> {
        const filters = this.state.getFilters()
        const language = filters?.language || 'en'

        this.loadingCourses = true

        try {
            const cached = this.state.getCachedCourses(language)
            if (cached && cached.length > 0) {
                this.courses = cached
                this.loadingCourses = false
                return
            }

            const response = await this.courseApi.searchCourses(language, 500, 0).toPromise()
            this.courses = response?.courses || []

            if (this.courses.length > 0) {
                this.state.setCachedCourses(this.courses, language)
            }
        } catch (error) {
            console.error('Failed to load courses:', error)
        } finally {
            this.loadingCourses = false
        }
    }

    /** Handle drag and drop reordering */
    onDrop(event: CdkDragDrop<SelectableCompetency[]>): void {
        moveItemInArray(this.competencies, event.previousIndex, event.currentIndex)
        this.updateOrderNumbers()
        this.filteredCompetencies = this.searchTerm ? this.filteredCompetencies : [...this.competencies]
    }

    /** Update display order after reordering */
    private updateOrderNumbers(): void {
        this.competencies.forEach((c, index) => {
            c.displayOrder = index + 1
        })
    }

    /** Filter competencies by search term */
    onSearch(): void {
        if (!this.searchTerm.trim()) {
            this.filteredCompetencies = [...this.competencies]
            return
        }
        const term = this.searchTerm.toLowerCase()
        this.filteredCompetencies = this.competencies.filter(c =>
            c.name?.toLowerCase().includes(term) ||
            c.code?.toLowerCase().includes(term)
        )
    }

    /** Select a competency to edit its levels */
    onSelectCompetency(competency: SelectableCompetency): void {
        this.selectedCompetency = competency
    }

    /** Handle course selection for a level */
    onCourseSelect(level: CompetencyLevel, courseId: string): void {
        if (!this.selectedCompetency) return

        const course = this.courses.find(c => c.identifier === courseId)
        level.courseId = courseId
        level.courseName = course?.name || ''
    }

    /** Check if current competency has all levels assigned */
    isCurrentCompetencyComplete(): boolean {
        if (!this.selectedCompetency) return false
        return this.selectedCompetency.levels?.every(l => l.courseId) || false
    }

    /**
     * Mark current competency as complete
     * Moves to next incomplete competency
     */
    onAssignCourses(): void {
        if (!this.selectedCompetency || !this.isCurrentCompetencyComplete()) return

        this.selectedCompetency.coursesAssigned = true

        const nextIncomplete = this.competencies.find(c => !this.isCompetencyComplete(c))
        if (nextIncomplete) {
            this.selectedCompetency = nextIncomplete
        }
    }

    /** Check if a competency has all levels assigned */
    isCompetencyComplete(competency: SelectableCompetency): boolean {
        return competency.coursesAssigned || (competency.levels?.every(l => l.courseId) || false)
    }

    /** Check if all competencies are complete */
    get allCompetenciesComplete(): boolean {
        return this.competencies.every(c => this.isCompetencyComplete(c))
    }

    /** Navigate back to selection page */
    onBack(): void {
        this.router.navigate(['/app/playlist/select-competencies'])
    }

    /**
     * Save competency playlist
     * Calls playlist API to create or update
     */
    onSave(): void {
        if (!this.allCompetenciesComplete) {
            this.showError('Please assign courses to all levels for all competencies')
            return
        }

        this.saving = true
        const filters = this.state.getFilters()
        const existingPlaylist = this.state.getExistingCompetencyPlaylist() || undefined

        // Build competency IDs array for the API
        const competencyIds = this.competencies.map(c => c.id)

        if (!filters) {
            this.showError('Filter data not found')
            this.saving = false
            return
        }

        this.playlistApi.savePlaylist(filters, competencyIds, existingPlaylist, PlaylistType.COMPETENCY)
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

    /** Show success dialog and navigate to summary */
    private showSuccess(title: string, message: string): void {
        this.dialog.open(SuccessDialogComponent, { data: { title, message } })
            .afterClosed()
            .subscribe(() => this.router.navigate(['/app/home/playlist/summary']))
    }

    /** Show error dialog */
    private showError(message: string): void {
        this.dialog.open(ErrorDialogComponent, { data: { message } })
    }
}
