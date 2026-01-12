import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { PlaylistStateService } from '../../services/playlist-state.service'
import { PlaylistApiService, PlaylistType } from '../../services/playlist-api.service'
import { SelectableCourse } from '../../models/course.model'
import { SuccessDialogComponent } from '../../components/success-dialog/success-dialog.component'
import { RoleConfirmDialogComponent, RoleConfirmDialogData } from '../../components/role-confirm-dialog/role-confirm-dialog.component'
import { ErrorDialogComponent, ErrorDialogData } from '../../components/error-dialog/error-dialog.component'

/**
 * Manage Course Order Component
 * 
 * Final page in playlist workflow
 * Allows admin to reorder selected courses via drag & drop
 * Shows dynamic order numbers
 * Provides save functionality
 */
@Component({
    selector: 'app-manage-course-order',
    templateUrl: './manage-course-order.component.html',
    styleUrls: ['./manage-course-order.component.scss'],
})
export class ManageCourseOrderComponent implements OnInit {
    orderedCourses: SelectableCourse[] = []
    searchTerm = ''
    filteredCourses: SelectableCourse[] = []
    saving = false

    constructor(
        private router: Router,
        private state: PlaylistStateService,
        private playlistApi: PlaylistApiService,
        private dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.loadSelectedCourses()
    }

    /**
     * Load selected courses from state
     */
    private loadSelectedCourses(): void {
        const selectedCourses = this.state.getSelectedCourses()

        if (!selectedCourses || selectedCourses.length === 0) {
            // No courses selected, redirect back
            this.router.navigate(['/app/playlist/select-courses'])
            return
        }

        // Assign display order
        this.orderedCourses = selectedCourses.map((course, index) => ({
            ...course,
            displayOrder: index + 1,
        }))

        this.filteredCourses = [...this.orderedCourses]

    }

    /**
     * Handle drag and drop event
     * Updates order dynamically
     */
    onDrop(event: CdkDragDrop<SelectableCourse[]>): void {
        // Move item in the array
        moveItemInArray(this.orderedCourses, event.previousIndex, event.currentIndex)

        // Update display order numbers
        this.updateOrderNumbers()

        // Update filtered list if search is active
        if (this.searchTerm) {
            this.onSearch()
        } else {
            this.filteredCourses = [...this.orderedCourses]
        }

    }

    /**
     * Update display order numbers after reordering
     */
    private updateOrderNumbers(): void {
        this.orderedCourses.forEach((course, index) => {
            course.displayOrder = index + 1
        })
    }

    /**
     * Handle search - non-destructive (doesn't change order)
     */
    onSearch(): void {
        if (!this.searchTerm || this.searchTerm.trim() === '') {
            this.filteredCourses = [...this.orderedCourses]
            return
        }

        const term = this.searchTerm.toLowerCase().trim()
        this.filteredCourses = this.orderedCourses.filter(course =>
            course.name.toLowerCase().includes(term) ||
            course.sourceName.toLowerCase().includes(term)
        )
    }

    /**
     * Navigate back to course selection
     */
    onBack(): void {
        this.router.navigate(['/app/playlist/select-courses'])
    }

    /**
     * Save the ordered playlist
     * Creates new playlist if none exists, updates if playlist found
     * Shows confirmation dialog if roles differ from existing configuration
     */
    async onSave(): Promise<void> {
        // Get filters and existing playlist
        const filters = this.state.getFilters()
        const existingPlaylist = this.state.getExistingPlaylist()

        if (!filters) {
            console.error('No filters found in state')
            alert('Error: Missing filter information. Please start from the filters page.')
            this.router.navigate(['/app/home/playlist/filters'])
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

                return
            }


        }

        // Proceed with save
        this.saving = true

        try {
            // Save ordered courses to state
            this.state.setOrderedCourses(this.orderedCourses)

            // Extract ordered course IDs
            const courseIds = this.orderedCourses.map(c => c.identifier)

            // Merge roles (combine existing + selected)
            const mergedRoles = this.state.getMergedRoles(filters.role)
            const filtersWithMergedRoles = { ...filters, role: mergedRoles }

            // Call save API
            await this.playlistApi.savePlaylist(
                filtersWithMergedRoles,
                courseIds,
                existingPlaylist || undefined,
                PlaylistType.COURSE
            ).toPromise()



            // Re-fetch playlist data to get fresh data from API
            // This prevents showing stale cached data (2 min delay issue)

            try {
                // Search using unique key: orgId + language + role + playlistId
                const freshPlaylists = await this.playlistApi.searchPlaylist(filters, PlaylistType.COURSE).toPromise()
                const freshPlaylist = freshPlaylists && freshPlaylists.length > 0 ? freshPlaylists[0] : null
                const freshCourseIds = this.playlistApi.extractCourseIds(freshPlaylists || [])

                // Update state with fresh data
                this.state.setExistingPlaylist(freshPlaylist)
                this.state.setExistingCourseIds(freshCourseIds)


            } catch (refetchError) {
                console.warn('Could not re-fetch playlist data:', refetchError)
                // Continue anyway - the save was successful
            }

            // Show custom success dialog
            const dialogRef = this.dialog.open(SuccessDialogComponent, {
                width: '323px',
                disableClose: true, // Must click Continue
                panelClass: 'success-dialog-panel'
            })

            // Handle Continue button click
            dialogRef.afterClosed().subscribe(() => {
                this.router.navigate(['/app/home/playlist/filters'])
            })

        } catch (err: any) {
            console.error('Playlist save error:', JSON.stringify(err?.error || err, null, 2))
            const apiError = err?.error || err
            const firstError = apiError?.result?.errors?.[0]?.message
            const errorMessage = firstError
                || apiError?.params?.errmsg
                || apiError?.message
                || err?.message
                || 'Failed to save playlist'

            // Format additional error details if multiple errors exist
            const allErrors = apiError?.result?.errors
            const errorDetails = allErrors && allErrors.length > 1
                ? allErrors.map((e: any) => `• ${e.message}`).join('\n')
                : null

            // Show error dialog
            const errorDialogData: ErrorDialogData = {
                title: 'Save Failed',
                message: errorMessage,
                details: errorDetails
            }

            const errorDialogRef = this.dialog.open(ErrorDialogComponent, {
                width: '400px',
                disableClose: false,
                data: errorDialogData
            })

            // Handle retry
            errorDialogRef.afterClosed().subscribe((retry: boolean) => {
                if (retry) {
                    this.onSave()
                }
            })
        } finally {
            this.saving = false
        }
    }

    /**
     * Check if save button should be enabled
     */
    isSaveEnabled(): boolean {
        return this.orderedCourses.length > 0 && !this.saving
    }
}
