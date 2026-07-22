import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { CommonModule } from '@angular/common'
import { ActivatedRoute, Router } from '@angular/router'
import { take } from 'rxjs/operators'
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatIconModule } from '@angular/material/icon'
import { PlaylistStateService } from '../../services/playlist-state.service'
import { PlaylistApiService } from '../../services/playlist-api.service'
import { SelectableCourse } from '../../models/course.model'
import { CourseContextConfig, getCourseContext } from '../../config/course-context.config'
import { SuccessDialogComponent } from '../../components/success-dialog/success-dialog.component'
import { RoleConfirmDialogComponent, RoleConfirmDialogData } from '../../components/role-confirm-dialog/role-confirm-dialog.component'
import { ErrorDialogComponent, ErrorDialogData } from '../../components/error-dialog/error-dialog.component'
import { PLAYLIST_ROUTES, PLAYLIST_UI } from '../../constants/playlist.constants'
import { log } from '../../utils/playlist-logger.utils'
import { HideForViewOnlyDirective } from '../../../../shared/directives/hide-for-view-only.directive'
import { FeatureAccessService, FEATURE_KEY } from '../../../../shared/access/feature-access'

/**
 * Component for finalizing the order of courses within a playlist.
 * Features drag-and-drop reordering, searching within the selection, and persistence to the database.
 */
@Component({
    selector: 'app-manage-course-order',
    templateUrl: './manage-course-order.component.html',
    styleUrls: ['./manage-course-order.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, DragDropModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, HideForViewOnlyDirective],
})
export class ManageCourseOrderComponent implements OnInit {
    readonly orderedCourses = signal<SelectableCourse[]>([])
    readonly filteredCourses = signal<SelectableCourse[]>([])

    readonly saving = signal(false)
    readonly searchTerm = signal('')
    readonly isSaveEnabled = computed(() => this.orderedCourses().length > 0 && !this.saving())

    private readonly destroyRef = inject(DestroyRef)
    private readonly router = inject(Router)
    private readonly route = inject(ActivatedRoute)
    private readonly state = inject(PlaylistStateService)
    private readonly playlistApi = inject(PlaylistApiService)
    private readonly dialog = inject(MatDialog)
    private readonly featureAccess = inject(FeatureAccessService)
    private readonly featureKey = inject(FEATURE_KEY, { optional: true })

    /** Which course playlist this screen saves to — set by route data */
    readonly context: CourseContextConfig = getCourseContext(this.route.snapshot.data['courseContext'])

    /** Read-only mode for view-only users — disables reordering. */
    get isViewOnly(): boolean {
        return this.featureAccess.isViewOnly(this.featureKey)
    }

    ngOnInit(): void {
        this.loadSelectedCourses()
    }

    /**
     * Loads the courses selected from the previous step.
     * If selections are missing, redirects the user back to the course selection screen.
     */
    private loadSelectedCourses(): void {
        const selectedCourses = this.state.getSelectedCourses(this.context.key)

        if (!selectedCourses || selectedCourses.length === 0) {
            this.router.navigate([this.context.selectRoute])
            return
        }

        const ordered = selectedCourses.map((course, index) => ({
            ...course,
            displayOrder: index + 1,
        }))

        this.orderedCourses.set(ordered)
        this.filteredCourses.set([...ordered])
    }

    /** 
     * Handles the drag-and-drop event to reorder courses.
     * Triggers a recalculation of display numbers to maintain a sequential 1, 2, 3... list.
     */
    onDrop(event: CdkDragDrop<SelectableCourse[]>): void {
        const courses = [...this.orderedCourses()]
        const filtered = [...this.filteredCourses()]
        if (!filtered.length || event.previousIndex === event.currentIndex) {
            return
        }

        // Reorder based on the rendered (filtered) list first.
        moveItemInArray(filtered, event.previousIndex, event.currentIndex)

        const hasSearch = !!this.searchTerm() && this.searchTerm().trim().length > 0
        const reorderedCourses = hasSearch
            // When searching, only reorder visible items while keeping hidden items in place.
            ? this.mergeFilteredOrderIntoFull(courses, filtered)
            // Without search, filtered == full list.
            : filtered

        reorderedCourses.forEach((course, index) => { course.displayOrder = index + 1 })
        this.orderedCourses.set(reorderedCourses)
        this.filteredCourses.set(hasSearch ? filtered : [...reorderedCourses])

        if (hasSearch) {
            this.onSearch()
        }
    }

    /** Applies filtered drag order back into the full ordered list */
    private mergeFilteredOrderIntoFull(
        fullList: SelectableCourse[],
        reorderedFiltered: SelectableCourse[]
    ): SelectableCourse[] {
        const key = (c: SelectableCourse) => String(c.identifier || '').trim()
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

    /**
     * Handle search - non-destructive (doesn't change order)
     */
    onSearch(): void {
        if (!this.searchTerm() || this.searchTerm().trim() === '') {
            this.filteredCourses.set([...this.orderedCourses()])
            return
        }

        const term = this.searchTerm().toLowerCase().trim()
        this.filteredCourses.set(this.orderedCourses().filter(course =>
            course.name.toLowerCase().includes(term) ||
            course.sourceName.toLowerCase().includes(term)
        ))
    }

    /**
     * Navigate back to course selection
     */
    onBack(): void {
        this.router.navigate([this.context.selectRoute])
    }

    /**
     * Save the ordered playlist
     * Creates new playlist if none exists, updates if playlist found
     * Shows confirmation dialog if roles differ from existing configuration
     */
    async onSave(): Promise<void> {
        // Get filters and existing playlist
        const filters = this.state.getFilters()
        const existingPlaylist = this.state.getExistingPlaylist(this.context.key)

        if (!filters) {
            log.error('No filters found in state')
            this.dialog.open(ErrorDialogComponent, {
                width: PLAYLIST_UI.ERROR_DIALOG_WIDTH,
                data: { title: 'Missing Information', message: 'Filter information not found. Please start from the filters page.' }
            })
            this.router.navigate([PLAYLIST_ROUTES.HOME_FILTERS])
            return
        }

        // Compare roles before saving
        const roleComparison = this.state.compareRoles(filters.role, this.context.key)


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
                return
            }
        }

        // Proceed with save
        this.saving.set(true)

        try {
            const courses = this.orderedCourses()

            // Save ordered courses to state
            this.state.setOrderedCourses(courses, this.context.key)

            // Extract ordered course IDs
            const courseIds = courses.map(c => c.identifier)

            // Merge roles (combine existing + selected)
            const mergedRoles = this.state.getMergedRoles(filters.role, this.context.key)
            const filtersWithMergedRoles = { ...filters, role: mergedRoles }

            // Call save API
            await this.playlistApi.savePlaylist(
                filtersWithMergedRoles,
                courseIds,
                existingPlaylist || undefined,
                this.context.playlistType
            ).pipe(take(1)).toPromise()



            // Re-fetch playlist data to get fresh data from API
            // This prevents showing stale cached data (2 min delay issue)

            try {
                // Search using unique key: orgId + language + role + playlistId
                const freshPlaylists = await this.playlistApi.searchPlaylist(filters, this.context.playlistType).pipe(take(1)).toPromise()
                const freshPlaylist = freshPlaylists && freshPlaylists.length > 0 ? freshPlaylists[0] : null
                const freshCourseIds = this.playlistApi.extractCourseIds(freshPlaylists || [])

                // Update state with fresh data
                this.state.setExistingPlaylist(freshPlaylist, this.context.key)
                this.state.setExistingCourseIds(freshCourseIds, this.context.key)
            } catch (refetchError) {
                log.warn('Could not re-fetch playlist data:', refetchError)
                // Continue anyway - the save was successful
            }

            // Show custom success dialog
            const dialogRef = this.dialog.open(SuccessDialogComponent, {
                width: PLAYLIST_UI.SUCCESS_DIALOG_WIDTH,
                disableClose: true, // Must click Continue
                panelClass: 'success-dialog-panel'
            })

            // Handle Continue button click
            dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
                this.router.navigate([PLAYLIST_ROUTES.HOME_FILTERS])
            })

        } catch (err: unknown) {
            const errObj = err as Record<string, unknown>
            log.error('Playlist save error:', JSON.stringify(errObj?.['error'] || err, null, 2))
            const apiError = (errObj?.['error'] as Record<string, unknown>) || errObj
            const result = apiError?.['result'] as Record<string, unknown> | undefined
            const params = apiError?.['params'] as Record<string, unknown> | undefined
            const firstError = result?.['errors'] as { message: string }[] | undefined
            const errorMessage = firstError?.[0]?.message
                || params?.['errmsg'] as string
                || apiError?.['message'] as string
                || 'Failed to save playlist'

            // Format additional error details if multiple errors exist
            const errorDetails = firstError && firstError.length > 1
                ? firstError.map(e => `• ${e.message}`).join('\n')
                : undefined

            // Show error dialog
            const errorDialogData: ErrorDialogData = {
                title: 'Save Failed',
                message: errorMessage,
                details: errorDetails
            }

            const errorDialogRef = this.dialog.open(ErrorDialogComponent, {
                width: PLAYLIST_UI.ERROR_DIALOG_WIDTH,
                disableClose: false,
                data: errorDialogData
            })

            // Handle retry
            errorDialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((retry: boolean) => {
                if (retry) {
                    this.onSave()
                }
            })
        } finally {
            this.saving.set(false)
        }
    }
}
