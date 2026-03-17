import { Component, OnDestroy, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { Router } from '@angular/router'
import { forkJoin, of, Subject } from 'rxjs'
import { catchError, debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs/operators'
import { MappingRequiredModalComponent, MissingMappingItem } from '../../components/mapping-required-modal/mapping-required-modal.component'
import { UnsavedChangesModalComponent } from '../../components/unsaved-changes-modal/unsaved-changes-modal.component'
import { MappingModalLabels, UploadResultData, UploadResultModalComponent } from '../../components/upload-result-modal/upload-result-modal.component'
import { CustomSnackbarService } from '../../services/custom-snackbar.service'
import { FracApiService } from '../../services/frac-api.service'
import { transformRoles, transformActivities, extractEntityList, makeMappingKey, getCodeFromKey } from '../../utils/common.util'
import { fracLogger } from '../../utils/frac-logger.util'
import { FracResponseParserUtil } from '../../utils/frac-response-parser.util'
import { FRAC_UI_CONFIG } from '../../models/ui.config.model'
import { FRAC_DEBOUNCE_MS, FRAC_DIALOG_SIZES, FRAC_LANGUAGES, FRAC_MAP_PAGE_SPINNER, FRAC_ROUTES } from '../../constants/frac.constants'

interface RoleActivityDetail {
  code: string
  label: string
}

interface RoleItem {
  code: string
  title: string
  expanded?: boolean
  activityDetails?: RoleActivityDetail[]
}

interface ActivityItem {
  code: string
  title: string
}

interface RoleActivityApiRequestItem {
  parentEntityType: 'Role'
  parentEntityCode: string
  childEntityType?: 'Activity'
  childEntityCode?: string
  competencies?: Array<number | string | Record<string, unknown>>
}

interface MappingHierarchyNode {
  entityType?: string
  entityCode?: string
  entityName?: string
  competencies?: Array<number | string | { levelNumber?: number; level?: number | string; levelId?: number }>
}

interface MappingSearchResultItem {
  childHierarchy?: MappingHierarchyNode[]
}

interface MappingSearchResponseShape {
  result?: MappingSearchResultItem[]
}

@Component({
  selector: 'ws-app-map-role-activities',
  templateUrl: './map-role-activities.component.html',
  styleUrls: ['./map-role-activities.component.scss'],
})
export class MapRoleActivitiesComponent implements OnInit, OnDestroy {

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

  readonly languages = FRAC_LANGUAGES
  selectedLanguage = FRAC_LANGUAGES[0]?.key || 'en'
  isOpen = false
  get isEditing(): boolean { return this.selectedLanguage === 'en' }
  isSaving = false
  isRoleMappingLoading = false
  isRolesLoading = false
  isActivitiesLoading = false
  isValidatingActivityMappings = false
  hasUnsavedChanges = false

  // left – roles
  rolesData: RoleItem[] = []
  roles: RoleItem[] = []
  filteredRoles: RoleItem[] = []
  selectedRole: RoleItem | null = null
  expandedRole: RoleItem | null = null

  // right – activities
  activitiesData: ActivityItem[] = []
  activities: ActivityItem[] = []
  filteredActivities: ActivityItem[] = []

  // selection state (for current selectedRole)
  selectedActivityMap: { [activityCode: string]: boolean } = {}
  selectedActivitySummary: RoleActivityDetail[] = []

  // roles that have mapping changes
  updatedRoles: RoleItem[] = []

  roleSearchTerm = ''
  activitySearchTerm = ''
  searchResetKey = 0

  private roleSearch$ = new Subject<string>()
  private activitySearch$ = new Subject<string>()
  private destroy$ = new Subject<void>()
  private readonly roleMappingCache = new Map<string, RoleActivityDetail[]>()
  private readonly roleDraftStore = new Map<string, RoleActivityDetail[]>()
  private readonly clearedRoleDraftKeys = new Set<string>()
  private activeRoleMappingRequestKey: string | null = null

  /**
   * Runs once when the page loads. Sets up search listeners and checks the URL to see if we are in upload or manage mode.
   */
  ngOnInit(): void {
    this.setupSearchStreams()
    this.resetInitialView()
    this.fetchRoles('')
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
    this.roleSearch$
      .pipe(
        debounceTime(FRAC_DEBOUNCE_MS.searchInput),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(keyword => this.fetchRoles(keyword))

    this.activitySearch$
      .pipe(
        debounceTime(FRAC_DEBOUNCE_MS.searchInput),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(keyword => this.fetchActivities(keyword))
  }

  /**
   * Resets all component variables back to their blank, starting state.
   */
  private resetInitialView(): void {
    this.searchResetKey += 1
    this.roleSearchTerm = ''
    this.activitySearchTerm = ''
    this.hasUnsavedChanges = false
    this.isRoleMappingLoading = false
    this.isRolesLoading = false
    this.isActivitiesLoading = false
    this.isValidatingActivityMappings = false
    this.activeRoleMappingRequestKey = null

    this.rolesData = []
    this.roles = []
    this.filteredRoles = []
    this.activitiesData = []
    this.activities = []
    this.filteredActivities = []

    this.selectedRole = null
    this.expandedRole = null
    this.selectedActivityMap = {}
    this.selectedActivitySummary = []
    this.updatedRoles = []

    this.roleMappingCache.clear()
    this.roleDraftStore.clear()
    this.clearedRoleDraftKeys.clear()
  }

  // ---------------------------------------------------------------------------
  // API search
  // ---------------------------------------------------------------------------

  /**
   * Fetches the list of roles from the backend based on the search keyword.
   */
  private fetchRoles(keyword: string): void {
    this.isRolesLoading = true
    this.fracApiService.searchEntities('role', keyword, this.selectedLanguage).subscribe({
      next: (res) => {
        this.isRolesLoading = false
        const apiEntity = extractEntityList(res)
        const transformed = transformRoles(apiEntity)
        const hydrated = transformed.map((role) => {
          const details = this.getHydratedRoleActivityDetails(role.code)
          return details ? { ...role, activityDetails: details } : role
        })

        this.rolesData = hydrated
        this.roles = [...hydrated]
        this.filteredRoles = [...hydrated]

        if (this.selectedRole) {
          const hasSearchKeyword = !!keyword.trim()
          const matched = hydrated.find(r => r.code === this.selectedRole!.code)
          if (!matched) {
            if (hasSearchKeyword) {
              return
            }
            this.selectedRole = null
            this.selectedActivityMap = {}
            this.selectedActivitySummary = []
          } else {
            this.selectedRole = matched
            this.applyMappedActivitiesToRole(matched, matched.activityDetails || [])
          }
        }
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

  /**
   * Fetches the list of activities from the backend using the search keyword.
   */
  private fetchActivities(keyword: string): void {
    this.isActivitiesLoading = true
    this.fracApiService.searchEntities('activity', keyword, this.selectedLanguage).subscribe({
      next: (res) => {
        this.isActivitiesLoading = false
        const apiEntity = extractEntityList(res)
        const transformed = transformActivities(apiEntity) as ActivityItem[]

        this.activitiesData = transformed
        this.activities = [...transformed]
        this.filteredActivities = [...transformed]

        this.buildSelectedActivitySummary()
      },
      error: (e) => {
        this.isActivitiesLoading = false
        fracLogger.error('Failed to load activities', e)
        this.activitiesData = []
        this.activities = []
        this.filteredActivities = []
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
  getLangLabel(key: string): string {
    return this.languages.find(l => l.key === key)?.label || key
  }

  selectLanguage(lang: { key: string }, event: MouseEvent): void {
    event.stopPropagation()
    if (!this.languages.some(l => l.key === lang.key)) return
    if (this.selectedLanguage === lang.key) {
      this.isOpen = false
      return
    }

    this.selectedLanguage = lang.key
    this.isOpen = false
    this.resetInitialView()
    this.fetchRoles('')
  }

  // ---------------------------------------------------------------------------
  // Roles (left pane)
  // ---------------------------------------------------------------------------
  onRoleSearch(keyword: string): void {
    this.roleSearchTerm = keyword.trim()
    this.roleSearch$.next(this.roleSearchTerm)
  }

  /**
   * Sets a role card as the active focus in the UI.
   */
  onRoleSelected(role: RoleItem): void {
    this.selectedRole = role
    this.selectedActivityMap = {}
    this.selectedActivitySummary = []
    this.activitySearchTerm = ''
    this.searchResetKey += 1
    this.loadRoleActivityMappings(role)
  }

  /**
   * Toggles a role card open or closed, triggering a fetch for its children if opening.
   */
  onRoleToggleExpand(role: RoleItem): void {
    this.expandedRole = this.expandedRole === role ? null : role
  }

  /**
   * Triggers a backend request to find mapped activities when a user expands a role card.
   */
  private loadRoleActivityMappings(role: RoleItem): void {
    const requestKey = this.buildRoleMappingKey(role.code)
    this.isRoleMappingLoading = true

    const draft = this.roleDraftStore.get(requestKey)
    if (draft) {
      this.applyMappedActivitiesToRole(role, draft)
      this.isRoleMappingLoading = false
      return
    }

    const cached = this.roleMappingCache.get(requestKey)
    if (cached) {
      this.applyMappedActivitiesToRole(role, cached)
      this.isRoleMappingLoading = false
      return
    }

    if (this.activeRoleMappingRequestKey === requestKey) {
      this.isRoleMappingLoading = false
      return
    }

    this.activeRoleMappingRequestKey = requestKey

    this.fracApiService.searchEntityMapping('role', role.code, this.selectedLanguage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (this.activeRoleMappingRequestKey === requestKey) {
            this.activeRoleMappingRequestKey = null
          }

          if (this.selectedRole?.code !== role.code || this.buildRoleMappingKey(role.code) !== requestKey) {
            return
          }
          this.isRoleMappingLoading = false
          const mappedActivities = this.extractMappedActivities(res)
          this.roleMappingCache.set(requestKey, this.cloneActivityDetails(mappedActivities))
          this.applyMappedActivitiesToRole(role, mappedActivities)
        },
        error: (err) => {
          if (this.activeRoleMappingRequestKey === requestKey) {
            this.activeRoleMappingRequestKey = null
          }

          if (this.selectedRole?.code !== role.code || this.buildRoleMappingKey(role.code) !== requestKey) {
            return
          }
          this.isRoleMappingLoading = false
          fracLogger.error('Failed to load role mappings', err)
          this.selectedActivityMap = {}
          this.selectedActivitySummary = []
          this.snackbar.error('Unable to fetch existing role mappings.')
        },
      })
  }

  /**
   * Reads the complex API mapping response to build a simple list of connected activities.
   */
  private extractMappedActivities(response: unknown): RoleActivityDetail[] {
    const result = Array.isArray((response as MappingSearchResponseShape)?.result)
      ? (response as MappingSearchResponseShape).result || []
      : []
    const first = result[0] || {}
    const childHierarchy = Array.isArray(first?.childHierarchy) ? first.childHierarchy : []

    return childHierarchy
      .filter((child: MappingHierarchyNode) => (child?.entityType || '').toLowerCase() === 'activity')
      .map((child: MappingHierarchyNode) => ({
        code: (child?.entityCode || '').trim(),
        label: child?.entityName || '',
      }))
      .filter((item: RoleActivityDetail) => !!item.code)
  }

  private applyMappedActivitiesToRole(
    role: RoleItem,
    mappedActivities: RoleActivityDetail[],
  ): void {
    const activityDetails: RoleActivityDetail[] = mappedActivities.map((mapped) => ({
      code: mapped.code,
      label: mapped.label || '',
    }))

    this.applyRoleDetailsToCollections(role.code, role.title, activityDetails)

    if (this.selectedRole?.code === role.code) {
      this.selectedRole = {
        ...this.selectedRole,
        activityDetails: this.cloneActivityDetails(activityDetails),
      }
    }

    role.activityDetails = activityDetails
    this.selectedActivityMap = {}
    activityDetails.forEach((detail) => {
      this.selectedActivityMap[detail.code] = true
    })

    this.selectedActivitySummary = [...activityDetails]

    const shouldKeepSearchedList = !!this.activitySearchTerm
    if (shouldKeepSearchedList) {
      this.activitySearch$.next(this.activitySearchTerm)
      return
    }

    const mappedList: ActivityItem[] = activityDetails.map((activity) => ({
      code: activity.code,
      title: activity.label,
    }))
    this.activitiesData = [...mappedList]
    this.activities = [...mappedList]
    this.filteredActivities = [...mappedList]
  }

  // ---------------------------------------------------------------------------
  // Activities (right pane)
  // ---------------------------------------------------------------------------
  onActivitySearch(keyword: string): void {
    this.activitySearchTerm = keyword.trim()
    this.activitySearch$.next(this.activitySearchTerm)
  }

  onActivityCheckChanged(event: { code: string; checked: boolean }): void {
    const { code, checked } = event
    if (!code) return

    if (checked) {
      this.selectedActivityMap[code] = true
    } else {
      delete this.selectedActivityMap[code]
    }

    this.buildSelectedActivitySummary()
  }

  private buildSelectedActivitySummary(): void {
    const result: RoleActivityDetail[] = []

    for (const code of Object.keys(this.selectedActivityMap)) {
      if (!this.selectedActivityMap[code]) continue
      const meta = this.activitiesData.find(a => a.code === code)
      const existing = this.selectedRole?.activityDetails?.find(a => a.code === code)
      result.push({
        code,
        label: meta?.title || existing?.label || '',
      })
    }

    this.selectedActivitySummary = result
  }

  // ---------------------------------------------------------------------------
  // Add Activities → Role (button)
  // ---------------------------------------------------------------------------
  onAddActivityToRole(): void {
    if (!this.selectedRole) {
      this.snackbar.warning('Please select a role first !!')
      return
    }

    const hasSelected = Object.keys(this.selectedActivityMap).length > 0
    const roleAlreadyHadActivities = !!this.selectedRole.activityDetails?.length

    if (!hasSelected && !roleAlreadyHadActivities) {
      this.snackbar.warning('Please select at least one activity to map !!')
      return
    }

    // ensure the property exists
    if (!this.selectedRole.activityDetails) {
      this.selectedRole.activityDetails = []
    }

    // Detect no-change: compare current selection with the last saved/loaded cache
    if (this.isSelectionUnchangedFromCache()) {
      this.snackbar.warning('No changes detected. Please update your selection before saving.')
      return
    }

    // Rebuild summarised selection
    this.buildSelectedActivitySummary()

    // Validate selected activities before assigning them to role.
    this.validateAndApplyRoleActivityMappings()
  }

  private validateAndApplyRoleActivityMappings(): void {
    if (!this.selectedRole) {
      return
    }
    if (this.isValidatingActivityMappings) {
      return
    }


    const selectedActivities = [...this.selectedActivitySummary]
    if (!selectedActivities.length) {
      this.removeDeselectedActivities()
      this.updateOrInsertActivities()
      this.refreshRolesState()
      this.hasUnsavedChanges = false
      const payload = this.buildPayload()
      if (payload.length) {
        this.persistRoleActivityMappings(payload)
      } else {
        this.snackbar.success('Role–Activity selection updated.')
      }
      return
    }

    this.isValidatingActivityMappings = true
    this.findActivitiesMissingCompetencyMapping(selectedActivities)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (missingActivities) => {
          this.isValidatingActivityMappings = false
          if (missingActivities.length) {
            this.snackbar.warning('Some selected activities are missing competency mapping.')
            this.openMappingRequiredModal(missingActivities)
            return
          }

          this.removeDeselectedActivities()
          this.updateOrInsertActivities()
          this.refreshRolesState()
          this.hasUnsavedChanges = false
          const payload = this.buildPayload()
          if (payload.length) {
            this.persistRoleActivityMappings(payload)
          } else {
            this.snackbar.success('Role–Activity selection updated.')
          }
        },
        error: (err) => {
          this.isValidatingActivityMappings = false
          fracLogger.error('Failed to validate activity competency mappings', err)
          this.snackbar.error('Unable to validate activity competency mappings. Please try again.')
        },
      })
  }

  private findActivitiesMissingCompetencyMapping(activities: RoleActivityDetail[]) {
    const requests = activities.map((activity) =>
      this.fracApiService.searchEntityMapping('activity', activity.code, this.selectedLanguage).pipe(
        map((res) => ({
          activity,
          isMapped: this.hasMappedCompetencyLevels(res),
        })),
        catchError(() => of({ activity, isMapped: false })),
      ),
    )

    return forkJoin(requests).pipe(
      map((results) =>
        results
          .filter(result => !result.isMapped)
          .map(result => ({
            code: result.activity.code,
            label: result.activity.label || 'Activity name not available',
          })),
      ),
    )
  }

  private hasMappedCompetencyLevels(response: unknown): boolean {
    const result = Array.isArray((response as MappingSearchResponseShape)?.result)
      ? (response as MappingSearchResponseShape).result || []
      : []
    const first = result[0] || {}
    const childHierarchy = Array.isArray(first?.childHierarchy) ? first.childHierarchy : []

    return childHierarchy.some((child: MappingHierarchyNode) => {
      const isCompetency = (child?.entityType || '').toLowerCase() === 'competency'
      if (!isCompetency) {
        return false
      }

      const levels = Array.isArray(child?.competencies) ? child.competencies : []
      return levels.some((level: number | string | { levelNumber?: number; level?: number | string; levelId?: number }) => {
        if (typeof level === 'number') {
          return Number.isFinite(level) && level > 0
        }
        if (typeof level === 'string') {
          const parsed = Number(level)
          return Number.isFinite(parsed) && parsed > 0
        }

        const parsed = Number(level.levelNumber ?? level.level ?? level.levelId)
        return Number.isFinite(parsed) && parsed > 0
      })
    })
  }

  private openMappingRequiredModal(missingActivities: MissingMappingItem[]): void {
    const dialogRef = this.dialog.open(MappingRequiredModalComponent, {
      width: FRAC_DIALOG_SIZES.mappingRequired,
      maxWidth: '92vw',
      disableClose: true,
      panelClass: 'mapping-required-dialog',
      data: {
        items: missingActivities,
        type: 'activity',
      },
    })

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((action: 'back' | 'map-now' | undefined) => {
        if (action === 'map-now') {
          this.router.navigateByUrl(FRAC_ROUTES.mapActivity)
        }
      })
  }

  private removeDeselectedActivities(): void {
    if (!this.selectedRole?.activityDetails) return

    this.selectedRole.activityDetails =
      this.selectedRole.activityDetails.filter(detail =>
        this.selectedActivitySummary.some(s => s.code === detail.code),
      )
  }

  private updateOrInsertActivities(): void {
    if (!this.selectedRole) return

    for (const summary of this.selectedActivitySummary) {
      const existing = this.selectedRole.activityDetails!.find(
        a => a.code === summary.code,
      )

      if (existing) {
        existing.label = summary.label
      } else {
        this.selectedRole.activityDetails!.push({
          code: summary.code,
          label: summary.label,
        })
      }
    }
  }

  private refreshRolesState(): void {
    if (!this.selectedRole) return

    const normalizedActivityDetails = this.cloneActivityDetails(this.selectedRole.activityDetails || [])
    const updatedSelectedRole: RoleItem = {
      ...this.selectedRole,
      code: this.selectedRole.code,
      title: this.selectedRole.title,
      activityDetails: normalizedActivityDetails,
    }

    this.selectedRole = updatedSelectedRole
    this.applyRoleDetailsToCollections(updatedSelectedRole.code, updatedSelectedRole.title, normalizedActivityDetails)
    this.setRoleDraft(updatedSelectedRole.code, normalizedActivityDetails)
  }

  // ---------------------------------------------------------------------------
  // Persist
  // ---------------------------------------------------------------------------

  private persistRoleActivityMappings(payload: RoleActivityApiRequestItem[]): void {
    this.isSaving = true

    this.fracApiService.mapEntity(payload).subscribe({
      next: () => {
        this.isSaving = false
        this.hasUnsavedChanges = false
        this.roleDraftStore.clear()
        this.clearedRoleDraftKeys.clear()
        this.syncUpdatedRolesFromDraftStore()

        const roleCode = this.selectedRole?.code || ''
        const mappedActivities = (this.selectedRole?.activityDetails || [])
        const detailLines = mappedActivities.map(a => `${roleCode} <=> ${a.code}`).join('\n')

        const mappingLabels: MappingModalLabels = {
          sectionTitle: 'Role–Activity Mappings',
          parentCountLabel: 'roles',
          parentLabel: 'Role',
          childrenLabel: 'Activities',
        }
        const successData: UploadResultData = {
          type: 'success',
          title: 'Mapping Saved',
          message: 'Role to activity mappings were saved successfully.',
          errorDetails: detailLines || undefined,
          mappingLabels,
        }
        this.showResultModal(successData)
      },
      error: async (err) => {
        this.isSaving = false
        const failureData = await this.buildMappingFailureModalData(
          err,
          'Failed to save role to activity mapping.',
        )
        this.showResultModal(failureData)
      },
    })
  }

  private buildPayload(): RoleActivityApiRequestItem[] {
    const payload: RoleActivityApiRequestItem[] = []
    const mappedPairs = new Set<string>()
    const parentsWithMappings = new Set<string>()

    for (const [key, activityDetails] of this.roleDraftStore.entries()) {
      const roleCode = getCodeFromKey(key)
      if (!roleCode) continue

      for (const activityDetail of activityDetails) {
        const childCode = (activityDetail?.code || '').trim()
        if (!childCode) continue

        const pairKey = `${roleCode}::${childCode}`
        if (mappedPairs.has(pairKey)) {
          continue
        }
        mappedPairs.add(pairKey)
        parentsWithMappings.add(roleCode)

        payload.push({
          parentEntityType: 'Role',
          parentEntityCode: roleCode,
          childEntityType: 'Activity',
          childEntityCode: childCode,
          competencies: [],
        })
      }
    }

    for (const key of this.clearedRoleDraftKeys.values()) {
      const roleCode = getCodeFromKey(key)
      if (!roleCode || parentsWithMappings.has(roleCode)) {
        continue
      }

      payload.push({
        parentEntityType: 'Role',
        parentEntityCode: roleCode,
      })
    }

    return payload
  }



  /**
   * Creates a unique text code to look up a role in the temporary storage.
   */
  private buildRoleMappingKey(roleCode: string): string {
    return makeMappingKey(this.selectedLanguage, roleCode)
  }

  /**
   * Returns true if the current checkbox selection exactly matches the last saved/loaded cache state.
   * Used to skip the API call when the user has not made any actual changes.
   */
  private isSelectionUnchangedFromCache(): boolean {
    if (!this.selectedRole) return false

    const key = this.buildRoleMappingKey(this.selectedRole.code)
    const cachedCodes = new Set<string>(
      (this.roleMappingCache.get(key) || []).map(d => d.code),
    )
    const currentCodes = new Set<string>(
      Object.keys(this.selectedActivityMap).filter(code => this.selectedActivityMap[code]),
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
      message: rawMessage && rawMessage.trim() ? rawMessage.trim() : fallbackMessage,
      errorDetails: FracResponseParserUtil.formatErrorDetails(responseCode, paramsStatus, httpStatus),
      resultDetails: FracResponseParserUtil.getStructuredErrorDetails(normalizedPayload),
    }
  }


  /**
   * Creates a deep copy of the activity details so we can compare changes without modifying the original data.
   */
  private cloneActivityDetails(details: RoleActivityDetail[]): RoleActivityDetail[] {
    return (details || [])
      .filter((detail) => !!detail?.code)
      .map((detail) => ({
        code: detail.code,
        label: detail.label || '',
      }))
  }



  private getHydratedRoleActivityDetails(roleCode: string): RoleActivityDetail[] | null {
    const key = this.buildRoleMappingKey(roleCode)
    const draftDetails = this.roleDraftStore.get(key)
    if (draftDetails) {
      return this.cloneActivityDetails(draftDetails)
    }

    const mappedDetails = this.roleMappingCache.get(key)
    if (mappedDetails) {
      return this.cloneActivityDetails(mappedDetails)
    }

    return null
  }

  private applyRoleDetailsToCollections(roleCode: string, roleTitle: string, details: RoleActivityDetail[]): void {
    const roleUpdater = (role: RoleItem): RoleItem => {
      if (role.code !== roleCode) {
        return role
      }

      return {
        ...role,
        title: roleTitle || role.title,
        activityDetails: this.cloneActivityDetails(details),
      }
    }

    this.roles = this.roles.map(roleUpdater)
    this.rolesData = this.rolesData.map(roleUpdater)
    this.filteredRoles = this.filteredRoles.map(roleUpdater)
  }

  /**
   * Saves the current mapping selections for a specific role into the temporary draft memory.
   */
  private setRoleDraft(roleCode: string, details: RoleActivityDetail[]): void {
    const key = this.buildRoleMappingKey(roleCode)
    const normalizedDetails = this.cloneActivityDetails(details)

    if (normalizedDetails.length) {
      this.roleDraftStore.set(key, normalizedDetails)
      this.clearedRoleDraftKeys.delete(key)
    } else {
      this.roleDraftStore.delete(key)
      this.clearedRoleDraftKeys.add(key)
    }

    this.roleMappingCache.set(key, normalizedDetails)
    this.syncUpdatedRolesFromDraftStore()
  }

  /**
   * Loops through memory to ensure any roles edited on previous pages still show their updated mapped counts.
   */
  private syncUpdatedRolesFromDraftStore(): void {
    const roleMap = new Map<string, RoleActivityDetail[]>()

    for (const [key, details] of this.roleDraftStore.entries()) {
      const roleCode = getCodeFromKey(key)
      if (!roleCode || !details.length) continue
      roleMap.set(roleCode, this.cloneActivityDetails(details))
    }

    this.updatedRoles = Array.from(roleMap.entries()).map(([code, activityDetails]) => {
      const metadata =
        this.rolesData.find(role => role.code === code) ||
        this.roles.find(role => role.code === code) ||
        this.filteredRoles.find(role => role.code === code)

      return {
        code,
        title: metadata?.title || code,
        activityDetails,
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
    if (this.isSaving || this.isValidatingActivityMappings) {
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
