import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { PlaylistStateService } from '../../services/playlist-state.service'
import { PlaylistFilters } from '../../models/playlist.model'

/**
 * Playlist Summary Component
 * 
 * Displays summary of existing playlist (if any)
 * Shows "Manage Course" and "Manage Competency" cards
 * Allows user to change filters or proceed to course selection
 */
@Component({
    selector: 'app-playlist-summary',
    templateUrl: './playlist-summary.component.html',
    styleUrls: ['./playlist-summary.component.scss'],
})
export class PlaylistSummaryComponent implements OnInit {
    filters: PlaylistFilters | null = null
    existingCourseIds: string[] = []

    // Course statistics
    courseSummary = {
        total: 0,
        live: 0,
        hidden: 0,
        lastUpdated: '',
    }

    // Competency statistics (placeholder for future)
    competencySummary = {
        total: 32,
        live: 24,
        hidden: 8,
        lastUpdated: '16hrs ago',
    }

    constructor(
        private router: Router,
        private state: PlaylistStateService
    ) { }

    ngOnInit(): void {
        this.loadFilters()
        this.loadExistingPlaylist()
    }

    /**
     * Load filters from state
     */
    private loadFilters(): void {
        this.filters = this.state.getFilters()

        if (!this.filters) {
            // If no filters, redirect back to filter page
            this.router.navigate(['/app/home/playlist/filters'])
        }
    }

    /**
     * Load existing playlist data from state
     */
    private loadExistingPlaylist(): void {
        this.existingCourseIds = this.state.getExistingCourseIds()

        // Show actual course count from existing playlist
        this.courseSummary.total = this.existingCourseIds.length

        // TODO: Get actual live/hidden counts from API
        // For now, show total count and set live=total, hidden=0
        if (this.existingCourseIds.length > 0) {
            this.courseSummary.live = this.existingCourseIds.length
            this.courseSummary.hidden = 0
            this.courseSummary.lastUpdated = 'Not available'
        }

        console.log('Existing playlist course IDs:', this.existingCourseIds)
        console.log('Course summary:', this.courseSummary)
    }

    /**
     * Navigate back to filters page
     */
    onChangeFilters(): void {
        this.router.navigate(['/app/home/playlist/filters'])
    }

    /**
     * Navigate to course selection page
     * Clears course cache to ensure fresh data is fetched from search API
     */
    onManageCourse(): void {
        // Clear course cache to ensure fresh data is fetched from sunbirdigot/search
        this.state.clearCourseCache()
        this.router.navigate(['/app/playlist/select-courses'])
    }

    /**
     * Navigate to competency management (disabled for now)
     */
    onManageCompetency(): void {
        // TODO: Implement in future phase
        console.log('Competency management not yet implemented')
    }

    /**
     * Get display value for selected roles
     */
    getRoleDisplay(): string {
        if (!this.filters || !this.filters.role) {
            return ''
        }
        return Array.isArray(this.filters.role)
            ? this.filters.role.join(', ')
            : this.filters.role
    }
}
