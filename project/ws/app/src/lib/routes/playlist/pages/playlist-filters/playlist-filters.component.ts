import { Component, OnInit, ViewEncapsulation } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { Router } from '@angular/router'
import { PlaylistApiService } from '../../services/playlist-api.service'
import { PlaylistStateService } from '../../services/playlist-state.service'
import { PlaylistFilters } from '../../models/playlist.model'

@Component({
    selector: 'app-playlist-filters',
    templateUrl: './playlist-filters.component.html',
    styleUrls: ['./playlist-filters.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class PlaylistFiltersComponent implements OnInit {
    filterForm!: FormGroup
    loading = false
    errorMessage = ''

    /**
     * Dropdown options for organizations
     * Note: Currently using hardcoded values. In future, can be loaded from API or configuration file.
     */
    organizations = [
        { value: '0142443633580769283117', label: 'BNRC' },
        { value: 'MOHFW', label: 'Ministry of Health and Family Welfare' },
    ]

    positions = [
        { value: 'ANM', label: 'ANM' },
        { value: 'MPW', label: 'MPW' },
        { value: 'NURSE', label: 'Nurse' },
        { value: 'MEDICAL OFFICER-UP', label: 'Medical Officer - UP' },
    ]

    districts = [
        { value: 'district1', label: 'District 1' },
        { value: 'district2', label: 'District 2' },
    ]

    blocks = [
        { value: 'block1', label: 'Block 1' },
        { value: 'block2', label: 'Block 2' },
    ]

    languages = [
        { value: 'en', label: 'English' },
        { value: 'hi', label: 'Hindi' },
        { value: 'ta', label: 'Tamil' },
    ]

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private playlistApi: PlaylistApiService,
        private state: PlaylistStateService
    ) { }

    ngOnInit(): void {
        this.initForm()
        this.loadPreviousFilters()
    }

    /**
     * Initialize reactive form with validation
     */
    private initForm(): void {
        this.filterForm = this.fb.group({
            orgId: ['', Validators.required],
            role: [[], Validators.required],
            district: [''],
            block: [''],
            language: ['', Validators.required],
        })
    }

    /**
     * Load previously selected filters from state (if user navigated back)
     */
    private loadPreviousFilters(): void {
        const previousFilters = this.state.getFilters()
        if (previousFilters) {
            this.filterForm.patchValue(previousFilters)
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

        const filters: PlaylistFilters = this.filterForm.value

        // Ensure role is an array
        if (!Array.isArray(filters.role)) {
            filters.role = [filters.role]
        }

        this.loading = true
        this.errorMessage = ''

        try {
            // Clear course cache to ensure fresh data is fetched with new filters
            this.state.clearCourseCache()

            // Save filters to state
            this.state.setFilters(filters)

            console.log('🔍 Calling playlist search API with filters:', filters)

            // Search for existing playlists
            const playlists = await this.playlistApi.searchPlaylist(filters).toPromise()

            console.log('📦 Playlist API Response:', playlists)
            console.log('📦 Number of playlists found:', playlists?.length || 0)

            // Store the first playlist object (if exists) for update API
            const existingPlaylist = playlists && playlists.length > 0 ? playlists[0] : null
            this.state.setExistingPlaylist(existingPlaylist)

            // Extract existing course IDs if playlist exists
            const existingCourseIds = this.playlistApi.extractCourseIds(playlists || [])

            console.log('📋 Extracted course IDs:', existingCourseIds)
            console.log('📋 Total unique course IDs:', existingCourseIds.length)

            this.state.setExistingCourseIds(existingCourseIds)

            // Navigate to summary page
            this.router.navigate(['/app/home/playlist/summary'])
        } catch (error) {
            console.error('❌ Error searching playlist:', error)
            this.errorMessage = 'Failed to load playlist data. Please try again.'
        } finally {
            this.loading = false
        }
    }

    /**
     * Check if form field has error
     */
    hasError(fieldName: string): boolean {
        const field = this.filterForm.get(fieldName)
        return !!(field && field.invalid && (field.dirty || field.touched))
    }
}
