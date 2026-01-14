import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core'
import { Router } from '@angular/router'
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator'
import { SelectionModel } from '@angular/cdk/collections'
import { CompetencyApiService } from '../../services/competency-api.service'
import { PlaylistStateService } from '../../services/playlist-state.service'
import { SelectableCompetency } from '../../models/competency.model'

/**
 * Competency selection component for playlist creation/editing.
 * Features: checkbox selection, preselection, search, and pagination.
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

    ngAfterViewInit(): void {
        // Paginator subscription is set up in loadCompetencies() after data loads
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

    /** Loads competencies from API and preselects existing ones */
    private loadCompetencies(): void {
        this.loading = true
        this.competencyApi.getAllCompetencies().subscribe({
            next: (data) => {
                this.allCompetencies = data.map((c, index) => {
                    const isPreselected = this.existingCompetencyIds.includes(c.id)

                    return {
                        ...c,
                        selected: isPreselected,
                        isPreselected,
                        displayOrder: index + 1,
                        coursesAssigned: false,
                        levels: c.levels && c.levels.length > 0
                            ? c.levels.map(l => ({ ...l, courseId: undefined, courseName: undefined }))
                            : [
                                { level: 1 },
                                { level: 2 },
                                { level: 3 },
                                { level: 4 },
                                { level: 5 }
                            ]
                    } as SelectableCompetency
                })

                this.totalCompetencies = this.allCompetencies.length
                this.applyPreselectionAndSort()
                this.searchResultCompetencies = [...this.allCompetencies]
                this.totalCompetencies = this.searchResultCompetencies.length
                this.applyPagination()

                // Configure paginator after view is ready
                setTimeout(() => {
                    if (this.paginator) {
                        this.paginator.length = this.totalCompetencies
                        this.paginator.pageSize = this.pageSize
                        this.paginator.pageIndex = 0
                        this.setupPaginatorSubscription()
                    }
                }, 0)

                this.loading = false
            },
            error: (err) => {
                console.error('Failed to load competencies:', err)
                this.loading = false
            }
        })
    }

    /** Applies client-side pagination to search results */
    private applyPagination(): void {
        const start = this.currentPage * this.pageSize
        const end = start + this.pageSize
        this.filteredCompetencies = this.searchResultCompetencies.slice(start, end)
    }

    /** Sorts competencies with preselected items first */
    private applyPreselectionAndSort(): void {
        const preselected = this.allCompetencies.filter(c => c.isPreselected)
        const notPreselected = this.allCompetencies.filter(c => !c.isPreselected)

        // Sort preselected by their original order
        preselected.sort((a, b) => {
            const indexA = this.existingCompetencyIds.indexOf(a.id)
            const indexB = this.existingCompetencyIds.indexOf(b.id)
            return (indexA === -1 ? 9999 : indexA) - (indexB === -1 ? 9999 : indexB)
        })

        this.allCompetencies = [...preselected, ...notPreselected]

        // Auto-select preselected competencies
        preselected.forEach(competency => {
            this.selection.select(competency)
        })
    }

    /** Handles search input with client-side filtering */
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

    /** Handles competency selection/deselection */
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

    /** Sort competencies: preselected first, then user-selected, then unselected */
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

    onBack(): void {
        this.router.navigate(['/app/home/playlist/summary'])
    }

    onAssignCourses(): void {
        this.state.setSelectedCompetencies(this.selection.selected)
        this.router.navigate(['/app/playlist/manage-competency-order'])
    }
}
