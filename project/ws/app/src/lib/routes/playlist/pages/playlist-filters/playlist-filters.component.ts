import { ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, HostListener, inject, OnInit, signal, ViewEncapsulation } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { AbstractControl, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms'
import { Router } from '@angular/router'
import { startWith, take } from 'rxjs/operators'
import { CommonModule } from '@angular/common'
import { PlaylistApiService, PlaylistType } from '../../services/playlist-api.service'
import { PlaylistStateService } from '../../services/playlist-state.service'
import { PlaylistFilters } from '../../models/playlist.model'
import { PLAYLIST_LANGUAGES, PLAYLIST_ROUTES, PLAYLIST_UI } from '../../constants/playlist.constants'
import { log } from '../../utils/playlist-logger.utils'

type FilterForm = {
    orgId: FormControl<string>
    role: FormControl<string[]>
    district: FormControl<string>
    block: FormControl<string>
    language: FormControl<string>
}

@Component({
    selector: 'app-playlist-filters',
    templateUrl: './playlist-filters.component.html',
    styleUrls: ['./playlist-filters.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
})
export class PlaylistFiltersComponent implements OnInit {
    filterForm!: FormGroup<FilterForm>
    readonly loading = signal(false)
    readonly errorMessage = signal('')

    /** Dropdown options - Organizations loaded from API */
    readonly organizations = signal<{ value: string; label: string }[]>([])
    readonly filteredOrganizations = signal<{ value: string; label: string }[]>([])
    readonly loadingOrganizations = signal(false)
    readonly loadingPositions = signal(false)
    readonly orgSearchTerm = signal('')
    readonly selectedOrgId = signal('')

    readonly positions = signal<{ value: string; label: string }[]>([])
    readonly districts = signal<{ value: string; label: string }[]>([])
    readonly blocks = signal<{ value: string; label: string }[]>([])

    languages = PLAYLIST_LANGUAGES

    readonly positionDropdownOpen = signal(false)
    readonly orgDropdownOpen = signal(false)

    get selectedRoles(): string[] {
        return this.filterForm?.get('role')?.value ?? []
    }

    readonly selectedOrgLabel = computed(() => {
        const val = this.selectedOrgId()
        return this.organizations().find(o => o.value === val)?.label ?? ''
    })

    private readonly destroyRef = inject(DestroyRef)
    private readonly fb = inject(NonNullableFormBuilder)
    private readonly router = inject(Router)
    private readonly playlistApi = inject(PlaylistApiService)
    private readonly state = inject(PlaylistStateService)
    private readonly elRef = inject(ElementRef)

    private readonly nonEmptyArray = (control: AbstractControl): ValidationErrors | null =>
        Array.isArray(control.value) && control.value.length > 0 ? null : { required: true }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as Node
        const wrappers = this.elRef.nativeElement.querySelectorAll('.select-wrapper')
        let insideOrg = false, insidePos = false
        wrappers.forEach((w: HTMLElement) => {
            if (w.contains(target)) {
                if (w.querySelector('.org-panel') || w.querySelector('[class*="org"]')) insideOrg = true
                else insidePos = true
            }
        })
        if (!insideOrg) this.orgDropdownOpen.set(false)
        if (!insidePos) this.positionDropdownOpen.set(false)
    }

    /**
     * Component initialization.
     * Sets up the reactive form and triggers initial data loading for organizations.
     */
    ngOnInit(): void {
        this.initForm()
        this.loadOrganizations()
        this.loadPositions()
        this.loadPreviousFilters()
    }

    /**
     * Fetches the list of valid organizations from the API.
     * These organizations populate the primary selection dropdown.
     */
    private loadOrganizations(): void {
        this.loadingOrganizations.set(true)
        this.playlistApi.searchOrganizations().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (orgs) => {
                this.organizations.set(orgs)
                this.filteredOrganizations.set([...orgs])
                this.loadingOrganizations.set(false)
            },
            error: (err) => {
                log.error('Failed to load organizations:', err)
                this.loadingOrganizations.set(false)
            }
        })
    }

    /**
     * Fetches the list of positions from the entity API.
     * Position name is used as both key and display label.
     */
    private loadPositions(): void {
        this.loadingPositions.set(true)
        this.playlistApi.searchPositions().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (positions) => {
                this.positions.set(positions)
                this.loadingPositions.set(false)
            },
            error: (err) => {
                log.error('Failed to load positions:', err)
                this.positions.set([])
                this.loadingPositions.set(false)
            },
        })
    }

    /** 
     * Filters the organization dropdown results based on user input.
     * Performs a case-insensitive search to help users find their organization quickly.
     */
    filterOrganizations(): void {
        if (!this.orgSearchTerm().trim()) {
            this.filteredOrganizations.set([...this.organizations()])
        } else {
            const search = this.orgSearchTerm().toLowerCase()
            this.filteredOrganizations.set(this.organizations().filter(org =>
                org.label.toLowerCase().includes(search)
            ))
        }
    }

    /**
     * Initialize reactive form with validation
     */
    private initForm(): void {
        this.filterForm = this.fb.group<FilterForm>({
            orgId: this.fb.control('', Validators.required),
            role: this.fb.control([] as string[], this.nonEmptyArray),
            district: this.fb.control(''),
            block: this.fb.control(''),
            language: this.fb.control('', Validators.required),
        })

        this.filterForm.controls.orgId.valueChanges
            .pipe(startWith(this.filterForm.controls.orgId.value), takeUntilDestroyed(this.destroyRef))
            .subscribe(value => this.selectedOrgId.set(value ?? ''))
    }

    /**
     * Load previously selected filters from state (if user navigated back)
     */
    private loadPreviousFilters(): void {
        const previousFilters = this.state.getFilters()
        if (previousFilters) {
            this.filterForm.patchValue({
                orgId: previousFilters.orgId,
                role: previousFilters.role ?? [],
                district: previousFilters.district?.[0] ?? '',
                language: previousFilters.language,
            })
        }
    }

    /**
     * Handle continue button click
     * Validates form, calls playlist search API, navigates to summary
     */
    async onContinue(): Promise<void> {
        if (this.filterForm.invalid) {
            this.filterForm.markAllAsTouched()
            return
        }

        const rawValue = this.filterForm.getRawValue()
        const filters: PlaylistFilters = {
            orgId: rawValue.orgId,
            role: rawValue.role ?? [],
            district: rawValue.district ? [rawValue.district] : undefined,
            language: rawValue.language,
        }

        // Add org name for display purposes
        const selectedOrg = this.organizations().find(org => org.value === filters.orgId)
        filters.orgName = selectedOrg?.label || filters.orgId

        this.loading.set(true)
        this.errorMessage.set('')

        try {
            // Clear course cache to ensure fresh data is fetched with new filters
            this.state.clearCourseCache()
            // Reset competency selections for a fresh filter context.
            // Otherwise stale selections can override backend preselection.
            this.state.clearSelectedCompetencies()

            // Save filters to state
            this.state.setFilters(filters)

            // Search for both Course and Competency playlists in parallel
            const [coursePlaylists, competencyPlaylists] = await Promise.all([
                this.playlistApi.searchPlaylist(filters, PlaylistType.COURSE).pipe(take(1)).toPromise(),
                this.playlistApi.searchPlaylist(filters, PlaylistType.COMPETENCY).pipe(take(1)).toPromise(),
            ])

            // Store Course playlist data
            const existingCoursePlaylist = coursePlaylists && coursePlaylists.length > 0 ? coursePlaylists[0] : null
            this.state.setExistingPlaylist(existingCoursePlaylist)
            const existingCourseIds = this.playlistApi.extractCourseIds(coursePlaylists || [])
            this.state.setExistingCourseIds(existingCourseIds)

            // Store Competency playlist data
            const existingCompetencyPlaylist = competencyPlaylists && competencyPlaylists.length > 0 ? competencyPlaylists[0] : null
            this.state.setExistingCompetencyPlaylist(existingCompetencyPlaylist)
            const existingCompetencyIds = this.playlistApi.extractCompetencyIds(competencyPlaylists || [])
            this.state.setExistingCompetencyIds(existingCompetencyIds)
            const existingCompetencyCodes = this.playlistApi.extractCompetencyCodes(competencyPlaylists || [])
            this.state.setExistingCompetencyCodes(existingCompetencyCodes)

            // Navigate to summary page
            this.router.navigate([PLAYLIST_ROUTES.HOME_SUMMARY])
        } catch (error) {
            log.error('Error searching playlist:', error)
            this.errorMessage.set('Failed to load playlist data. Please try again.')
        } finally {
            this.loading.set(false)
        }
    }


    /**
     * Utility to check if a specific form field has validation errors.
     * Returns true only if the field is both invalid and has been interacted with.
     */
    hasError(fieldName: string): boolean {
        const field = this.filterForm.get(fieldName)
        return !!(field && field.invalid && (field.dirty || field.touched))
    }

    toggleOrgDropdown(): void {
        const open = !this.orgDropdownOpen()
        this.orgDropdownOpen.set(open)
        if (open) {
            this.orgSearchTerm.set('')
            this.filteredOrganizations.set([...this.organizations()])
            setTimeout(() => (this.elRef.nativeElement.querySelector('.org-search-input') as HTMLInputElement)?.focus(), PLAYLIST_UI.FOCUS_DELAY_MS)
        }
        this.filterForm.get('orgId')?.markAsTouched()
    }

    selectOrg(value: string): void {
        this.filterForm.get('orgId')?.setValue(value)
        this.filterForm.get('orgId')?.markAsTouched()
        this.orgDropdownOpen.set(false)
    }

    togglePositionDropdown(): void {
        this.positionDropdownOpen.set(!this.positionDropdownOpen())
        this.filterForm.get('role')?.markAsTouched()
    }

    isRoleSelected(value: string): boolean {
        return this.selectedRoles.includes(value)
    }

    toggleRole(value: string): void {
        const current = [...this.selectedRoles]
        const idx = current.indexOf(value)
        if (idx === -1) current.push(value)
        else current.splice(idx, 1)
        this.filterForm.get('role')?.setValue(current)
        this.filterForm.get('role')?.markAsTouched()
    }

}
