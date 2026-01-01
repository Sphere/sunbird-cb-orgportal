import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { PlaylistStateService } from '../../services/playlist-state.service'
import { PlaylistApiService } from '../../services/playlist-api.service'
import { SelectableCourse } from '../../models/course.model'
import { SuccessDialogComponent } from '../../components/success-dialog/success-dialog.component'

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

        console.log('📋 Loaded selected courses for ordering:', this.orderedCourses.length)
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

        console.log('🔄 Course order updated:', this.orderedCourses.map(c => c.name))
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
     */
    async onSave(): Promise<void> {
        this.saving = true

        try {
            // Save ordered courses to state
            this.state.setOrderedCourses(this.orderedCourses)

            // Get filters and existing playlist
            const filters = this.state.getFilters()
            const existingPlaylist = this.state.getExistingPlaylist()

            if (!filters) {
                console.error('❌ No filters found in state')
                alert('Error: Missing filter information. Please start from the filters page.')
                this.router.navigate(['/app/home/playlist/filters'])
                return
            }

            // Extract ordered course IDs
            const courseIds = this.orderedCourses.map(c => c.identifier)

            console.log('💾 Saving playlist...')
            console.log('  - Filters:', filters)
            console.log('  - Course IDs (ordered):', courseIds)
            console.log('  - Existing Playlist:', existingPlaylist ? `ID: ${existingPlaylist.id}` : 'None (will create)')

            // Call save API (automatically decides create vs update)
            const response = await this.playlistApi.savePlaylist(
                filters,
                courseIds,
                existingPlaylist || undefined
            ).toPromise()

            console.log('✅ Playlist saved successfully:', response)

            // Re-fetch playlist data to get fresh data from API
            // This prevents showing stale cached data (2 min delay issue)
            console.log('🔄 Re-fetching playlist data to get latest state...')
            try {
                const freshPlaylists = await this.playlistApi.searchPlaylist(filters).toPromise()
                const freshPlaylist = freshPlaylists && freshPlaylists.length > 0 ? freshPlaylists[0] : null
                const freshCourseIds = this.playlistApi.extractCourseIds(freshPlaylists || [])

                // Update state with fresh data
                this.state.setExistingPlaylist(freshPlaylist)
                this.state.setExistingCourseIds(freshCourseIds)

                console.log('✅ Fresh data loaded:', freshCourseIds.length, 'courses')
            } catch (refetchError) {
                console.warn('⚠️ Could not re-fetch playlist data (not critical):', refetchError)
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
                // Navigate to filters page (as per requirement)
                this.router.navigate(['/app/home/playlist/filters'])
            })

        } catch (error: any) {
            console.error('❌ Error saving playlist:', error)

            // Show detailed error message
            const errorMsg = error?.error?.message || error?.message || 'Unknown error occurred'
            alert(`Failed to save playlist:\n\n${errorMsg}\n\nPlease try again or contact support.`)
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
