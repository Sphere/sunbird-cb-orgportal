import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, ViewEncapsulation } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router } from '@angular/router'
import { take } from 'rxjs/operators'
import { CommonModule } from '@angular/common'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSelectModule } from '@angular/material/select'
import { MatOptionModule } from '@angular/material/core'
import { PlaylistApiService, PlaylistType } from '../../services/playlist-api.service'
import { PlaylistStateService } from '../../services/playlist-state.service'
import { PlaylistFilters } from '../../models/playlist.model'

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
    imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatOptionModule],
})
export class PlaylistFiltersComponent implements OnInit {
    filterForm!: FormGroup<FilterForm>
    readonly loading = signal(false)
    readonly errorMessage = signal('')

    /** Dropdown options - Organizations loaded from API */
    organizations: { value: string, label: string }[] = []
    filteredOrganizations: { value: string, label: string }[] = []
    readonly loadingOrganizations = signal(false)
    readonly loadingPositions = signal(false)
    orgSearchTerm = ''

    positions: { value: string, label: string }[] = []

    districts = []

    blocks = []

    languages = [
        { value: 'en', label: 'English' },
        { value: 'hi', label: 'Hindi' },
        { value: 'kn', label: 'Kannada' },
        { value: 'tn', label: 'Tamil' },
    ]

    private readonly destroyRef = inject(DestroyRef)

    constructor(
        private fb: NonNullableFormBuilder,
        private router: Router,
        private playlistApi: PlaylistApiService,
        private state: PlaylistStateService
    ) { }

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
                this.organizations = orgs
                this.filteredOrganizations = [...orgs]
                this.loadingOrganizations.set(false)
            },
            error: (err) => {
                console.error('Failed to load organizations:', err)
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
                this.positions = positions
                this.loadingPositions.set(false)
            },
            error: (err) => {
                console.error('Failed to load positions:', err)
                this.positions = []
                this.loadingPositions.set(false)
            },
        })
    }

    /** 
     * Filters the organization dropdown results based on user input.
     * Performs a case-insensitive search to help users find their organization quickly.
     */
    filterOrganizations(): void {
        if (!this.orgSearchTerm.trim()) {
            this.filteredOrganizations = [...this.organizations]
        } else {
            const search = this.orgSearchTerm.toLowerCase()
            this.filteredOrganizations = this.organizations.filter(org =>
                org.label.toLowerCase().includes(search)
            )
        }
    }

    /**
     * Initialize reactive form with validation
     */
    private initForm(): void {
        this.filterForm = this.fb.group<FilterForm>({
            orgId: this.fb.control('', Validators.required),
            role: this.fb.control<string[]>([], Validators.required),
            district: this.fb.control(''),
            block: this.fb.control(''),
            language: this.fb.control('', Validators.required),
        })
    }

    /**
     * Load previously selected filters from state (if user navigated back)
     */
    private loadPreviousFilters(): void {
        const previousFilters = this.state.getFilters()
        if (previousFilters) {
            this.filterForm.patchValue({
                orgId: previousFilters.orgId,
                role: previousFilters.role,
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
            role: rawValue.role,
            district: rawValue.district ? [rawValue.district] : undefined,
            language: rawValue.language,
        }

        // Add org name for display purposes
        const selectedOrg = this.organizations.find(org => org.value === filters.orgId)
        filters.orgName = selectedOrg?.label || filters.orgId

        this.loading.set(true)
        this.errorMessage.set('')

        try {
            // Clear course cache to ensure fresh data is fetched with new filters
            this.state.clearCourseCache()

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

            // Navigate to summary page
            this.router.navigate(['/app/home/playlist/summary'])
        } catch (error) {
            console.error('Error searching playlist:', error)
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

    onOrgDropdownToggle(isOpen: boolean): void {
        if (!isOpen) {
            return
        }

        // Focus search box when overlay is mounted.
        setTimeout(() => {
            const input = document.querySelector('.cdk-overlay-pane .org-dropdown .org-search-input') as HTMLInputElement | null
            input?.focus()
        }, 50)
    }
}
