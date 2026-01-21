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
 * Competency Order Management
 * 
 * Manages the ordering and course assignment for competency playlists.
 * Key responsibilities:
 * - Reordering competencies via drag-and-drop
 * - Assigning courses to competency levels
 * - Pre-populating existing course assignments when editing
 * - Building and saving playlist payloads with proper metadata
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
     * Pre-populates existing course assignments if editing an existing playlist
     */
    private loadCompetencies(): void {
        const selected = this.state.getSelectedCompetencies()
        if (!selected || selected.length === 0) {
            this.router.navigate(['/app/playlist/select-competencies'])
            return
        }

        // Get existing playlist to pre-populate course assignments
        const existingPlaylist = this.state.getExistingCompetencyPlaylist()

        this.competencies = selected.map((c, index) => {
            const comp: SelectableCompetency = {
                ...c,
                displayOrder: index + 1,
                levels: c.levels || this.getDefaultLevels()
            }

            if (existingPlaylist?.dataSource?.payload) {
                this.restoreSavedCourseAssignments(comp, existingPlaylist.dataSource.payload)
            }

            return comp
        })

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

    /**
     * When editing an existing playlist, pre-fill the course dropdowns
     * with whatever courses were previously assigned to each level.
     */
    private restoreSavedCourseAssignments(competency: SelectableCompetency, playlistPayload: any[]): void {
        if (!playlistPayload || !competency?.id || !competency.levels) return

        const existingComp = playlistPayload.find((item: any) => {
            if (!item) return false
            const key = Object.keys(item)[0]
            return item[key]?.id === parseInt(competency.id, 10)
        })

        if (!existingComp) return

        const key = Object.keys(existingComp)[0]
        const levelDescriptions = existingComp[key]?.additionalProperties?.competencyLevelDescription
        if (!levelDescriptions) return

        const currentLanguage = this.state.getFilters()?.language || 'en'

        competency.levels.forEach(level => {
            const levelDesc = levelDescriptions.find((ld: any) => ld.level === level.level)
            const courseForLang = levelDesc?.course?.find((c: any) => c.lang === currentLanguage)

            if (courseForLang?.id) {
                level.courseId = courseForLang.id
                level.courseName = this.courses.find(c => c.identifier === courseForLang.id)?.name || ''
            }
        })
    }

    /** Handle drag and drop reordering */
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

    /** Update display order after reordering */
    private updateOrderNumbers(): void {
        this.competencies.forEach((c, index) => {
            c.displayOrder = index + 1
        })
    }

    /** Filter competencies by search term */
    onSearch(): void {
        this.filterCompetencies()
    }

    /** Get filtered competencies based on search */
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

    /** Select a competency to edit its levels */
    onSelectCompetency(competency: SelectableCompetency): void {
        this.selectedCompetency = competency
    }

    /** Handle course selection for a level */
    onCourseSelect(level: CompetencyLevel, courseId: string): void {
        if (!level || !courseId) return

        const course = this.courses.find(c => c?.identifier === courseId)
        level.courseId = courseId
        level.courseName = course?.name || ''

        if (this.competencies && this.competencies.length > 0) {
            this.state.setSelectedCompetencies(this.competencies)
        }
    }

    /** Check if current competency has all levels assigned */
    isCurrentCompetencyComplete(): boolean {
        if (!this.selectedCompetency?.levels) return false
        return this.selectedCompetency.levels.every(l => !!l.courseId)
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
        if (!competency) return false
        return competency.coursesAssigned || (competency.levels?.every(l => !!l.courseId) ?? false)
    }

    /** Check if all competencies are complete */
    get allCompetenciesComplete(): boolean {
        if (!this.competencies || this.competencies.length === 0) return false
        return this.competencies.every(c => this.isCompetencyComplete(c))
    }

    /** Navigate back to selection page */
    onBack(): void {
        this.router.navigate(['/app/playlist/select-competencies'])
    }

    /**
     * Save competency playlist
     * Calls playlist API to create or update with competency payload structure
     */
    onSave(): void {
        // if (!this.allCompetenciesComplete) {
        //     this.showError('Please assign courses to all levels for all competencies')
        //     return
        // }

        this.saving = true
        const filters = this.state.getFilters()
        const existingPlaylist = this.state.getExistingCompetencyPlaylist() || undefined

        if (!filters) {
            this.showError('Filter data not found')
            this.saving = false
            return
        }

        // Build competency payload using CompetencyTransformer
        const language = filters.language || 'en'
        const authToken = 'system' // You can get this from auth service if available

        console.log('[ManageCompetencyOrder] Building payload for language:', language)
        console.log('[ManageCompetencyOrder] Number of competencies:', this.competencies.length)

        // Use CompetencyTransformer to build proper payload with all required fields
        const competencyPayload = this.buildPlaylistPayload(
            this.competencies,
            language,
            authToken,
            existingPlaylist
        )

        console.log('[ManageCompetencyOrder] Final payload:', JSON.stringify(competencyPayload, null, 2))

        this.playlistApi.savePlaylist(filters, competencyPayload, existingPlaylist, PlaylistType.COMPETENCY)
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

    /**
     * Auto-save competency order after drag-drop
     * Only saves if all competencies have courses assigned to all levels
     */
    private autoSaveOrder(): void {
        // Don't auto-save if not all competencies are complete
        if (!this.allCompetenciesComplete) {
            console.log('Auto-save skipped: Not all competencies have courses assigned')
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
        const language = filters.language || 'en'
        const authToken = 'system'

        const competencyPayload = this.buildPlaylistPayload(
            this.competencies,
            language,
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
                console.log('Competency order auto-saved successfully')
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
     * Converts our UI competency data into the API format.
     * Includes all the metadata the backend expects (dates, status, etc.)
     * and handles language-specific fields for non-English playlists.
     */
    private buildPlaylistPayload(
        competencies: SelectableCompetency[],
        language: string,
        authToken: string,
        existingPlaylist?: any
    ): any[] {
        const filters = this.state.getFilters()
        if (!filters) {
            console.error('[BuildPayload] No filters available')
            return []
        }

        return competencies.map((comp) => {
            const competencyCode = comp.code || this.generateCompetencyCode(comp)
            const competencyKey = competencyCode.toLowerCase()

            const competencyData = this.buildCompetencyData(
                comp,
                competencyCode,
                language,
                authToken,
                existingPlaylist
            )
            return { [competencyKey]: competencyData }
        })
    }

    /**
     * Generates a competency code using the database ID.
     * This keeps the code stable even when reordering competencies.
     */
    private generateCompetencyCode(comp: SelectableCompetency): string {
        return `C${comp.id}`
    }

    /**
     * Creates a complete competency object with all the fields the API needs.
     */
    private buildCompetencyData(
        comp: SelectableCompetency,
        code: string,
        language: string,
        authToken: string,
        existingPlaylist?: any
    ): any {
        const now = new Date().toISOString()

        const existingCompetency = this.findExistingCompetency(comp.id, existingPlaylist)

        const data: any = {
            id: parseInt(comp.id, 10),
            type: 'Competency',
            name: comp.name,
            description: comp.description || '',
            additionalProperties: {
                Code: code,
                CompentencyType: comp.type || 'Domain',
                CompetencyArea: 'Management',
                competencyLevelDescription: this.buildLevelDescriptions(comp, language)
            },

            // TODO: Future feature - Will support multiple status values (DRAFT, PUBLISHED, ARCHIVED, etc.)
            // For now, all competencies are marked as UNVERIFIED
            status: 'UNVERIFIED',
            source: null,

            // TODO: Future feature - Will support different proficiency levels (BEGINNER, INTERMEDIATE, EXPERT)
            // Currently defaulting to INITIATE for all competencies
            level: 'INITIATE',
            levelId: 0,
            isActive: true,

            // Audit timestamps - preserve original creation info, update modification info
            createdDate: existingCompetency?.createdDate || now,
            createdBy: existingCompetency?.createdBy || authToken,
            updatedDate: now,
            updatedBy: authToken,

            // TODO: Future feature - Will implement review/approval workflow
            // When implemented, managers can review and approve competency playlists
            // reviewedDate will be set when someone approves, reviewedBy will store their username
            reviewedDate: null,
            reviewedBy: null,

            wfId: null,
            children: []
        }

        if (language !== 'en') {
            this.addLanguageFields(data.additionalProperties, comp, language)
        }

        return data
    }

    /**
     * Finds existing competency data from the saved playlist to preserve audit fields.
     */
    private findExistingCompetency(competencyId: string, existingPlaylist?: any): any {
        if (!existingPlaylist?.dataSource?.payload || !competencyId) return null

        const compId = parseInt(competencyId, 10)
        if (isNaN(compId)) return null

        for (const item of existingPlaylist.dataSource.payload) {
            const key = item ? Object.keys(item)[0] : null
            if (key && item[key]?.id === compId) {
                return item[key]
            }
        }
        return null
    }

    /**
     * For non-English playlists, adds the translated name/description.
     * English versions are already in the main name/description fields.
     */
    private addLanguageFields(additionalProps: any, comp: SelectableCompetency, language: string): void {
        if (comp.name) {
            additionalProps[`lang-${language}-name`] = comp.name
        }
        if (comp.description) {
            additionalProps[`lang-${language}-description`] = comp.description
        }
    }

    /**
     * Creates the level array with assigned courses for each level.
     * Course IDs are language-specific (different courses for Hindi vs English).
     */
    private buildLevelDescriptions(comp: SelectableCompetency, language: string): any[] {
        if (!comp.levels || comp.levels.length === 0) {
            return []
        }

        return comp.levels.map((level) => {
            const levelData: any = {
                level: level.level,
                name: level.name || '',
                description: level.description || ''
            }

            if (language !== 'en') {
                if (level.name) {
                    levelData[`lang-${language}-name`] = level.name
                }
                if (level.description) {
                    levelData[`lang-${language}-description`] = level.description
                }
            }

            if (level.courseId) {
                levelData.course = [{
                    lang: language,
                    id: level.courseId
                }]
            }

            return levelData
        })
    }
}
