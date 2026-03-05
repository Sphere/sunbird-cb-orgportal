import { Component, OnDestroy, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute, Router } from '@angular/router'
import { forkJoin, of, Subject } from 'rxjs'
import { catchError, debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs/operators'
import { MappingRequiredModalComponent, MissingMappingItem } from '../../components/mapping-required-modal/mapping-required-modal.component'
import { MappingModalLabels, UploadResultData, UploadResultModalComponent } from '../../components/upload-result-modal/upload-result-modal.component'
import { UnsavedChangesModalComponent } from '../../components/unsaved-changes-modal/unsaved-changes-modal.component'
import { CustomSnackbarService } from '../../services/custom-snackbar.service'
import { FracApiService } from '../../services/frac-api.service'
import { transformRoles, transformPositions, extractEntityList, makeMappingKey, getCodeFromKey } from '../../utils/common.util'
import { fracLogger } from '../../utils/frac-logger.util'
import { FracResponseParserUtil } from '../../utils/frac-response-parser.util'
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
  childEntityType?: 'Role'
  childEntityCode?: string
  competencies?: Array<number | string | Record<string, unknown>>
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
    private activatedRoute: ActivatedRoute,
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
  private readonly clearedPositionDraftKeys = new Set<string>()
  private activePositionRoleMappingRequestKey: string | null = null
  private readonly positionBaseLanguage = FRAC_LANGUAGES[0]
  private routePositionCode: string | null = null
  private hasAutoSelectedRoutePosition = false
  private hasTriggeredRoutePositionSearch = false

  /**
   * Runs once when the page loads. Sets up search listeners and checks the URL to see if we are in upload or manage mode.
   */
  ngOnInit(): void {
    this.setupSearchStreams()
    this.resetInitialView()

    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((queryParams) => {
        const positionCode = (queryParams?.positionCode || '').toString().trim()
        this.routePositionCode = positionCode || null
      })

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
    this.clearedPositionDraftKeys.clear()

    this.hasAutoSelectedRoutePosition = false
    this.hasTriggeredRoutePositionSearch = false
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

        this.applyRoutePositionSelection(hydrated, keyword)

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

  private applyRoutePositionSelection(positions: PositionItem[], keyword: string): void {
    if (this.hasAutoSelectedRoutePosition) {
      return
    }

    const routeCode = (this.routePositionCode || '').trim()
    if (!routeCode) {
      return
    }

    if (this.selectedPosition?.code) {
      this.hasAutoSelectedRoutePosition = true
      return
    }

    const match = positions.find(position => position.code === routeCode)
    if (match) {
      this.hasAutoSelectedRoutePosition = true
      this.onPositionSelected(match)
      return
    }

    const isInitialLoad = !keyword.trim()
    if (isInitialLoad && !this.hasTriggeredRoutePositionSearch) {
      this.hasTriggeredRoutePositionSearch = true
      this.fetchPositions(routeCode)
    }
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

    this.fracApiService.searchEntityMapping('position', position.code, this.selectedLanguage)
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

    // Detect no-change: compare current selection with the last saved/loaded cache
    if (this.isSelectionUnchangedFromCache()) {
      this.snackbar.warning('No changes detected. Please update your selection before saving.')
      return
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

    const selectedRoles = [...this.selectedRoleSummary]

    if (!selectedRoles.length) {
      this.removeDeselectedRoles()
      this.updateOrInsertRoles()
      this.refreshPositionsState()
      this.hasUnsavedChanges = false
      const payload = this.buildPayload()
      if (payload.length) {
        this.persistPositionRoleMappings(payload)
      } else {
        this.snackbar.success('Position–Role selection updated.')
      }
      return
    }

    this.isValidatingRoleMappings = true
    this.isSaving = true
    this.findRolesMissingActivityMapping(selectedRoles)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (missingRoles) => {
          this.isValidatingRoleMappings = false
          this.isSaving = false
          if (missingRoles.length) {
            this.snackbar.warning('Some selected roles are missing activity mapping.')
            this.openMappingRequiredModal(missingRoles)
            return
          }

          this.removeDeselectedRoles()
          this.updateOrInsertRoles()
          this.refreshPositionsState()
          this.hasUnsavedChanges = false
          const payload = this.buildPayload()
          if (payload.length) {
            this.persistPositionRoleMappings(payload)
          } else {
            this.snackbar.success('Position–Role selection updated.')
          }
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
  // Persist
  // ---------------------------------------------------------------------------

  private persistPositionRoleMappings(payload: PositionRoleApiRequestItem[]): void {
    this.isSaving = true

    this.fracApiService.mapEntity(payload).subscribe({
      next: () => {
        this.isSaving = false
        this.hasUnsavedChanges = false
        this.positionDraftStore.clear()
        this.clearedPositionDraftKeys.clear()
        this.syncUpdatedPositionsFromDraftStore()

        const positionCode = this.selectedPosition?.code || ''
        const mappedRoles = (this.selectedPosition?.roleDetails || [])
        const detailLines = mappedRoles.map(r => `${positionCode} <=> ${r.code}`).join('\n')

        const mappingLabels: MappingModalLabels = {
          sectionTitle: 'Position–Role Mappings',
          parentCountLabel: 'positions',
          parentLabel: 'Position',
          childrenLabel: 'Roles',
        }
        const successData: UploadResultData = {
          type: 'success',
          title: 'Mapping Saved',
          message: 'Position to role mappings were saved successfully.',
          errorDetails: detailLines || undefined,
          mappingLabels,
        }
        this.showResultModal(successData)
      },
      error: async (err) => {
        this.isSaving = false
        const failureData = await this.buildMappingFailureModalData(
          err,
          'Failed to save position to role mapping.',
        )
        this.showResultModal(failureData)
      },
    })
  }

  private buildPayload(): PositionRoleApiRequestItem[] {
    const payload: PositionRoleApiRequestItem[] = []
    const mappedPairs = new Set<string>()
    const parentsWithMappings = new Set<string>()

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
        parentsWithMappings.add(positionCode)

        payload.push({
          parentEntityType: 'Position',
          parentEntityCode: positionCode,
          childEntityType: 'Role',
          childEntityCode: childCode,
          competencies: [],
        })
      }
    }

    for (const key of this.clearedPositionDraftKeys.values()) {
      const positionCode = getCodeFromKey(key)
      if (!positionCode || parentsWithMappings.has(positionCode)) {
        continue
      }

      payload.push({
        parentEntityType: 'Position',
        parentEntityCode: positionCode,
      })
    }

    return payload
  }



  /**
   * Creates a unique text code to look up a position in the temporary storage.
   */
  private buildPositionMappingKey(positionCode: string): string {
    return makeMappingKey(this.selectedLanguage, positionCode)
  }

  /**
   * Returns true if the current checkbox selection exactly matches the last saved/loaded cache state.
   * Used to skip the API call when the user has not made any actual changes.
   */
  private isSelectionUnchangedFromCache(): boolean {
    if (!this.selectedPosition) return false

    const key = this.buildPositionMappingKey(this.selectedPosition.code)
    const cachedCodes = new Set<string>(
      (this.positionRoleMappingCache.get(key) || []).map(d => d.code),
    )
    const currentCodes = new Set<string>(
      Object.keys(this.selectedRoleMap).filter(code => this.selectedRoleMap[code]),
    )

    if (cachedCodes.size !== currentCodes.size) return false
    for (const code of cachedCodes) {
      if (!currentCodes.has(code)) return false
    }
    return true
  }

  private async buildMappingFailureModalData(err: any, fallbackMessage: string): Promise<UploadResultData> {
    const resolvedPayload = await FracResponseParserUtil.readErrorPayload(err)
    const normalizedPayload = FracResponseParserUtil.parseApiResponse(resolvedPayload)
    const rawMessage = FracResponseParserUtil.getRawMessage(normalizedPayload)
    const responseCode = normalizedPayload?.responseCode || normalizedPayload?.code
    const paramsStatus = normalizedPayload?.params?.status || normalizedPayload?.statusText
    const httpStatus = err?.status ? `HTTP Status: ${err.status}` : undefined

    return {
      type: 'error',
      title: 'Mapping Failed',
      message: FracResponseParserUtil.isUsefulMessage(rawMessage) ? rawMessage!.trim() : fallbackMessage,
      errorDetails: FracResponseParserUtil.formatErrorDetails(responseCode, paramsStatus, httpStatus),
      resultDetails: FracResponseParserUtil.getStructuredErrorDetails(normalizedPayload),
    }
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
      this.clearedPositionDraftKeys.delete(key)
    } else {
      this.positionDraftStore.delete(key)
      this.clearedPositionDraftKeys.add(key)
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
