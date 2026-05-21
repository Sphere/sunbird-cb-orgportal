import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router } from '@angular/router'
import { MatDialog, MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { take } from 'rxjs/operators'
import { PlaylistStateService } from '../../services/playlist-state.service'
import { Playlist, PlaylistCompetencyPayload, PlaylistFilters } from '../../models/playlist.model'
import { CourseApiService } from '../../services/course-api.service'
import { PLAYLIST_ROUTES, TIME_UNITS } from '../../constants/playlist.constants'
import {
    PlaylistViewCompetencyRow,
    PlaylistViewCourseRow,
    PlaylistViewDialogComponent,
    PlaylistViewDialogData,
    PlaylistViewLevelRow,
} from '../../components/playlist-view-dialog/playlist-view-dialog.component'
import { Course } from '../../models/course.model'

@Component({
    selector: 'app-playlist-summary',
    templateUrl: './playlist-summary.component.html',
    styleUrls: ['./playlist-summary.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatIconModule],
})
export class PlaylistSummaryComponent implements OnInit {
    readonly filters = signal<PlaylistFilters | null>(null)
    readonly existingCourseIds = signal<string[]>([])
    readonly existingCompetencyIds = signal<string[]>([])

    readonly courseSummary = signal({ total: 0, lastUpdated: 'N/A' })
    readonly competencySummary = signal({ total: 0, lastUpdated: 'N/A' })
    readonly searchSummary = signal({ total: 0, lastUpdated: 'N/A' })

    readonly hasExistingCoursePlaylist = computed(() => this.existingCourseIds().length > 0)
    readonly hasExistingCompetencyPlaylist = computed(() => this.existingCompetencyIds().length > 0)
    readonly hasExistingSearchPlaylist = computed(() => this.searchSummary().total > 0)

    private readonly router = inject(Router)
    private readonly state = inject(PlaylistStateService)
    private readonly dialog = inject(MatDialog)
    private readonly courseApi = inject(CourseApiService)

    /**
     * Component initialization.
     * Loads filters and existing playlist data from the global state.
     */
    ngOnInit(): void {
        this.loadFilters()
        this.loadExistingPlaylist()
        this.loadExistingCompetencyPlaylist()
        this.loadExistingSearchPlaylist()
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
     * Loads the existing query-based search playlist details.
     */
    private loadExistingSearchPlaylist(): void {
        const existingPlaylist = this.state.getExistingSearchPlaylist()
        const hasPayload = !!existingPlaylist?.dataSource?.payload

        this.searchSummary.set({
            total: hasPayload ? 1 : 0,
            lastUpdated: hasPayload && existingPlaylist?.updated_at
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
     * Navigates to the search management entry point.
     */
    onSearchClick(): void {
        this.router.navigate([PLAYLIST_ROUTES.MANAGE_SEARCH])
    }

    /**
     * Opens the learner search view.
     */
    onViewSearch(): void {
        this.router.navigate([PLAYLIST_ROUTES.MANAGE_SEARCH])
    }

    async onViewCourse(): Promise<void> {
        const filters = this.filters()
        const existingPlaylist = this.state.getExistingPlaylist()
        if (!filters || !existingPlaylist) {
            return
        }

        const courseRows = await this.buildCourseRows(existingPlaylist, filters.language)
        const dialogData: PlaylistViewDialogData = {
            mode: 'course',
            title: 'Course Playlist View',
            orgId: filters.orgId,
            orgName: filters.orgName || '',
            roles: filters.role || [],
            language: filters.language,
            playlistId: existingPlaylist.playlistId || '',
            courseRows,
            competencyRows: [],
        }
        this.dialog.open(PlaylistViewDialogComponent, {
            width: '980px',
            maxWidth: '95vw',
            panelClass: 'playlist-view-dialog-panel',
            data: dialogData,
        })
    }

    onViewCompetency(): void {
        const filters = this.filters()
        const existingPlaylist = this.state.getExistingCompetencyPlaylist()
        if (!filters || !existingPlaylist) {
            return
        }

        const competencyRows = this.buildCompetencyRows(existingPlaylist)
        const dialogData: PlaylistViewDialogData = {
            mode: 'competency',
            title: 'Competency Playlist View',
            orgId: filters.orgId,
            orgName: filters.orgName || '',
            roles: filters.role || [],
            language: filters.language,
            playlistId: existingPlaylist.playlistId || '',
            courseRows: [],
            competencyRows,
        }
        this.dialog.open(PlaylistViewDialogComponent, {
            width: '1100px',
            maxWidth: '96vw',
            panelClass: 'playlist-view-dialog-panel',
            data: dialogData,
        })
    }


    private async getCourseMapForIds(courseIds: string[], language: string): Promise<Map<string, Course>> {
        if (courseIds.length === 0) {
            return new Map()
        }

        const response = await this.courseApi.searchCoursesByIds(courseIds, language).pipe(take(1)).toPromise()
        const courses = (response as any)?.courses || []
        return new Map(courses.map((c: Course) => [c.identifier, c]))
    }

    private async buildCourseRows(playlist: Playlist, language: string): Promise<PlaylistViewCourseRow[]> {
        const payload = Array.isArray(playlist?.dataSource?.payload) ? playlist.dataSource.payload : []
        const courseIds = payload.filter((item): item is string => typeof item === 'string' && !!item.trim())

        const courseMap = await this.getCourseMapForIds(courseIds, language)

        return courseIds.map((identifier, index) => {
            const course = courseMap.get(identifier)
            return {
                index,
                identifier,
                name: course?.name || identifier,
                sourceName: course?.sourceName || 'N/A',
            }
        })
    }

    private buildCompetencyRows(playlist: Playlist): PlaylistViewCompetencyRow[] {
        const payload = Array.isArray(playlist?.dataSource?.payload) ? playlist.dataSource.payload : []

        const rows = payload.map((item, arrayIndex) => {
            const comp = this.normalizeCompetencyPayload(item)
            if (!comp) {
                return null
            }

            const levelRows: PlaylistViewLevelRow[] = (Array.isArray(comp.levels) ? comp.levels : []).map(level => {
                const courseId = String(level?.courseId || '').trim()
                return {
                    level: level?.level ?? '',
                    name: String(level?.name || ''),
                    description: String(level?.description || ''),
                    courseId,
                    courseName: '',
                }
            }).sort((a, b) => this.compareLevels(a.level, b.level))

            const payloadIndex = typeof comp.index === 'number' ? comp.index : arrayIndex
            return {
                index: payloadIndex,
                code: String(comp.code || ''),
                name: String(comp.name || comp.code || ''),
                levels: levelRows,
            } as PlaylistViewCompetencyRow
        }).filter((row): row is PlaylistViewCompetencyRow => !!row)

        return rows.sort((a, b) => a.index - b.index)
    }

    private compareLevels(a: number | string, b: number | string): number {
        const aNum = Number(String(a).replace(/[^0-9.-]/g, ''))
        const bNum = Number(String(b).replace(/[^0-9.-]/g, ''))
        const aValid = Number.isFinite(aNum)
        const bValid = Number.isFinite(bNum)
        if (aValid && bValid) {
            return aNum - bNum
        }
        return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
    }

    private normalizeCompetencyPayload(item: unknown): PlaylistCompetencyPayload | null {
        if (!item || typeof item !== 'object') {
            return null
        }

        if ('id' in item || 'code' in item) {
            return item as PlaylistCompetencyPayload
        }

        const wrapped = Object.values(item as Record<string, unknown>).find(
            value => !!value && typeof value === 'object' && ('id' in (value as Record<string, unknown>) || 'code' in (value as Record<string, unknown>))
        )
        return (wrapped as PlaylistCompetencyPayload) || null
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
