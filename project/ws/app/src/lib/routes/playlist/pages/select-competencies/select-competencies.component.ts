import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { CommonModule } from '@angular/common'
import { Router } from '@angular/router'
import { MatIconModule } from '@angular/material/icon'
import { SelectionModel } from '@angular/cdk/collections'
import { CompetencyApiService } from '../../services/competency-api.service'
import { PlaylistStateService } from '../../services/playlist-state.service'
import { SelectableCompetency } from '../../models/competency.model'
import { getLevelNumbers } from '../../config/competency.config'
import { PLAYLIST_ROUTES, PLAYLIST_UI } from '../../constants/playlist.constants'
import { log } from '../../utils/playlist-logger.utils'
import { RawCompetencyEntity, RawCompetencyLevel } from '../../utils/competency-transformer'
import { DisableForViewOnlyDirective } from '../../../../shared/directives/disable-for-view-only.directive'

/**
 * Component to handle competency selection.
 * Supports search, pagination, and persistence across navigation.
 */
@Component({
    selector: 'app-select-competencies',
    templateUrl: './select-competencies.component.html',
    styleUrls: ['./select-competencies.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, MatIconModule, DisableForViewOnlyDirective],
})
export class SelectCompetenciesComponent implements OnInit {
    selection = new SelectionModel<SelectableCompetency>(true, [])

    readonly allCompetencies = signal<SelectableCompetency[]>([])
    readonly searchResultCompetencies = signal<SelectableCompetency[]>([])
    readonly filteredCompetencies = signal<SelectableCompetency[]>([])
    readonly existingCompetencyCodes = signal<string[]>([])
    readonly shimmerRows = Array(PLAYLIST_UI.SHIMMER_ROWS).fill(0)

    readonly loading = signal(false)
    readonly searchTerm = signal('')
    private readonly preselectedCompetencyOrderMap = new Map<string, number>()

    private readonly destroyRef = inject(DestroyRef)
    private readonly router = inject(Router)
    private readonly competencyApi = inject(CompetencyApiService)
    private readonly state = inject(PlaylistStateService)

    ngOnInit(): void {
        this.existingCompetencyCodes.set(
            this.state.getExistingCompetencyCodes().map(code => String(code).trim().toUpperCase())
        )
        this.buildPreselectedCompetencyOrderMap()
        this.loadCompetencies()
    }

    /** Builds payload-order map for existing playlist competencies by code */
    private buildPreselectedCompetencyOrderMap(): void {
        this.preselectedCompetencyOrderMap.clear()
        const existingPlaylist = this.state.getExistingCompetencyPlaylist()
        const payload = existingPlaylist?.dataSource?.payload
        if (!Array.isArray(payload)) {
            return
        }

        payload.forEach((item, arrayIndex) => {
            if (!item || typeof item !== 'object') {
                return
            }

            const entry = item as Record<string, unknown>
            const wrapped = !('code' in entry)
                ? Object.values(entry).find(v => !!v && typeof v === 'object') as Record<string, unknown> | undefined
                : undefined
            const source = wrapped || entry

            const rawCode = String(source?.['code'] || '').trim().toUpperCase()
            if (!rawCode) {
                return
            }

            const rawIndex = source?.['index']
            const payloadIndex = typeof rawIndex === 'number' ? rawIndex : arrayIndex
            this.preselectedCompetencyOrderMap.set(rawCode, payloadIndex)
        })
    }

    /** Loads competency list and restores state */
    private loadCompetencies(): void {
        const filters = this.state.getFilters()
        if (!filters) {
            this.router.navigate([PLAYLIST_ROUTES.HOME_FILTERS])
            return
        }

        this.loading.set(true)
        const language = filters.language || 'en'

        const cached = this.state.getCachedCompetencies(language)
        if (cached) {
            this.processCompetencies(cached)
            this.finalizeLoading()
            return
        }

        this.competencyApi.getCompetencyListByLanguage(language).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data) => {
                this.state.setCachedCompetencies(data, language)
                this.processCompetencies(data)
                this.finalizeLoading()
            },
            error: (err) => {
                log.error('Error loading competencies:', err)
                this.loading.set(false)
            }
        })
    }

    /** Maps raw competencies to selectable objects (resets UI state) */
    private processCompetencies(data: RawCompetencyEntity[]): void {
        const existingCodes = this.existingCompetencyCodes()
        const competencies = data.map((c, index) => {
            const id = String(c.id)
            const code = String(c.code || '').trim().toUpperCase()
            const isPreselected = !!code && existingCodes.includes(code)

            return {
                ...c,
                id,
                selected: isPreselected,
                isPreselected,
                displayOrder: index + 1,
                coursesAssigned: false,
                levels: c.children && c.children.length > 0
                    ? c.children.map((child: RawCompetencyLevel) => ({
                        level: child.levelId || child.level,
                        name: child.name,
                        description: child.description,
                        courseId: undefined,
                        courseName: undefined
                    }))
                    : getLevelNumbers().map(level => ({ level }))
            } as SelectableCompetency
        })

        competencies.sort((a, b) => this.compareCompetencies(a, b))
        this.allCompetencies.set(competencies)
    }

    private finalizeLoading(): void {
        this.applyPreselectionAndSort()
        this.resortAndRefresh()
        this.loading.set(false)
    }

    /** Re-sorts list based on selection priority and refreshes visible rows */
    private resortAndRefresh(): void {
        const sorted = [...this.allCompetencies()].sort((a, b) => this.compareCompetencies(a, b))
        this.allCompetencies.set(sorted)
        const all = this.allCompetencies()
        this.searchResultCompetencies.set([...all])
        this.filteredCompetencies.set([...all])
        this.onSearch()
    }

    /** Restores saved selections; list stays in strict A-Z order */
    private applyPreselectionAndSort(): void {
        this.selection.clear()

        const savedSelections = this.state.getSelectedCompetencies()
        let selectedCount = 0

        if (savedSelections && savedSelections.length > 0) {
            const savedCodes = new Set(
                savedSelections
                    .map(c => String(c?.code || '').trim().toUpperCase())
                    .filter(code => !!code)
            )

            const savedIds = new Set(
                savedSelections
                    .map(c => String(c?.id || '').trim())
                    .filter(id => !!id)
            )

            this.allCompetencies()
                .filter((c: SelectableCompetency) => {
                    const code = String(c?.code || '').trim().toUpperCase()
                    if (code && savedCodes.size > 0) {
                        return savedCodes.has(code)
                    }
                    return savedIds.has(String(c.id))
                })
                .forEach((c: SelectableCompetency) => {
                    this.selection.select(c)
                    selectedCount += 1
                })
        }

        // Fallback: if no saved match found (stale state), use backend preselected IDs.
        if (selectedCount === 0) {
            this.allCompetencies()
                .filter((c: SelectableCompetency) => c.isPreselected)
                .forEach((c: SelectableCompetency) => this.selection.select(c))
        }
    }

    /** Filters competencies based on name or code */
    onSearch(): void {
        if (this.searchTerm().trim() === '') {
            this.searchResultCompetencies.set([...this.allCompetencies()])
        } else {
            const term = this.searchTerm().toLowerCase()
            this.searchResultCompetencies.set(this.allCompetencies().filter((c: SelectableCompetency) =>
                c.name?.toLowerCase().includes(term) ||
                c.code?.toLowerCase().includes(term)
            ))
        }

        this.filteredCompetencies.set([...this.searchResultCompetencies()])
    }

    /** Syncs checkbox state — list order stays A-Z */
    onSelectionChange(row: SelectableCompetency, event: Event): void {
        if ((event.target as HTMLInputElement).checked) {
            this.selection.select(row)
        } else {
            this.selection.deselect(row)
        }
        this.resortAndRefresh()
    }

    /** Sort by code A-Z / 0-9, then name as tiebreaker */
    private compareCompetencies(a: SelectableCompetency, b: SelectableCompetency): number {
        // Priority groups:
        // 1) existing/preselected 2) newly selected 3) remaining unselected
        const rank = (item: SelectableCompetency): number => {
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
            const keyA = String(a?.code || '').trim().toUpperCase()
            const keyB = String(b?.code || '').trim().toUpperCase()
            const orderA = this.preselectedCompetencyOrderMap.get(keyA) ?? Number.MAX_SAFE_INTEGER
            const orderB = this.preselectedCompetencyOrderMap.get(keyB) ?? Number.MAX_SAFE_INTEGER
            if (orderA !== orderB) {
                return orderA - orderB
            }
        }

        const codeA = (a?.code || '').trim()
        const codeB = (b?.code || '').trim()
        const codeSort = codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' })
        if (codeSort !== 0) {
            return codeSort
        }

        const nameA = (a?.name || '').trim()
        const nameB = (b?.name || '').trim()
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' })
    }

    /**
     * Returns the user to the playlist summary dashboard.
     */
    onBack(): void {
        this.router.navigate([PLAYLIST_ROUTES.HOME_SUMMARY])
    }

    /**
     * Saves the current selections to the global state and navigates to the management page.
     * This is the bridge between selecting competencies and assigning courses to them.
     */
    onAssignCourses(): void {
        const selectedInListOrder = this.allCompetencies().filter(c => this.selection.isSelected(c))
        this.state.setSelectedCompetencies(selectedInListOrder)
        this.router.navigate([PLAYLIST_ROUTES.MANAGE_COMPETENCY_ORDER])
    }
}
