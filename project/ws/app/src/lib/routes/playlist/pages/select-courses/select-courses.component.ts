import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core'
import { Router } from '@angular/router'
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator'
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table'
import { SelectionModel } from '@angular/cdk/collections'
import { CourseApiService } from '../../services/course-api.service'
import { PlaylistStateService } from '../../services/playlist-state.service'
import { Course, SelectableCourse } from '../../models/course.model'

/**
 * Select Courses Component
 * 
 * Displays course table with:
 * - Checkbox selection
 * - Preselection for existing playlist courses
 * - Selected courses moved to top
 * - Search by name/source
 * - Pagination (20 per page)
 */
@Component({
    selector: 'app-select-courses',
    templateUrl: './select-courses.component.html',
    styleUrls: ['./select-courses.component.scss'],
})
export class SelectCoursesComponent implements OnInit, AfterViewInit {
    @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator

    displayedColumns: string[] = ['select', 'name', 'source']
    dataSource = new MatTableDataSource<SelectableCourse>([])
    selection = new SelectionModel<SelectableCourse>(true, [])

    allCourses: SelectableCourse[] = []
    filteredCourses: SelectableCourse[] = [] // New array for view rendering
    existingCourseIds: string[] = []
    searchTerm = ''
    loading = false
    totalCourses = 0
    pageSize = 20
    currentPage = 0

    constructor(
        private router: Router,
        private courseApi: CourseApiService,
        private state: PlaylistStateService
    ) { }

    ngOnInit(): void {
        this.loadExistingPlaylist()
        this.loadCourses()
    }

    /**
     * Setup paginator after view initialization
     * IMPORTANT: Only setup event listener here, don't configure values yet!
     * Values will be set after first data load completes.
     */
    ngAfterViewInit(): void {
        if (this.paginator) {
            console.log('🔧 Setting up paginator event listener')

            // Listen to page changes (only setup listener, don't configure values yet)
            this.paginator.page.subscribe(pageEvent => {
                console.log('📄 Page EVENT FIRED - Index:', pageEvent.pageIndex, 'Size:', pageEvent.pageSize)

                this.currentPage = pageEvent.pageIndex
                this.pageSize = pageEvent.pageSize

                // Load new page of data from server
                this.loadCourses()
            })
        }
    }

    /**
     * Load existing playlist course IDs from state
     */
    private loadExistingPlaylist(): void {
        this.existingCourseIds = this.state.getExistingCourseIds()
    }

    /**
     * Load courses from API with pagination
     */
    private async loadCourses(): Promise<void> {
        const filters = this.state.getFilters()
        if (!filters) {
            this.router.navigate(['/app/home/playlist/filters'])
            return
        }

        this.loading = true

        try {
            console.log('📚 Loading courses - Page:', this.currentPage, 'Offset:', this.currentPage * this.pageSize)

            const result = await this.courseApi
                .searchCourses(filters.language, this.pageSize, this.currentPage * this.pageSize)
                .toPromise()

            if (result) {
                this.totalCourses = result.totalCount

                console.log('📚 Courses loaded:', result.courses.length, 'Total:', result.totalCount)

                // Convert courses to selectable courses
                const selectableCourses = result.courses.map(course => this.toSelectableCourse(course))

                // Replace courses for current page
                this.allCourses = selectableCourses

                // Initialize filteredCourses for view
                this.filteredCourses = [...this.allCourses]

                // Apply preselection and sorting
                this.applyPreselectionAndSort()

                // Set data source (legacy support if needed)
                this.dataSource.data = this.allCourses

                // Config paginator
                if (this.paginator) {
                    this.paginator.length = this.totalCourses
                    this.paginator.pageSize = this.pageSize
                    this.paginator.pageIndex = this.currentPage
                }
            }
        } catch (error) {
            console.error('❌ Error loading courses:', error)
        } finally {
            this.loading = false
        }
    }

    /**
     * Convert Course to SelectableCourse
     * Mark as preselected if in existing playlist
     */
    private toSelectableCourse(course: Course): SelectableCourse {
        const isPreselected = this.existingCourseIds.includes(course.identifier)

        // Debug logging
        if (isPreselected) {
            console.log('✅ PRESELECTED:', course.name, 'ID:', course.identifier)
        }

        return {
            ...course,
            selected: isPreselected,  // Auto-select if preselected
            isPreselected,
        }
    }

    /**
     * Apply preselection and sort by playlist order
     * Preselected courses appear first in the EXACT sequence from playlist
     */
    private applyPreselectionAndSort(): void {
        // Separate preselected and non-preselected courses
        const preselected = this.allCourses.filter(c => c.isPreselected)
        const notPreselected = this.allCourses.filter(c => !c.isPreselected)

        console.log('🔍 Existing Course IDs from state:', this.existingCourseIds)
        console.log('🔍 Preselected courses found:', preselected.length, preselected.map(c => c.name))
        console.log('🔍 Total courses loaded:', this.allCourses.length)

        // Sort preselected courses by their playlist order
        // Use existingCourseIds array as the reference order
        preselected.sort((a, b) => {
            const indexA = this.existingCourseIds.indexOf(a.identifier)
            const indexB = this.existingCourseIds.indexOf(b.identifier)
            // If not found, put at end (-1 becomes larger than valid indices)
            return (indexA === -1 ? 9999 : indexA) - (indexB === -1 ? 9999 : indexB)
        })

        console.log('📊 Sorted preselected courses:', preselected.map(c => ({
            name: c.name,
            id: c.identifier,
            playlistOrder: this.existingCourseIds.indexOf(c.identifier)
        })))

        // Combine with preselected first (in playlist order)
        this.allCourses = [...preselected, ...notPreselected]

        // Update filtered list as well
        this.filteredCourses = [...this.allCourses]

        // Auto-select preselected courses
        preselected.forEach(course => {
            this.selection.select(course)
        })

        console.log('✅ Auto-selected courses in playlist order:', this.selection.selected.length)
    }

    /**
     * Handle search input
     */
    onSearch(): void {
        if (this.searchTerm.trim() === '') {
            this.filteredCourses = [...this.allCourses]
        } else {
            const filtered = this.courseApi.filterCourses(this.allCourses, this.searchTerm)
            this.filteredCourses = filtered
        }
        this.dataSource.data = this.filteredCourses
    }

    /**
     * Check if all rows are selected
     */
    isAllSelected(): boolean {
        const numSelected = this.selection.selected.length
        const numRows = this.dataSource.data.length
        return numSelected === numRows
    }

    /**
     * Toggle all selections
     */
    masterToggle(): void {
        if (this.isAllSelected()) {
            this.selection.clear()
        } else {
            this.dataSource.data.forEach(row => this.selection.select(row))
        }
    }

    /**
     * Get checkbox label
     */
    checkboxLabel(row?: SelectableCourse): string {
        if (!row) {
            return `${this.isAllSelected() ? 'deselect' : 'select'} all`
        }
        return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row`
    }

    /**
     * Navigate back
     */
    onBack(): void {
        this.router.navigate(['/app/home/playlist/summary'])
    }

    /**
     * Navigate to manage order page
     */
    onNext(): void {
        // Save selected courses to state
        this.state.setSelectedCourses(this.selection.selected)

        // Navigate to manage order
        this.router.navigate(['/app/playlist/manage-order'])
    }

    /**
     * Check if Next button should be enabled
     */
    isNextEnabled(): boolean {
        return this.selection.selected.length > 0
    }
}
