import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, ViewChild, AfterViewInit } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { CommonModule } from '@angular/common'
import { Router } from '@angular/router'
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator'
import { MatTableDataSource } from '@angular/material/table'
import { SelectionModel } from '@angular/cdk/collections'
import { CourseApiService } from '../../services/course-api.service'
import { PlaylistStateService } from '../../services/playlist-state.service'
import { Course, SelectableCourse } from '../../models/course.model'

/**
 * Component for browsing and selecting courses for a playlist.
 * Handles existing selection restoration, client-side search, and managed pagination.
 */
@Component({
    selector: 'app-select-courses',
    templateUrl: './select-courses.component.html',
    styleUrls: ['./select-courses.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, MatPaginatorModule],
})
export class SelectCoursesComponent implements OnInit, AfterViewInit {
    @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator

    displayedColumns: string[] = ['select', 'name', 'source']
    dataSource = new MatTableDataSource<SelectableCourse>([])
    selection = new SelectionModel<SelectableCourse>(true, [])

    allCourses: SelectableCourse[] = []
    searchResultCourses: SelectableCourse[] = []
    filteredCourses: SelectableCourse[] = []
    existingCourseIds: string[] = []
    totalCourses = 0
    pageSize = 20
    currentPage = 0
    private paginatorSubscriptionSetup = false

    readonly loading = signal(false)
    readonly searchTerm = signal('')
    private readonly destroyRef = inject(DestroyRef)

    constructor(
        private router: Router,
        private courseApi: CourseApiService,
        private state: PlaylistStateService
    ) { }

    /**
     * Component initialization.
     * Loads the existing playlist context and triggers the master course list fetch.
     */
    ngOnInit(): void {
        this.loadExistingPlaylist()
        this.loadCourses()
    }

    ngAfterViewInit(): void {
        // Paginator subscription is set up in loadCourses() after data loads
    }

    /** Sets up paginator event subscription (called once after data loads) */
    private setupPaginatorSubscription(): void {
        if (this.paginatorSubscriptionSetup) {
            return
        }

        this.paginator.page.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(pageEvent => {
            this.currentPage = pageEvent.pageIndex
            this.pageSize = pageEvent.pageSize
            this.applyPagination()
        })

        this.paginatorSubscriptionSetup = true
    }

    /** Loads existing playlist course IDs from state */
    private loadExistingPlaylist(): void {
        this.existingCourseIds = this.state.getExistingCourseIds()
    }

    /** Loads all courses from cache or API */
    private async loadCourses(): Promise<void> {
        const filters = this.state.getFilters()
        if (!filters) {
            this.router.navigate(['/app/home/playlist/filters'])
            return
        }

        this.loading.set(true)

        try {
            const cached = this.state.getCachedCourses(filters.language)
            let rawCourses: Course[]

            if (cached) {
                rawCourses = cached
            } else {
                rawCourses = await this.courseApi.loadAllCourses(filters.language)
                this.state.setCachedCourses(rawCourses, filters.language)
            }

            const courses = rawCourses.map(course => this.toSelectableCourse(course))

            this.allCourses = courses
            this.totalCourses = courses.length

            this.applyPreselectionAndSort()
            this.searchResultCourses = [...this.allCourses]
            this.totalCourses = this.searchResultCourses.length
            this.applyPagination()

            // Configure paginator after view is ready
            setTimeout(() => {
                if (this.paginator) {
                    this.paginator.length = this.totalCourses
                    this.paginator.pageSize = this.pageSize
                    this.paginator.pageIndex = 0
                    this.setupPaginatorSubscription()
                }
            }, 0)
        } catch (error) {
            console.error('Error loading courses:', error)
        } finally {
            this.loading.set(false)
        }
    }

    /**
     * Applies pagination to the current search results.
     * Updates the data source to reflect only the courses visible on the current page.
     */
    private applyPagination(): void {
        const start = this.currentPage * this.pageSize
        const end = start + this.pageSize

        this.filteredCourses = this.searchResultCourses.slice(start, end)
        this.dataSource.data = this.filteredCourses
    }

    /**
     * Transforms a raw Course object into a SelectableCourse.
     * Checks against the existing playlist to mark items as pre-selected.
     */
    private toSelectableCourse(course: Course): SelectableCourse {
        const isPreselected = this.existingCourseIds.includes(course.identifier)

        return {
            ...course,
            selected: isPreselected,
            isPreselected,
        }
    }

    /** Sorts courses with preselected items first (in playlist order) */
    private applyPreselectionAndSort(): void {
        // Check if we have saved selections from a previous visit (e.g., coming back from manage-order)
        const savedSelections = this.state.getSelectedCourses()

        if (savedSelections && savedSelections.length > 0) {
            // Restore user's previous selections
            const savedIds = savedSelections.map(c => c.identifier)

            const preselected = this.allCourses.filter(c => savedIds.includes(c.identifier))
            const notPreselected = this.allCourses.filter(c => !savedIds.includes(c.identifier))

            // Sort preselected courses by their saved order
            preselected.sort((a, b) => {
                const indexA = savedIds.indexOf(a.identifier)
                const indexB = savedIds.indexOf(b.identifier)
                return indexA - indexB
            })

            this.allCourses = [...preselected, ...notPreselected]

            // Restore selections
            preselected.forEach(course => {
                this.selection.select(course)
            })
        } else {
            // No saved selections - use existing playlist courses
            const preselected = this.allCourses.filter(c => c.isPreselected)
            const notPreselected = this.allCourses.filter(c => !c.isPreselected)

            // Sort preselected courses by their original playlist order
            preselected.sort((a, b) => {
                const indexA = this.existingCourseIds.indexOf(a.identifier)
                const indexB = this.existingCourseIds.indexOf(b.identifier)
                return (indexA === -1 ? 9999 : indexA) - (indexB === -1 ? 9999 : indexB)
            })

            this.allCourses = [...preselected, ...notPreselected]

            // Auto-select preselected courses
            preselected.forEach(course => {
                this.selection.select(course)
            })
        }
    }

    /** Handles search input with client-side filtering */
    onSearch(): void {
        this.currentPage = 0

        if (this.searchTerm().trim() === '') {
            // Search cleared - restore all courses
            this.searchResultCourses = [...this.allCourses]
        } else {
            // Filter courses based on search term
            this.searchResultCourses = this.courseApi.filterCourses(this.allCourses, this.searchTerm())
        }

        // Apply sorting to keep selected courses at top
        this.sortBySelection()

        this.totalCourses = this.searchResultCourses.length
        this.applyPagination()

        setTimeout(() => {
            if (this.paginator) {
                this.paginator.pageIndex = 0
                this.paginator.length = this.totalCourses
            }
        }, 0)
    }

    /**
     * Handles course selection/deselection
     * Dynamically re-sorts to show all selected courses at the top
     */
    onSelectionChange(row: SelectableCourse, event: any): void {
        // Toggle selection
        if (event.target.checked) {
            this.selection.select(row)
        } else {
            this.selection.deselect(row)
        }

        // Re-sort: Selected courses first, then unselected
        this.sortBySelection()

        // Reset to page 1 to show newly selected courses
        this.currentPage = 0
        this.applyPagination()

        setTimeout(() => {
            if (this.paginator) {
                this.paginator.pageIndex = 0
            }
        }, 0)
    }

    /**
     * Sorts the course list to maintain a logical hierarchy:
     * 1. Mandatory/Existing courses from the database.
     * 2. New selections made during the current session.
     * 3. All other available courses.
     */
    private sortBySelection(): void {
        const defaultPreselected: SelectableCourse[] = []
        const userSelected: SelectableCourse[] = []
        const unselected: SelectableCourse[] = []

        this.searchResultCourses.forEach(course => {
            const isSelected = this.selection.isSelected(course)

            if (course.isPreselected) {
                defaultPreselected.push(course)
            } else if (isSelected) {
                userSelected.push(course)
            } else {
                unselected.push(course)
            }
        })

        // Maintain original order within each group
        this.searchResultCourses = [
            ...defaultPreselected,
            ...userSelected,
            ...unselected
        ]
    }

    /**
     * Checks if every course on the current page is currently selected.
     * Used to drive the state of the master "select all" checkbox.
     */
    isAllSelected(): boolean {
        const numSelected = this.selection.selected.length
        const numRows = this.dataSource.data.length
        return numSelected === numRows
    }

    /**
     * Selects or deselects all courses on the current page in a single action.
     */
    masterToggle(): void {
        if (this.isAllSelected()) {
            this.selection.clear()
        } else {
            this.dataSource.data.forEach(row => this.selection.select(row))
        }
    }

    /** Returns accessibility label for checkbox */
    checkboxLabel(row?: SelectableCourse): string {
        if (!row) {
            return `${this.isAllSelected() ? 'deselect' : 'select'} all`
        }
        return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row`
    }

    /** Navigates back to playlist summary */
    onBack(): void {
        this.router.navigate(['/app/home/playlist/summary'])
    }

    /**
     * Finalizes selections and proceeds to the course ordering screen.
     */
    onNext(): void {
        this.state.setSelectedCourses(this.selection.selected)
        this.router.navigate(['/app/playlist/manage-order'])
    }

    onTabClick(_tab: string): void {
        // Tab click handler (for future use)
    }

    isNextEnabled(): boolean {
        return this.selection.selected.length > 0
    }
}
