import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router } from '@angular/router'
import { PlaylistStateService } from '../../services/playlist-state.service'
import { PlaylistFilters } from '../../models/playlist.model'
import { PLAYLIST_ROUTES, TIME_UNITS } from '../../constants/playlist.constants'

@Component({
    selector: 'app-playlist-summary',
    templateUrl: './playlist-summary.component.html',
    styleUrls: ['./playlist-summary.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule],
})
export class PlaylistSummaryComponent implements OnInit {
    readonly filters = signal<PlaylistFilters | null>(null)
    readonly existingCourseIds = signal<string[]>([])
    readonly existingCompetencyIds = signal<string[]>([])

    readonly courseSummary = signal({ total: 0, lastUpdated: 'N/A' })
    readonly competencySummary = signal({ total: 0, lastUpdated: 'N/A' })

    readonly hasExistingCoursePlaylist = computed(() => this.existingCourseIds().length > 0)
    readonly hasExistingCompetencyPlaylist = computed(() => this.existingCompetencyIds().length > 0)

    private readonly router = inject(Router)
    private readonly state = inject(PlaylistStateService)

    /**
     * Component initialization.
     * Loads filters and existing playlist data from the global state.
     */
    ngOnInit(): void {
        this.loadFilters()
        this.loadExistingPlaylist()
        this.loadExistingCompetencyPlaylist()
    }

    /**
     * Retrieves the active playlist filters from the state service.
     * If no filters are found, redirects the user back to the initialization step.
     */
    private loadFilters(): void {
        const f = this.state.getFilters()
        this.filters.set(f)

        if (!f) {
            this.router.navigate([PLAYLIST_ROUTES.HOME_FILTERS])
        }
    }

    /**
     * Loads the existing course-based playlist details.
     * Calculates the total count and formats the last-updated timestamp for display.
     */
    private loadExistingPlaylist(): void {
        const ids = this.state.getExistingCourseIds()
        this.existingCourseIds.set(ids)
        const existingPlaylist = this.state.getExistingPlaylist()

        this.courseSummary.set({
            total: ids.length,
            lastUpdated: ids.length > 0 && existingPlaylist?.updated_at
                ? this.timeAgo(existingPlaylist.updated_at)
                : 'N/A',
        })
    }

    /**
     * Loads the existing competency-based playlist details.
     * Syncs with the latest competency IDs and updates the visual summary.
     */
    private loadExistingCompetencyPlaylist(): void {
        const ids = this.state.getExistingCompetencyIds()
        this.existingCompetencyIds.set(ids)
        const existingPlaylist = this.state.getExistingCompetencyPlaylist()

        this.competencySummary.set({
            total: ids.length,
            lastUpdated: ids.length > 0 && existingPlaylist?.updated_at
                ? this.timeAgo(existingPlaylist.updated_at)
                : 'N/A',
        })
    }

    /**
     * Transforms a date string into a relative time string (e.g. "2 mins ago", "1 hr ago")
     */
    private timeAgo(dateString: string): string {
        const date = new Date(dateString)
        const now = new Date()
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (seconds < TIME_UNITS.MINUTE) {
            return 'Just now'
        }

        const minutes = Math.floor(seconds / TIME_UNITS.MINUTE)
        if (minutes < TIME_UNITS.HOUR) {
            return `${minutes} min${minutes > 1 ? 's' : ''} ago`
        }

        const hours = Math.floor(minutes / TIME_UNITS.HOUR)
        if (hours < TIME_UNITS.DAY) {
            return `${hours} hr${hours > 1 ? 's' : ''} ago`
        }

        const days = Math.floor(hours / TIME_UNITS.DAY)
        if (days < TIME_UNITS.MONTH_THRESHOLD) {
            return `${days} day${days > 1 ? 's' : ''} ago`
        }

        const months = Math.floor(days / TIME_UNITS.MONTH_THRESHOLD)
        if (months < 12) {
            return `${months} month${months > 1 ? 's' : ''} ago`
        }

        const years = Math.floor(months / 12)
        return `${years} year${years > 1 ? 's' : ''} ago`
    }

    /**
     * Navigates back to the initial filter configuration screen.
     */
    onChangeFilters(): void {
        this.router.navigate([PLAYLIST_ROUTES.HOME_FILTERS])
    }

    /**
     * Navigates to the course selection workflow.
     * Ensures any stale course data is cleared before starting the refresh process.
     */
    onManageCourse(): void {
        // Clear course cache to ensure fresh data is fetched from sunbirdigot/search
        this.state.clearCourseCache()
        // Clear any previously selected courses to start fresh
        this.state.clearSelectedCourses()
        this.router.navigate([PLAYLIST_ROUTES.SELECT_COURSES])
    }

    /**
     * Navigates to the competency selection workflow.
     * Allows the user to browse and check/uncheck competencies for the playlist.
     */
    onCompetencyClick(): void {
        this.router.navigate([PLAYLIST_ROUTES.SELECT_COMPETENCIES])
    }


    /**
     * Formats the list of selected roles into a user-friendly string.
     */
    getRoleDisplay(): string {
        const f = this.filters()
        if (!f || !f.role) {
            return ''
        }
        return Array.isArray(f.role) ? f.role.join(', ') : f.role
    }
}
