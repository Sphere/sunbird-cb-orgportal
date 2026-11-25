import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { Router } from '@angular/router'
import { of, throwError } from 'rxjs'
import { PlaylistFiltersComponent } from './playlist-filters.component'
import { PlaylistApiService, PlaylistType } from '../../services/playlist-api.service'
import { PlaylistStateService } from '../../services/playlist-state.service'
import { PLAYLIST_ROUTES } from '../../constants/playlist.constants'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('PlaylistFiltersComponent', () => {
  let component: PlaylistFiltersComponent
  let fixture: ComponentFixture<PlaylistFiltersComponent>
  let mockPlaylistApi: jest.Mocked<PlaylistApiService>
  let mockState: jest.Mocked<PlaylistStateService>
  let mockRouter: jest.Mocked<Router>

  const configureTestingModule = async () => {
    await TestBed.configureTestingModule({
      imports: [PlaylistFiltersComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: PlaylistApiService, useValue: mockPlaylistApi },
        { provide: PlaylistStateService, useValue: mockState },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(PlaylistFiltersComponent)
    component = fixture.componentInstance
  }

  beforeEach(() => {
    mockPlaylistApi = createSpyObj('PlaylistApiService', [
      'searchOrganizations',
      'searchPositions',
      'searchPlaylist',
      'extractCourseIds',
      'extractCompetencyIds',
      'extractCompetencyCodes',
    ])
    mockState = createSpyObj('PlaylistStateService', [
      'getFilters',
      'clearCourseCache',
      'clearSelectedCompetencies',
      'setFilters',
      'setExistingPlaylist',
      'setExistingCourseIds',
      'setExistingCompetencyPlaylist',
      'setExistingCompetencyIds',
      'setExistingCompetencyCodes',
      'setExistingSearchPlaylist',
    ])
    mockRouter = createSpyObj('Router', ['navigate'])

    mockState.getFilters.mockReturnValue(null)
    mockPlaylistApi.searchOrganizations.mockReturnValue(of([{ value: 'o1', label: 'Org One' }]) as any)
    mockPlaylistApi.searchPositions.mockReturnValue(of([{ value: 'p1', label: 'Pos One' }]) as any)
    mockPlaylistApi.searchPlaylist.mockReturnValue(of([]) as any)
    mockPlaylistApi.extractCourseIds.mockReturnValue([])
    mockPlaylistApi.extractCompetencyIds.mockReturnValue([])
    mockPlaylistApi.extractCompetencyCodes.mockReturnValue([])
  })

  it('should create and load organizations and positions on init', async () => {
    await configureTestingModule()
    fixture.detectChanges()

    expect(component).toBeTruthy()
    expect(mockPlaylistApi.searchOrganizations).toHaveBeenCalled()
    expect(mockPlaylistApi.searchPositions).toHaveBeenCalled()
    expect(component.organizations()).toEqual([{ value: 'o1', label: 'Org One' }])
    expect(component.filteredOrganizations()).toEqual([{ value: 'o1', label: 'Org One' }])
    expect(component.positions()).toEqual([{ value: 'p1', label: 'Pos One' }])
    expect(component.loadingOrganizations()).toBe(false)
    expect(component.loadingPositions()).toBe(false)
  })

  it('should handle error while loading organizations', async () => {
    mockPlaylistApi.searchOrganizations.mockReturnValue(throwError({ message: 'boom' }))
    await configureTestingModule()
    fixture.detectChanges()

    expect(component.loadingOrganizations()).toBe(false)
    expect(component.organizations()).toEqual([])
  })

  it('should handle error while loading positions and reset to empty', async () => {
    mockPlaylistApi.searchPositions.mockReturnValue(throwError({ message: 'boom' }))
    await configureTestingModule()
    fixture.detectChanges()

    expect(component.loadingPositions()).toBe(false)
    expect(component.positions()).toEqual([])
  })

  it('should restore previously saved filters', async () => {
    mockState.getFilters.mockReturnValue({
      orgId: 'org1',
      role: ['r1'],
      district: ['d1'],
      language: 'en',
    } as any)
    await configureTestingModule()
    fixture.detectChanges()

    expect(component.filterForm.getRawValue().orgId).toBe('org1')
    expect(component.filterForm.getRawValue().role).toEqual(['r1'])
    expect(component.filterForm.getRawValue().district).toBe('d1')
    expect(component.filterForm.getRawValue().language).toBe('en')
  })

  it('should default district to empty string when not present in saved filters', async () => {
    mockState.getFilters.mockReturnValue({ orgId: 'org1', role: [], language: 'en' } as any)
    await configureTestingModule()
    fixture.detectChanges()

    expect(component.filterForm.getRawValue().district).toBe('')
  })

  it('should track selectedOrgId when orgId control changes', async () => {
    await configureTestingModule()
    fixture.detectChanges()

    component.filterForm.controls.orgId.setValue('org2')
    expect(component.selectedOrgId()).toBe('org2')
  })

  describe('filterOrganizations', () => {
    beforeEach(async () => {
      mockPlaylistApi.searchOrganizations.mockReturnValue(of([
        { value: 'o1', label: 'Alpha Org' },
        { value: 'o2', label: 'Beta Org' },
      ]) as any)
      await configureTestingModule()
      fixture.detectChanges()
    })

    it('should show all organizations when search term is blank', () => {
      component.orgSearchTerm.set('  ')
      component.filterOrganizations()
      expect(component.filteredOrganizations().length).toBe(2)
    })

    it('should filter organizations by label', () => {
      component.orgSearchTerm.set('alpha')
      component.filterOrganizations()
      expect(component.filteredOrganizations().length).toBe(1)
      expect(component.filteredOrganizations()[0].value).toBe('o1')
    })
  })

  describe('hasError', () => {
    beforeEach(async () => {
      await configureTestingModule()
      fixture.detectChanges()
    })

    it('should be false when field is untouched even if invalid', () => {
      expect(component.hasError('orgId')).toBe(false)
    })

    it('should be true when field is invalid and touched', () => {
      component.filterForm.get('orgId')?.markAsTouched()
      expect(component.hasError('orgId')).toBe(true)
    })

    it('should be false for unknown field name', () => {
      expect(component.hasError('unknown')).toBe(false)
    })
  })

  describe('dropdown toggles', () => {
    beforeEach(async () => {
      await configureTestingModule()
      fixture.detectChanges()
    })

    it('toggleOrgDropdown should open dropdown and reset search term', () => {
      component.orgDropdownOpen.set(false)
      component.toggleOrgDropdown()
      expect(component.orgDropdownOpen()).toBe(true)
      expect(component.orgSearchTerm()).toBe('')
      expect(component.filterForm.get('orgId')?.touched).toBe(true)
    })

    it('toggleOrgDropdown should close when already open', () => {
      component.orgDropdownOpen.set(true)
      component.toggleOrgDropdown()
      expect(component.orgDropdownOpen()).toBe(false)
    })

    it('selectOrg should set orgId value and close dropdown', () => {
      component.orgDropdownOpen.set(true)
      component.selectOrg('org9')
      expect(component.filterForm.get('orgId')?.value).toBe('org9')
      expect(component.filterForm.get('orgId')?.touched).toBe(true)
      expect(component.orgDropdownOpen()).toBe(false)
    })

    it('togglePositionDropdown should flip open state and touch role control', () => {
      component.positionDropdownOpen.set(false)
      component.togglePositionDropdown()
      expect(component.positionDropdownOpen()).toBe(true)
      expect(component.filterForm.get('role')?.touched).toBe(true)
      component.togglePositionDropdown()
      expect(component.positionDropdownOpen()).toBe(false)
    })
  })

  describe('role selection', () => {
    beforeEach(async () => {
      await configureTestingModule()
      fixture.detectChanges()
    })

    it('isRoleSelected should reflect current role values', () => {
      component.filterForm.get('role')?.setValue(['r1'])
      expect(component.isRoleSelected('r1')).toBe(true)
      expect(component.isRoleSelected('r2')).toBe(false)
    })

    it('toggleRole should add role when not present', () => {
      component.filterForm.get('role')?.setValue([])
      component.toggleRole('r1')
      expect(component.filterForm.get('role')?.value).toEqual(['r1'])
    })

    it('toggleRole should remove role when already present', () => {
      component.filterForm.get('role')?.setValue(['r1', 'r2'])
      component.toggleRole('r1')
      expect(component.filterForm.get('role')?.value).toEqual(['r2'])
    })
  })

  describe('onDocumentClick', () => {
    beforeEach(async () => {
      await configureTestingModule()
      fixture.detectChanges()
    })

    it('should close both dropdowns when click is outside all wrappers', () => {
      component.orgDropdownOpen.set(true)
      component.positionDropdownOpen.set(true)
      jest.spyOn(component['elRef'].nativeElement, 'querySelectorAll').mockReturnValue([] as any)

      component.onDocumentClick({ target: document.createElement('div') } as unknown as MouseEvent)

      expect(component.orgDropdownOpen()).toBe(false)
      expect(component.positionDropdownOpen()).toBe(false)
    })

    it('should keep org dropdown open when click is inside an org wrapper', () => {
      component.orgDropdownOpen.set(true)
      component.positionDropdownOpen.set(true)
      const target = document.createElement('div')
      const orgPanel = document.createElement('div')
      orgPanel.className = 'org-panel'
      const wrapper = {
        contains: (node: Node) => node === target,
        querySelector: (sel: string) => (sel === '.org-panel' ? orgPanel : null),
      }
      jest.spyOn(component['elRef'].nativeElement, 'querySelectorAll').mockReturnValue([wrapper] as any)

      component.onDocumentClick({ target } as unknown as MouseEvent)

      expect(component.orgDropdownOpen()).toBe(true)
      expect(component.positionDropdownOpen()).toBe(false)
    })
  })

  describe('onContinue', () => {
    beforeEach(async () => {
      await configureTestingModule()
      fixture.detectChanges()
    })

    it('should mark all as touched and not proceed when form invalid', async () => {
      await component.onContinue()

      expect(component.filterForm.get('orgId')?.touched).toBe(true)
      expect(mockState.setFilters).not.toHaveBeenCalled()
      expect(mockRouter.navigate).not.toHaveBeenCalled()
    })

    it('should search playlists and navigate to summary on success', async () => {
      component.filterForm.patchValue({ orgId: 'org1', role: ['r1'], language: 'en' })
      mockPlaylistApi.searchPlaylist.mockImplementation((_filters: any, type: PlaylistType) => {
        if (type === PlaylistType.COURSE) return of([{ id: 'course1' }]) as any
        if (type === PlaylistType.COMPETENCY) return of([{ id: 'comp1' }]) as any
        if (type === PlaylistType.SEARCH) return of([{ id: 'search1' }]) as any
        return of([]) as any
      })
      mockPlaylistApi.extractCourseIds.mockReturnValue(['c1'])
      mockPlaylistApi.extractCompetencyIds.mockReturnValue(['comp-id'])
      mockPlaylistApi.extractCompetencyCodes.mockReturnValue(['CODE1'])

      await component.onContinue()

      expect(mockState.clearCourseCache).toHaveBeenCalled()
      expect(mockState.clearSelectedCompetencies).toHaveBeenCalled()
      expect(mockState.setFilters).toHaveBeenCalled()
      expect(mockState.setExistingPlaylist).toHaveBeenCalledWith({ id: 'course1' })
      expect(mockState.setExistingCompetencyPlaylist).toHaveBeenCalledWith({ id: 'comp1' })
      expect(mockState.setExistingSearchPlaylist).toHaveBeenCalledWith({ id: 'search1' })
      expect(mockRouter.navigate).toHaveBeenCalledWith([PLAYLIST_ROUTES.HOME_SUMMARY])
      expect(component.loading()).toBe(false)
    })

    it('should continue without ASKME playlist when that search fails', async () => {
      component.filterForm.patchValue({ orgId: 'org1', role: ['r1'], language: 'en' })
      mockPlaylistApi.searchPlaylist.mockImplementation((_filters: any, type: PlaylistType) => {
        if (type === PlaylistType.ASKME_COURSE) return throwError({ message: 'askme fail' })
        return of([]) as any
      })

      await component.onContinue()

      expect(mockRouter.navigate).toHaveBeenCalledWith([PLAYLIST_ROUTES.HOME_SUMMARY])
      expect(component.errorMessage()).toBe('')
    })

    it('should set org name from matched organization label', async () => {
      component.organizations.set([{ value: 'org1', label: 'My Org' }])
      component.filterForm.patchValue({ orgId: 'org1', role: ['r1'], language: 'en' })

      await component.onContinue()

      expect(mockState.setFilters).toHaveBeenCalledWith(expect.objectContaining({ orgName: 'My Org' }))
    })

    it('should show error message when the main search fails', async () => {
      component.filterForm.patchValue({ orgId: 'org1', role: ['r1'], language: 'en' })
      mockPlaylistApi.searchPlaylist.mockImplementation((_filters: any, type: PlaylistType) => {
        if (type === PlaylistType.COURSE) return throwError({ message: 'boom' })
        return of([]) as any
      })

      await component.onContinue()

      expect(component.errorMessage()).toBe('Failed to load playlist data. Please try again.')
      expect(component.loading()).toBe(false)
      expect(mockRouter.navigate).not.toHaveBeenCalled()
    })
  })
})
