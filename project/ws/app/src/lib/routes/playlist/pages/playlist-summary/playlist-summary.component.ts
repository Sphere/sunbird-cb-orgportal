import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { PlaylistStateService } from '../../services/playlist-state.service'
import { PlaylistFilters } from '../../models/playlist.model'

@Component({
    selector: 'app-playlist-summary',
    templateUrl: './playlist-summary.component.html',
    styleUrls: ['./playlist-summary.component.scss'],
})
export class PlaylistSummaryComponent implements OnInit {
    filters: PlaylistFilters | null = null
    existingCourseIds: string[] = []
    existingCompetencyIds: string[] = []

    // Course statistics
    courseSummary = {
        total: 0,
        lastUpdated: 'N/A',
    }

    // Competency statistics
    competencySummary = {
        total: 0,
        lastUpdated: 'N/A',
    }

    get hasExistingCoursePlaylist(): boolean {
        return this.existingCourseIds.length > 0
    }

    get hasExistingCompetencyPlaylist(): boolean {
        return this.existingCompetencyIds.length > 0
    }

    constructor(
        private router: Router,
        private state: PlaylistStateService
    ) { }

    ngOnInit(): void {
        this.loadFilters()
        this.loadExistingPlaylist()
        this.loadExistingCompetencyPlaylist()
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
        const existingPlaylist = this.state.getExistingPlaylist()

        this.courseSummary.total = this.existingCourseIds.length

        if (this.existingCourseIds.length > 0) {
            this.courseSummary.lastUpdated = existingPlaylist?.updated_at
                ? this.timeAgo(existingPlaylist?.updated_at)
                : 'N/A'
        }
    }

    /**
     * Load existing competency playlist data from state
     */
    private loadExistingCompetencyPlaylist(): void {
        this.existingCompetencyIds = this.state.getExistingCompetencyIds()
        const existingPlaylist = this.state.getExistingCompetencyPlaylist()

        this.competencySummary.total = this.existingCompetencyIds.length

        if (this.existingCompetencyIds.length > 0) {
            this.competencySummary.lastUpdated = existingPlaylist?.updated_at
                ? this.timeAgo(existingPlaylist?.updated_at)
                : 'N/A'
        }
    }

    /**
     * Transforms a date string into a relative time string (e.g. "2 mins ago", "1 hr ago")
     */
    private timeAgo(dateString: string): string {
        const date = new Date(dateString)
        const now = new Date()
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (seconds < 60) {
            return 'Just now'
        }

        const minutes = Math.floor(seconds / 60)
        if (minutes < 60) {
            return `${minutes} min${minutes > 1 ? 's' : ''} ago`
        }

        const hours = Math.floor(minutes / 60)
        if (hours < 24) {
            return `${hours} hr${hours > 1 ? 's' : ''} ago`
        }

        const days = Math.floor(hours / 24)
        if (days < 30) {
            return `${days} day${days > 1 ? 's' : ''} ago`
        }

        const months = Math.floor(days / 30)
        if (months < 12) {
            return `${months} month${months > 1 ? 's' : ''} ago`
        }

        const years = Math.floor(months / 12)
        return `${years} year${years > 1 ? 's' : ''} ago`
    }

    /**
     * Navigate back to filters page
     */
    onChangeFilters(): void {
        this.router.navigate(['/app/home/playlist/filters'])
    }

    /**
     * Navigate to course selection page
     * Clears course cache and selections to ensure fresh start
     */
    onManageCourse(): void {
        // Clear course cache to ensure fresh data is fetched from sunbirdigot/search
        this.state.clearCourseCache()
        // Clear any previously selected courses to start fresh
        this.state.clearSelectedCourses()
        this.router.navigate(['/app/playlist/select-courses'])
    }

    /**
     * Navigate to competency selection page
     */
    onCompetencyClick(): void {
        this.router.navigate(['/app/playlist/select-competencies'])
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
