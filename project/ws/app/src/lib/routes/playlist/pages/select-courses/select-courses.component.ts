import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router } from '@angular/router'
import { MatIconModule } from '@angular/material/icon'
import { SelectionModel } from '@angular/cdk/collections'
import { CourseApiService } from '../../services/course-api.service'
import { PlaylistStateService } from '../../services/playlist-state.service'
import { Course, SelectableCourse } from '../../models/course.model'
import { PLAYLIST_ROUTES, PLAYLIST_UI } from '../../constants/playlist.constants'
import { log } from '../../utils/playlist-logger.utils'

@Component({
    selector: 'app-select-courses',
    templateUrl: './select-courses.component.html',
    styleUrls: ['./select-courses.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, MatIconModule],
})
export class SelectCoursesComponent implements OnInit {
    selection = new SelectionModel<SelectableCourse>(true, [])

    readonly allCourses = signal<SelectableCourse[]>([])
    readonly searchResultCourses = signal<SelectableCourse[]>([])
    readonly filteredCourses = signal<SelectableCourse[]>([])
    readonly existingCourseIds = signal<string[]>([])
    readonly shimmerRows = Array(PLAYLIST_UI.SHIMMER_ROWS).fill(0)

    readonly loading = signal(false)
    readonly searchTerm = signal('')
    private preselectedCourseOrderMap = new Map<string, number>()

    private readonly router = inject(Router)
    private readonly courseApi = inject(CourseApiService)
    private readonly state = inject(PlaylistStateService)

    ngOnInit(): void {
        this.existingCourseIds.set(this.state.getExistingCourseIds())
        this.buildPreselectedCourseOrderMap()
        this.loadCourses()
    }

    /** Builds payload-order map for existing playlist courses (index 0,1,2...) */
    private buildPreselectedCourseOrderMap(): void {
        this.preselectedCourseOrderMap.clear()
        const existingPlaylist = this.state.getExistingPlaylist()
        const payload = existingPlaylist?.dataSource?.payload
        if (!Array.isArray(payload)) {
            return
        }

        payload.forEach((item, index) => {
            if (typeof item === 'string' && item.trim()) {
                this.preselectedCourseOrderMap.set(item.trim(), index)
            }
        })
    }

    private async loadCourses(): Promise<void> {
        const filters = this.state.getFilters()
        if (!filters) {
            this.router.navigate([PLAYLIST_ROUTES.HOME_FILTERS])
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
            courses.sort((a, b) => this.compareCourses(a, b))
            this.allCourses.set(courses)
            this.applyPreselectionAndSort()
            this.resortAndRefresh()
        } catch (error) {
            log.error('Error loading courses:', error)
        } finally {
            this.loading.set(false)
        }
    }

    private toSelectableCourse(course: Course): SelectableCourse {
        const isPreselected = this.existingCourseIds().includes(course.identifier)
        return { ...course, selected: isPreselected, isPreselected }
    }

    /** Restores saved selections; list order is set before calling this */
    private applyPreselectionAndSort(): void {
        this.selection.clear()
        const savedSelections = this.state.getSelectedCourses()
        let selectedCount = 0

        if (savedSelections && savedSelections.length > 0) {
            const savedIds = savedSelections.map(c => c.identifier)
            this.allCourses()
                .filter(c => savedIds.includes(c.identifier))
                .forEach(c => {
                    this.selection.select(c)
                    selectedCount += 1
                })
        }

        if (selectedCount === 0) {
            this.allCourses().filter(c => c.isPreselected).forEach(c => this.selection.select(c))
        }
    }

    /** Re-sorts list based on selection priority and refreshes visible rows */
    private resortAndRefresh(): void {
        const sorted = [...this.allCourses()].sort((a, b) => this.compareCourses(a, b))
        this.allCourses.set(sorted)
        this.onSearch()
    }

    /** Priority: preselected first, then selected, then remaining; then name/source */
    private compareCourses(a: SelectableCourse, b: SelectableCourse): number {
        const rank = (item: SelectableCourse): number => {
            if (item.isPreselected) return 0
            if (this.selection.isSelected(item)) return 1
            return 2
        }

        const rankA = rank(a)
        const rankB = rank(b)
        if (rankA !== rankB) {
            return rankA - rankB
        }

        // Within preselected group, respect playlist payload order.
        if (rankA === 0 && rankB === 0) {
            const orderA = this.preselectedCourseOrderMap.get(String(a.identifier || '').trim()) ?? Number.MAX_SAFE_INTEGER
            const orderB = this.preselectedCourseOrderMap.get(String(b.identifier || '').trim()) ?? Number.MAX_SAFE_INTEGER
            if (orderA !== orderB) {
                return orderA - orderB
            }
        }

        const nameA = (a?.name || '').trim()
        const nameB = (b?.name || '').trim()
        const nameSort = nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' })
        if (nameSort !== 0) {
            return nameSort
        }

        const sourceA = (a?.sourceName || '').trim()
        const sourceB = (b?.sourceName || '').trim()
        return sourceA.localeCompare(sourceB, undefined, { numeric: true, sensitivity: 'base' })
    }

    onSearch(): void {
        if (this.searchTerm().trim() === '') {
            this.searchResultCourses.set([...this.allCourses()])
        } else {
            this.searchResultCourses.set(this.courseApi.filterCourses(this.allCourses(), this.searchTerm()))
        }
        this.filteredCourses.set([...this.searchResultCourses()])
    }

    onSelectionChange(row: SelectableCourse, event: Event): void {
        if ((event.target as HTMLInputElement).checked) {
            this.selection.select(row)
        } else {
            this.selection.deselect(row)
        }
        this.resortAndRefresh()
    }

    onBack(): void {
        this.router.navigate([PLAYLIST_ROUTES.HOME_SUMMARY])
    }

    onNext(): void {
        const selectedInListOrder = this.allCourses().filter(c => this.selection.isSelected(c))
        this.state.setSelectedCourses(selectedInListOrder)
        this.router.navigate([PLAYLIST_ROUTES.MANAGE_COURSE_ORDER])
    }

    isNextEnabled(): boolean {
        return this.selection.selected.length > 0
    }

}
