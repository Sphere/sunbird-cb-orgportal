import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core'
import { Router } from '@angular/router'
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator'
import { SelectionModel } from '@angular/cdk/collections'
import { CompetencyApiService } from '../../services/competency-api.service'
import { PlaylistStateService } from '../../services/playlist-state.service'
import { SelectableCompetency } from '../../models/competency.model'
import { getLevelNumbers } from '../../config/competency.config'

/**
 * Component to handle competency selection.
 * Supports search, pagination, and persistence across navigation.
 */
@Component({
    selector: 'app-select-competencies',
    templateUrl: './select-competencies.component.html',
    styleUrls: ['./select-competencies.component.scss'],
})
export class SelectCompetenciesComponent implements OnInit, AfterViewInit {
    @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator

    selection = new SelectionModel<SelectableCompetency>(true, [])

    allCompetencies: SelectableCompetency[] = []
    searchResultCompetencies: SelectableCompetency[] = []
    filteredCompetencies: SelectableCompetency[] = []
    existingCompetencyIds: string[] = []

    searchTerm = ''
    loading = false
    totalCompetencies = 0
    pageSize = 20
    currentPage = 0
    private paginatorSubscriptionSetup = false

    constructor(
        private router: Router,
        private competencyApi: CompetencyApiService,
        private state: PlaylistStateService
    ) { }

    ngOnInit(): void {
        this.existingCompetencyIds = this.state.getExistingCompetencyIds()
        this.loadCompetencies()
    }

    /**
     * Initializes the paginator subscription after the view is fully rendered.
     * The actual data loading handles the paginator configuration.
     */
    ngAfterViewInit(): void {
        // Initialization handled in loadCompetencies
    }

    /** Sets up paginator event subscription (called once after data loads) */
    private setupPaginatorSubscription(): void {
        if (this.paginatorSubscriptionSetup || !this.paginator) {
            return
        }

        this.paginator.page.subscribe(pageEvent => {
            this.currentPage = pageEvent.pageIndex
            this.pageSize = pageEvent.pageSize
            this.applyPagination()
        })

        this.paginatorSubscriptionSetup = true
    }

    /** Loads competency list and restores state */
    private loadCompetencies(): void {
        const filters = this.state.getFilters()
        if (!filters) {
            this.router.navigate(['/app/home/playlist/filters'])
            return
        }

        this.loading = true
        const language = filters.language || 'en'

        const cached = this.state.getCachedCompetencies(language)
        if (cached) {
            this.processCompetencies(cached)
            this.finalizeLoading()
            return
        }

        this.competencyApi.getCompetencyListByLanguage(language).subscribe({
            next: (data) => {
                this.state.setCachedCompetencies(data, language)
                this.processCompetencies(data)
                this.finalizeLoading()
            },
            error: (err) => {
                console.error('Error loading competencies:', err)
                this.loading = false
            }
        })
    }

    /** Maps raw competencies to selectable objects (resets UI state) */
    private processCompetencies(data: any[]): void {
        this.allCompetencies = data.map((c, index) => {
            const id = String(c.id)
            const isPreselected = this.existingCompetencyIds.includes(id)

            return {
                ...c,
                id,
                selected: isPreselected,
                isPreselected,
                displayOrder: index + 1,
                coursesAssigned: false,
                levels: c.children && c.children.length > 0
                    ? c.children.map((child: any) => ({
                        level: child.levelId || child.level,
                        name: child.name,
                        description: child.description,
                        courseId: undefined,
                        courseName: undefined
                    }))
                    : getLevelNumbers().map(level => ({ level }))
            } as SelectableCompetency
        })
    }

    /**
     * Finalizes the internal state once data is loaded (either from cache or API).
     * This prepares the search results, applies initial sorting, and sets up pagination.
     */
    private finalizeLoading(): void {
        this.applyPreselectionAndSort()
        this.searchResultCompetencies = [...this.allCompetencies]
        this.totalCompetencies = this.searchResultCompetencies.length
        this.applyPagination()

        // Configure the paginator UI component once data is ready
        setTimeout(() => {
            if (this.paginator) {
                this.paginator.length = this.totalCompetencies
                this.paginator.pageSize = this.pageSize
                this.paginator.pageIndex = 0
                this.setupPaginatorSubscription()
            }
        }, 0)

        this.loading = false
    }

    /** Handles pagination */
    private applyPagination(): void {
        const start = this.currentPage * this.pageSize
        const end = start + this.pageSize
        this.filteredCompetencies = this.searchResultCompetencies.slice(start, end)
    }

    /** Sorts competencies with preselected items first (matching select-courses logic) */
    private applyPreselectionAndSort(): void {
        this.selection.clear()

        // Check if we have saved selections from a previous visit
        const savedSelections = this.state.getSelectedCompetencies()

        if (savedSelections && savedSelections.length > 0) {
            // Restore user's previous selections
            const savedIds = savedSelections.map(c => c.id)

            const selected = this.allCompetencies.filter(c => savedIds.includes(c.id))
            const unselected = this.allCompetencies.filter(c => !savedIds.includes(c.id))

            // Sort selected competencies by their saved order
            selected.sort((a, b) => {
                const indexA = savedIds.indexOf(a.id)
                const indexB = savedIds.indexOf(b.id)
                return (indexA === -1 ? 9999 : indexA) - (indexB === -1 ? 9999 : indexB)
            })

            this.allCompetencies = [...selected, ...unselected]

            // Restore selections to the SelectionModel
            selected.forEach(competency => {
                this.selection.select(competency)
            })
        } else {
            // No saved selections - use existing playlist competencies (preselected from DB)
            const preselected = this.allCompetencies.filter(c => c.isPreselected)
            const others = this.allCompetencies.filter(c => !c.isPreselected)

            // Sort preselected by their original order from state
            preselected.sort((a, b) => {
                const indexA = this.existingCompetencyIds.indexOf(a.id)
                const indexB = this.existingCompetencyIds.indexOf(b.id)
                return (indexA === -1 ? 9999 : indexA) - (indexB === -1 ? 9999 : indexB)
            })

            this.allCompetencies = [...preselected, ...others]

            // Auto-select preselected competencies
            preselected.forEach(competency => {
                this.selection.select(competency)
            })
        }
    }

    /** Filters competencies based on name or code */
    onSearch(): void {
        this.currentPage = 0

        if (this.searchTerm.trim() === '') {
            this.searchResultCompetencies = [...this.allCompetencies]
        } else {
            const term = this.searchTerm.toLowerCase()
            this.searchResultCompetencies = this.allCompetencies.filter(c =>
                c.name?.toLowerCase().includes(term) ||
                c.code?.toLowerCase().includes(term)
            )
        }

        this.sortBySelection()
        this.totalCompetencies = this.searchResultCompetencies.length
        this.applyPagination()

        setTimeout(() => {
            if (this.paginator) {
                this.paginator.pageIndex = 0
                this.paginator.length = this.totalCompetencies
            }
        }, 0)
    }

    /** Syncs checkbox state and re-sorts list */
    onSelectionChange(row: SelectableCompetency, event: any): void {
        if (event.target.checked) {
            this.selection.select(row)
        } else {
            this.selection.deselect(row)
        }

        this.sortBySelection()
        this.currentPage = 0
        this.applyPagination()

        setTimeout(() => {
            if (this.paginator) {
                this.paginator.pageIndex = 0
            }
        }, 0)
    }

    /** Sorts list: preselected/active first, then others */
    private sortBySelection(): void {
        const defaultPreselected: SelectableCompetency[] = []
        const userSelected: SelectableCompetency[] = []
        const unselected: SelectableCompetency[] = []

        this.searchResultCompetencies.forEach(competency => {
            const isSelected = this.selection.isSelected(competency)

            if (competency.isPreselected) {
                defaultPreselected.push(competency)
            } else if (isSelected) {
                userSelected.push(competency)
            } else {
                unselected.push(competency)
            }
        })

        this.searchResultCompetencies = [
            ...defaultPreselected,
            ...userSelected,
            ...unselected
        ]
    }

    /** Returns true if at least one competency is selected */
    get hasSelection(): boolean {
        return this.selection.selected.length > 0
    }

    /**
     * Returns the user to the playlist summary dashboard.
     */
    onBack(): void {
        this.router.navigate(['/app/home/playlist/summary'])
    }

    /**
     * Saves the current selections to the global state and navigates to the management page.
     * This is the bridge between selecting competencies and assigning courses to them.
     */
    onAssignCourses(): void {
        this.state.setSelectedCompetencies(this.selection.selected)
        this.router.navigate(['/app/playlist/manage-competency-order'])
    }
}
