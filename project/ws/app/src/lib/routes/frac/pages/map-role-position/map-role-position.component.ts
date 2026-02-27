import { Component, OnDestroy, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { Router } from '@angular/router'
import { forkJoin, of, Subject } from 'rxjs'
import { catchError, debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs/operators'
import { MappingRequiredModalComponent, MissingMappingItem } from '../../components/mapping-required-modal/mapping-required-modal.component'
import { UploadResultData, UploadResultModalComponent } from '../../components/upload-result-modal/upload-result-modal.component'
import { UnsavedChangesModalComponent } from '../../components/unsaved-changes-modal/unsaved-changes-modal.component'
import { CustomSnackbarService } from '../../services/custom-snackbar.service'
import { FracApiService } from '../../services/frac-api.service'
import { transformRoles, transformPositions, extractEntityList, makeMappingKey, getCodeFromKey } from '../../utils/common.util'
import { fracLogger } from '../../utils/frac-logger.util'
import { FRAC_UI_CONFIG } from '../../models/ui.config.model'
import { FRAC_DEBOUNCE_MS, FRAC_DIALOG_SIZES, FRAC_LANGUAGES, FRAC_MAP_PAGE_SPINNER, FRAC_ROUTES } from '../../constants/frac.constants'

interface PositionRoleDetail {
  code: string
  label: string
}

interface PositionItem {
  code: string
  title: string
  expanded?: boolean
  roleDetails?: PositionRoleDetail[]
}

interface RoleItem {
  code: string
  title: string
}

interface PositionRoleApiRequestItem {
  parentEntityType: 'Position'
  parentEntityCode: string
  childEntityType: 'Role'
  childEntityCode: string
  competencies: Array<number | string | Record<string, unknown>>
}

interface PositionMappingHierarchyNode {
  entityType?: string
  entityCode?: string
  entityName?: string
}

interface PositionMappingSearchResultItem {
  childHierarchy?: PositionMappingHierarchyNode[]
}

interface PositionMappingSearchResponseShape {
  result?: PositionMappingSearchResultItem[]
}

@Component({
  selector: 'ws-app-map-role-position',
  templateUrl: './map-role-position.component.html',
  styleUrls: ['./map-role-position.component.scss'],
})
export class MapRolePositionComponent implements OnInit, OnDestroy {

  constructor(
    private snackbar: CustomSnackbarService,
    private fracApiService: FracApiService,
    private dialog: MatDialog,
    private router: Router,
  ) { }

  // language
  readonly uiConfig = FRAC_UI_CONFIG
  readonly routes = FRAC_ROUTES
  readonly mapPageSpinner = FRAC_MAP_PAGE_SPINNER

  readonly languages: string[] = [...FRAC_LANGUAGES]
  selectedLanguage = 'English'
  isOpen = false
  isEditing = true
  isSaving = false
  isPositionsLoading = false
  isRolesLoading = false
  isPositionRoleMappingLoading = false
  isValidatingRoleMappings = false
  hasUnsavedChanges = false

  // left – positions
  positionsData: PositionItem[] = []
  positions: PositionItem[] = []
  filteredPositions: PositionItem[] = []
  selectedPosition: PositionItem | null = null
  expandedPosition: PositionItem | null = null

  // right – roles
  rolesData: RoleItem[] = []
  roles: RoleItem[] = []
  filteredRoles: RoleItem[] = []

  // selection state (for current selectedPosition)
  selectedRoleMap: { [roleCode: string]: boolean } = {}
  selectedRoleSummary: PositionRoleDetail[] = []

  // positions that have mapping changes
  updatedPositions: PositionItem[] = []

  positionSearchTerm = ''
  roleSearchTerm = ''
  searchResetKey = 0

  private positionSearch$ = new Subject<string>()
  private roleSearch$ = new Subject<string>()
  private destroy$ = new Subject<void>()
  private readonly positionRoleMappingCache = new Map<string, PositionRoleDetail[]>()
  private readonly positionDraftStore = new Map<string, PositionRoleDetail[]>()
  private activePositionRoleMappingRequestKey: string | null = null
  private readonly positionBaseLanguage = FRAC_LANGUAGES[0]

  /**
   * Runs once when the page loads. Sets up search listeners and checks the URL to see if we are in upload or manage mode.
   */
  ngOnInit(): void {
    this.setupSearchStreams()
    this.resetInitialView()
    this.fetchPositions('')
  }

  /**
   * Cleans up memory and active background tasks when the user leaves this page.
   */
  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  /**
   * Initializes the search bars to wait 500ms after the user stops typing before making a backend request.
   */
  private setupSearchStreams(): void {
    this.positionSearch$
      .pipe(
        debounceTime(FRAC_DEBOUNCE_MS.searchInput),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(keyword => this.fetchPositions(keyword))

    this.roleSearch$
      .pipe(
        debounceTime(FRAC_DEBOUNCE_MS.searchInput),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(keyword => this.fetchRoles(keyword))
  }

  /**
   * Resets all component variables back to their blank, starting state.
   */
  private resetInitialView(): void {
    this.searchResetKey += 1
    this.positionSearchTerm = ''
    this.roleSearchTerm = ''
    this.hasUnsavedChanges = false
    this.isPositionsLoading = false
    this.isRolesLoading = false
    this.isPositionRoleMappingLoading = false
    this.isValidatingRoleMappings = false
    this.activePositionRoleMappingRequestKey = null

    this.positionsData = []
    this.positions = []
    this.filteredPositions = []
    this.rolesData = []
    this.roles = []
    this.filteredRoles = []

    this.selectedPosition = null
    this.expandedPosition = null
    this.selectedRoleMap = {}
    this.selectedRoleSummary = []
    this.updatedPositions = []

    this.positionRoleMappingCache.clear()
    this.positionDraftStore.clear()
  }

  // ---------------------------------------------------------------------------
  // API search
  // ---------------------------------------------------------------------------

  /**
   * Fetches the list of positions from the backend based on the search keyword.
   */
  private fetchPositions(keyword: string): void {
    this.isPositionsLoading = true
    this.fracApiService.searchEntities('position', keyword, this.positionBaseLanguage).subscribe({
      next: (res) => {
        this.isPositionsLoading = false
        const apiEntity = extractEntityList(res)
        const transformed = transformPositions(apiEntity) as PositionItem[]
        const hydrated = transformed.map((position) => {
          const details = this.getHydratedPositionRoleDetails(position.code)
          return details ? { ...position, roleDetails: details } : position
        })

        this.positionsData = hydrated
        this.positions = [...hydrated]
        this.filteredPositions = [...hydrated]

        if (this.selectedPosition) {
          const hasSearchKeyword = !!keyword.trim()
          const matched = hydrated.find(p => p.code === this.selectedPosition!.code)
          if (!matched) {
            if (hasSearchKeyword) {
              return
            }
            this.selectedPosition = null
            this.selectedRoleMap = {}
            this.selectedRoleSummary = []
          } else {
            this.selectedPosition = matched
            this.applyMappedRolesToPosition(matched, matched.roleDetails || [])
          }
        }
      },
      error: (e) => {
        this.isPositionsLoading = false
        fracLogger.error('Failed to load positions', e)
        this.positionsData = []
        this.positions = []
        this.filteredPositions = []
      },
    })
  }

  /**
   * Fetches the list of roles from the backend based on the search keyword.
   */
  private fetchRoles(keyword: string): void {
    this.isRolesLoading = true
    this.fracApiService.searchEntities('role', keyword, this.selectedLanguage).subscribe({
      next: (res) => {
        this.isRolesLoading = false
        const apiEntity = extractEntityList(res)
        const transformed = transformRoles(apiEntity) as RoleItem[]

        this.rolesData = transformed
        this.roles = [...transformed]
        this.filteredRoles = [...transformed]

        this.buildSelectedRoleSummary()
      },
      error: (e) => {
        this.isRolesLoading = false
        fracLogger.error('Failed to load roles', e)
        this.rolesData = []
        this.roles = []
        this.filteredRoles = []
      },
    })
  }


  // ---------------------------------------------------------------------------
  // Language dropdown
  // ---------------------------------------------------------------------------
  /**
   * Opens or closes the language selection dropdown menu.
   */
  toggleDropdown(): void {
    this.isOpen = !this.isOpen
  }

  /**
   * Changes the selected language and fetches new data for that language if in manage mode.
   */
  selectLanguage(lang: string, event: MouseEvent): void {
    event.stopPropagation()
    if (!this.languages.includes(lang)) return
    if (this.selectedLanguage === lang) {
      this.isOpen = false
      return
    }

    this.selectedLanguage = lang
    this.isOpen = false
    this.resetInitialView()
    this.fetchPositions('')
  }

  // ---------------------------------------------------------------------------
  // Positions (left pane)
  // ---------------------------------------------------------------------------
  onPositionSearch(keyword: string): void {
    this.positionSearchTerm = keyword.trim()
    this.positionSearch$.next(this.positionSearchTerm)
  }

  /**
   * Fires an immediate search request when the user presses Enter in the position search box.
   */
  onPositionSearchSubmit(keyword: string): void {
    this.positionSearchTerm = keyword.trim()
    this.fetchPositions(this.positionSearchTerm)
  }

  /**
   * Sets a position card as the active focus in the UI.
   */
  onPositionSelected(position: PositionItem): void {
    this.selectedPosition = position
    this.selectedRoleMap = {}
    this.selectedRoleSummary = []
    this.roleSearchTerm = ''
    this.searchResetKey += 1
    this.loadPositionRoleMappings(position)
  }

  /**
   * Toggles a position card open or closed, triggering a fetch for its children if opening.
   */
  onPositionToggleExpand(position: PositionItem): void {
    this.expandedPosition = this.expandedPosition === position ? null : position
  }

  /**
   * Triggers a backend request to find mapped roles when a user expands a position card.
   */
  private loadPositionRoleMappings(position: PositionItem): void {
    const requestKey = this.buildPositionMappingKey(position.code)
    this.isPositionRoleMappingLoading = true

    const draft = this.positionDraftStore.get(requestKey)
    if (draft) {
      this.applyMappedRolesToPosition(position, draft)
      this.isPositionRoleMappingLoading = false
      return
    }

    const cached = this.positionRoleMappingCache.get(requestKey)
    if (cached) {
      this.applyMappedRolesToPosition(position, cached)
      this.isPositionRoleMappingLoading = false
      return
    }

    if (this.activePositionRoleMappingRequestKey === requestKey) {
      this.isPositionRoleMappingLoading = false
      return
    }

    this.activePositionRoleMappingRequestKey = requestKey

    this.fracApiService.searchEntityMapping('position', position.code, this.positionBaseLanguage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (this.activePositionRoleMappingRequestKey === requestKey) {
            this.activePositionRoleMappingRequestKey = null
          }

          if (this.selectedPosition?.code !== position.code || this.buildPositionMappingKey(position.code) !== requestKey) {
            return
          }
          this.isPositionRoleMappingLoading = false
          const mappedRoles = this.extractMappedRoles(res)
          this.positionRoleMappingCache.set(requestKey, this.cloneRoleDetails(mappedRoles))
          this.applyMappedRolesToPosition(position, mappedRoles)
        },
        error: (err) => {
          if (this.activePositionRoleMappingRequestKey === requestKey) {
            this.activePositionRoleMappingRequestKey = null
          }

          if (this.selectedPosition?.code !== position.code || this.buildPositionMappingKey(position.code) !== requestKey) {
            return
          }
          this.isPositionRoleMappingLoading = false
          fracLogger.error('Failed to load position mappings', err)
          this.selectedRoleMap = {}
          this.selectedRoleSummary = []
          this.snackbar.error('Unable to fetch existing position mappings.')
        },
      })
  }

  /**
   * Reads the complex API mapping response to build a simple list of connected roles.
   */
  private extractMappedRoles(response: unknown): PositionRoleDetail[] {
    const result = Array.isArray((response as PositionMappingSearchResponseShape)?.result)
      ? (response as PositionMappingSearchResponseShape).result || []
      : []
    const first = result[0] || {}
    const childHierarchy = Array.isArray(first?.childHierarchy) ? first.childHierarchy : []

    return childHierarchy
      .filter((child: PositionMappingHierarchyNode) => (child?.entityType || '').toLowerCase() === 'role')
      .map((child: PositionMappingHierarchyNode) => ({
        code: (child?.entityCode || '').trim(),
        label: child?.entityName || '',
      }))
      .filter((item: PositionRoleDetail) => !!item.code)
  }

  /**
   * Attaches the fetched role connections to the position card so it can display the "Mapped: X" badge.
   */
  private applyMappedRolesToPosition(position: PositionItem, mappedRoles: PositionRoleDetail[]): void {
    const roleDetails: PositionRoleDetail[] = mappedRoles.map((mapped) => ({
      code: mapped.code,
      label: mapped.label || '',
    }))

    this.applyPositionDetailsToCollections(position.code, position.title, roleDetails)

    if (this.selectedPosition?.code === position.code) {
      this.selectedPosition = {
        ...this.selectedPosition,
        roleDetails: this.cloneRoleDetails(roleDetails),
      }
    }

    position.roleDetails = roleDetails
    this.selectedRoleMap = {}
    roleDetails.forEach((detail) => {
      this.selectedRoleMap[detail.code] = true
    })
    this.selectedRoleSummary = [...roleDetails]

    const shouldKeepSearchedList = !!this.roleSearchTerm
    if (shouldKeepSearchedList) {
      this.roleSearch$.next(this.roleSearchTerm)
      return
    }

    const mappedList: RoleItem[] = roleDetails.map((role) => ({
      code: role.code,
      title: role.label,
    }))
    this.rolesData = [...mappedList]
    this.roles = [...mappedList]
    this.filteredRoles = [...mappedList]
  }

  // ---------------------------------------------------------------------------
  // Roles (right pane)
  // ---------------------------------------------------------------------------
  onRoleSearch(keyword: string): void {
    this.roleSearchTerm = keyword.trim()
    this.roleSearch$.next(this.roleSearchTerm)
  }

  onRoleCheckChanged(event: { code: string; checked: boolean }): void {
    const { code, checked } = event
    if (!code) return

    if (checked) {
      this.selectedRoleMap[code] = true
    } else {
      delete this.selectedRoleMap[code]
    }

    this.buildSelectedRoleSummary()
  }

  private buildSelectedRoleSummary(): void {
    const result: PositionRoleDetail[] = []

    for (const code of Object.keys(this.selectedRoleMap)) {
      if (!this.selectedRoleMap[code]) continue
      const meta = this.rolesData.find(r => r.code === code)
      const existing = this.selectedPosition?.roleDetails?.find(r => r.code === code)
      result.push({
        code,
        label: meta?.title || existing?.label || '',
      })
    }

    this.selectedRoleSummary = result
  }

  // ---------------------------------------------------------------------------
  // Add Roles → Position (button)
  // ---------------------------------------------------------------------------
  onAddRoleToPosition(): void {
    if (!this.selectedPosition) {
      this.snackbar.warning('Please select a position first !!')
      return
    }

    const hasSelected = Object.keys(this.selectedRoleMap).length > 0
    const positionAlreadyHadRoles = !!this.selectedPosition.roleDetails?.length

    if (!hasSelected && !positionAlreadyHadRoles) {
      this.snackbar.warning('Please select at least one role to map !!')
      return
    }

    // ensure the property exists
    if (!this.selectedPosition.roleDetails) {
      this.selectedPosition.roleDetails = []
    }

    // Rebuild summarised selection
    this.buildSelectedRoleSummary()

    // Validate selected roles before assigning them to position.
    this.validateAndApplyPositionRoleMappings()
  }

  private validateAndApplyPositionRoleMappings(): void {
    if (!this.selectedPosition) {
      return
    }
    if (this.isValidatingRoleMappings) {
      return
    }

    const previousSignature = this.getPositionRoleDetailsSignature(this.selectedPosition.roleDetails || [])
    const selectedRoles = [...this.selectedRoleSummary]

    if (!selectedRoles.length) {
      this.removeDeselectedRoles()
      this.updateOrInsertRoles()
      this.refreshPositionsState()
      const currentSignature = this.getPositionRoleDetailsSignature(this.selectedPosition.roleDetails || [])
      const hasChanges = previousSignature !== currentSignature
      this.hasUnsavedChanges = this.hasUnsavedChanges || hasChanges
      this.snackbar.success('Position–Role linked successfully. Please tap Save to apply changes.')
      return
    }

    this.isValidatingRoleMappings = true
    this.findRolesMissingActivityMapping(selectedRoles)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (missingRoles) => {
          this.isValidatingRoleMappings = false
          if (missingRoles.length) {
            this.snackbar.warning('Some selected roles are missing activity mapping.')
            this.openMappingRequiredModal(missingRoles)
            return
          }

          this.removeDeselectedRoles()
          this.updateOrInsertRoles()
          this.refreshPositionsState()
          const currentSignature = this.getPositionRoleDetailsSignature(this.selectedPosition?.roleDetails || [])
          const hasChanges = previousSignature !== currentSignature
          this.hasUnsavedChanges = this.hasUnsavedChanges || hasChanges
          this.snackbar.success('Position–Role linked successfully. Please tap Save to apply changes.')
        },
        error: (err) => {
          this.isValidatingRoleMappings = false
          fracLogger.error('Failed to validate role activity mappings', err)
          this.snackbar.error('Unable to validate role activity mappings. Please try again.')
        },
      })
  }

  private findRolesMissingActivityMapping(roles: PositionRoleDetail[]) {
    const requests = roles.map((role) =>
      this.fracApiService.searchEntityMapping('role', role.code, this.selectedLanguage).pipe(
        map((res) => ({
          role,
          isMapped: this.hasMappedActivityLevels(res),
        })),
        catchError(() => of({ role, isMapped: false })),
      ),
    )

    return forkJoin(requests).pipe(
      map((results) =>
        results
          .filter(result => !result.isMapped)
          .map(result => ({
            code: result.role.code,
            label: result.role.label || 'Role name not available',
          })),
      ),
    )
  }

  private hasMappedActivityLevels(response: unknown): boolean {
    const result = Array.isArray((response as PositionMappingSearchResponseShape)?.result)
      ? (response as PositionMappingSearchResponseShape).result || []
      : []
    const first = result[0] || {}
    const childHierarchy = Array.isArray(first?.childHierarchy) ? first.childHierarchy : []

    return childHierarchy.some((child: PositionMappingHierarchyNode) => {
      const isActivity = (child?.entityType || '').toLowerCase() === 'activity'
      if (!isActivity) {
        return false
      }

      // If it exists in the array as an activity, it operates as mapped for a role.
      // Roles only need to be mapped to an activity, not to specific levels.
      return true
    })
  }

  private openMappingRequiredModal(missingRoles: MissingMappingItem[]): void {
    const dialogRef = this.dialog.open(MappingRequiredModalComponent, {
      width: FRAC_DIALOG_SIZES.mappingRequired,
      maxWidth: '92vw',
      disableClose: true,
      panelClass: 'mapping-required-dialog',
      data: {
        items: missingRoles,
        type: 'role',
      },
    })

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((action: 'back' | 'map-now' | undefined) => {
        if (action === 'map-now') {
          this.router.navigateByUrl(FRAC_ROUTES.mapRole)
        }
      })
  }

  private removeDeselectedRoles(): void {
    if (!this.selectedPosition?.roleDetails) return

    this.selectedPosition.roleDetails =
      this.selectedPosition.roleDetails.filter(detail =>
        this.selectedRoleSummary.some(s => s.code === detail.code),
      )
  }

  private updateOrInsertRoles(): void {
    if (!this.selectedPosition) return

    for (const summary of this.selectedRoleSummary) {
      const existing = this.selectedPosition.roleDetails!.find(
        r => r.code === summary.code,
      )

      if (existing) {
        existing.label = summary.label
      } else {
        this.selectedPosition.roleDetails!.push({
          code: summary.code,
          label: summary.label,
        })
      }
    }
  }

  private refreshPositionsState(): void {
    if (!this.selectedPosition) return

    const normalizedRoleDetails = this.cloneRoleDetails(this.selectedPosition.roleDetails || [])
    const updatedSelectedPosition: PositionItem = {
      ...this.selectedPosition,
      code: this.selectedPosition.code,
      title: this.selectedPosition.title,
      roleDetails: normalizedRoleDetails,
    }

    this.selectedPosition = updatedSelectedPosition
    this.applyPositionDetailsToCollections(updatedSelectedPosition.code, updatedSelectedPosition.title, normalizedRoleDetails)
    this.setPositionDraft(updatedSelectedPosition.code, normalizedRoleDetails)
  }

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------
  /**
   * Takes all the edited rows and sends them to the server to be updated.
   */
  onSaveClicked(): void {
    this.syncCurrentSelectedPositionSelection()
    const payload = this.buildPayload()

    if (!payload.length) {
      this.snackbar.warning('Nothing to save !!')
      return
    }

    if (this.isSaving || this.isValidatingRoleMappings) {
      return
    }

    this.validateSaveRoles(payload)
  }

  private validateSaveRoles(payload: PositionRoleApiRequestItem[]): void {
    const uniqueRoles = this.extractUniqueRolesFromPayload(payload)
    if (!uniqueRoles.length) {
      this.persistPositionRoleMappings(payload)
      return
    }

    this.isValidatingRoleMappings = true
    this.findRolesMissingActivityMapping(uniqueRoles)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (missingRoles) => {
          this.isValidatingRoleMappings = false
          if (missingRoles.length) {
            this.snackbar.warning('Some selected roles are missing activity mapping.')
            this.openMappingRequiredModal(missingRoles)
            return
          }

          this.persistPositionRoleMappings(payload)
        },
        error: (err) => {
          this.isValidatingRoleMappings = false
          fracLogger.error('Failed to validate roles before save', err)
          this.snackbar.error('Unable to validate role activity mappings. Please try again.')
        },
      })
  }

  private extractUniqueRolesFromPayload(payload: PositionRoleApiRequestItem[]): PositionRoleDetail[] {
    const uniqueRoles = new Map<string, PositionRoleDetail>()

    payload.forEach((item) => {
      const roleCode = (item?.childEntityCode || '').trim()
      if (!roleCode || uniqueRoles.has(roleCode)) {
        return
      }

      uniqueRoles.set(roleCode, {
        code: roleCode,
        label: this.getRoleLabelForValidation(roleCode),
      })
    })

    return Array.from(uniqueRoles.values())
  }

  private getRoleLabelForValidation(roleCode: string): string {
    const role =
      this.rolesData.find(item => item.code === roleCode) ||
      this.roles.find(item => item.code === roleCode) ||
      this.filteredRoles.find(item => item.code === roleCode)

    if (role?.title) {
      return role.title
    }

    const positionCollections = [this.positionsData, this.positions, this.filteredPositions]
    for (const collection of positionCollections) {
      for (const position of collection) {
        const mappedRole = position?.roleDetails?.find(detail => detail.code === roleCode)
        if (mappedRole?.label) {
          return mappedRole.label
        }
      }
    }

    return 'Role name not available'
  }

  private persistPositionRoleMappings(payload: PositionRoleApiRequestItem[]): void {
    this.isSaving = true

    this.fracApiService.mapEntity(payload).subscribe({
      next: (res) => {
        this.isSaving = false
        this.hasUnsavedChanges = false
        this.positionDraftStore.clear()
        this.syncUpdatedPositionsFromDraftStore()

        const mappedPairs = this.extractMappedPairs(res, payload)
        const successData: UploadResultData = {
          type: 'success',
          title: 'Mapping Saved',
          message: 'Position to role mappings were saved successfully.',
          errorDetails: mappedPairs.join('\n'),
        }
        this.showResultModal(successData, true)
      },
      error: (err) => {
        this.isSaving = false

        const errorMessage =
          err?.error?.params?.errmsg ||
          err?.error?.message ||
          err?.statusText ||
          err?.message ||
          'Failed to save position to role mapping.'

        const failureData: UploadResultData = {
          type: 'error',
          title: 'Mapping Failed',
          message: errorMessage,
          errorDetails: err?.status ? `HTTP Status: ${err.status}` : undefined,
        }

        this.showResultModal(failureData)
      },
    })
  }

  private buildPayload(): PositionRoleApiRequestItem[] {
    const payload: PositionRoleApiRequestItem[] = []
    const mappedPairs = new Set<string>()

    for (const [key, roleDetails] of this.positionDraftStore.entries()) {
      const positionCode = getCodeFromKey(key)
      if (!positionCode) continue

      for (const roleDetail of roleDetails) {
        const childCode = (roleDetail?.code || '').trim()
        if (!childCode) continue

        const pairKey = `${positionCode}::${childCode}`
        if (mappedPairs.has(pairKey)) {
          continue
        }
        mappedPairs.add(pairKey)

        payload.push({
          parentEntityType: 'Position',
          parentEntityCode: positionCode,
          childEntityType: 'Role',
          childEntityCode: childCode,
          competencies: [],
        })
      }
    }

    return payload
  }

  /**
   * Updates the visual selection state (checkboxes) for the currently open position card based on what is stored in memory.
   */
  private syncCurrentSelectedPositionSelection(): void {
    if (!this.selectedPosition) return

    if (!this.selectedPosition.roleDetails) {
      this.selectedPosition.roleDetails = []
    }

    this.buildSelectedRoleSummary()
    this.removeDeselectedRoles()
    this.updateOrInsertRoles()
    this.refreshPositionsState()
  }

  /**
   * Creates a unique text code to look up a position in the temporary storage.
   */
  private buildPositionMappingKey(positionCode: string): string {
    return makeMappingKey(this.selectedLanguage, positionCode)
  }


  /**
   * Creates a deep copy of the role mapping details to safely test for unsaved changes.
   */
  private cloneRoleDetails(details: PositionRoleDetail[]): PositionRoleDetail[] {
    return (details || [])
      .filter((detail) => !!detail?.code)
      .map((detail) => ({
        code: detail.code,
        label: detail.label || '',
      }))
  }

  /**
   * Creates a unique string from all mapped roles to detect if the user made any edits.
   */
  private getPositionRoleDetailsSignature(details: PositionRoleDetail[]): string {
    return this.cloneRoleDetails(details)
      .sort((left, right) => left.code.localeCompare(right.code, undefined, { numeric: true, sensitivity: 'base' }))
      .map((detail) => `${detail.code}|${detail.label}`)
      .join('||')
  }

  private getHydratedPositionRoleDetails(positionCode: string): PositionRoleDetail[] | null {
    const key = this.buildPositionMappingKey(positionCode)
    const draftDetails = this.positionDraftStore.get(key)
    if (draftDetails) {
      return this.cloneRoleDetails(draftDetails)
    }

    const mappedDetails = this.positionRoleMappingCache.get(key)
    if (mappedDetails) {
      return this.cloneRoleDetails(mappedDetails)
    }

    return null
  }

  private applyPositionDetailsToCollections(positionCode: string, positionTitle: string, details: PositionRoleDetail[]): void {
    const positionUpdater = (position: PositionItem): PositionItem => {
      if (position.code !== positionCode) {
        return position
      }

      return {
        ...position,
        title: positionTitle || position.title,
        roleDetails: this.cloneRoleDetails(details),
      }
    }

    this.positions = this.positions.map(positionUpdater)
    this.positionsData = this.positionsData.map(positionUpdater)
    this.filteredPositions = this.filteredPositions.map(positionUpdater)
  }

  /**
   * Saves the current mapping selections for a specific position into the temporary draft memory.
   */
  private setPositionDraft(positionCode: string, details: PositionRoleDetail[]): void {
    const key = this.buildPositionMappingKey(positionCode)
    const normalizedDetails = this.cloneRoleDetails(details)

    if (normalizedDetails.length) {
      this.positionDraftStore.set(key, normalizedDetails)
    } else {
      this.positionDraftStore.delete(key)
    }

    this.positionRoleMappingCache.set(key, normalizedDetails)
    this.syncUpdatedPositionsFromDraftStore()
  }

  /**
   * Loops through memory to ensure any positions edited on previous pages still show their updated mapped counts.
   */
  private syncUpdatedPositionsFromDraftStore(): void {
    const positionMap = new Map<string, PositionRoleDetail[]>()

    for (const [key, details] of this.positionDraftStore.entries()) {
      const positionCode = getCodeFromKey(key)
      if (!positionCode || !details.length) continue
      positionMap.set(positionCode, this.cloneRoleDetails(details))
    }

    this.updatedPositions = Array.from(positionMap.entries()).map(([code, roleDetails]) => {
      const metadata =
        this.positionsData.find(position => position.code === code) ||
        this.positions.find(position => position.code === code) ||
        this.filteredPositions.find(position => position.code === code)

      return {
        code,
        title: metadata?.title || code,
        roleDetails,
      }
    })
  }

  private extractMappedPairs(response: unknown, fallbackPayload: PositionRoleApiRequestItem[]): string[] {
    const resultArray = Array.isArray((response as { result?: Array<Partial<PositionRoleApiRequestItem>> })?.result)
      ? (response as { result?: Array<Partial<PositionRoleApiRequestItem>> }).result || []
      : []
    const source = resultArray.length ? resultArray : fallbackPayload

    return source
      .map((item) => {
        const parentCode = item?.parentEntityCode || ''
        const childCode = item?.childEntityCode || ''
        return `${parentCode} <=> ${childCode}`
      })
      .filter(Boolean)
  }

  /**
   * Opens a popup dialog to show the user if their action (upload, save) was successful or failed.
   */
  private showResultModal(data: UploadResultData, redirectOnClose = false): void {
    const dialogRef = this.dialog.open(UploadResultModalComponent, {
      width: FRAC_DIALOG_SIZES.mapResult,
      disableClose: true,
      panelClass: 'upload-result-dialog',
      data,
    })

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (redirectOnClose && data.type === 'success') {
          this.router.navigateByUrl(FRAC_ROUTES.homeDashboard)
        }
      })
  }

  /**
   * Handles the user clicking the Home or Back button. Warns them if they have unsaved changes before leaving.
   */
  onHomeClick(): void {
    if (this.isSaving) {
      return
    }

    if (!this.hasUnsavedChanges) {
      this.router.navigateByUrl(FRAC_ROUTES.homeDashboard)
      return
    }

    const dialogRef = this.dialog.open(UnsavedChangesModalComponent, {
      width: FRAC_DIALOG_SIZES.unsavedChanges,
      maxWidth: '92vw',
      disableClose: true,
      panelClass: 'unsaved-changes-dialog',
      data: {
        title: 'You Have Unsaved Changes',
        message: 'You’re about to return to the home screen. Any unsaved changes will be lost.',
        continueLabel: 'Continue',
        cancelLabel: 'Cancel',
      },
    })

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((action: 'continue' | 'cancel' | undefined) => {
        if (action === 'continue') {
          this.router.navigateByUrl(FRAC_ROUTES.homeDashboard)
        }
      })
  }
}
