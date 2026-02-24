import { Component, OnDestroy, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { Router } from '@angular/router'
import { forkJoin, of, Subject } from 'rxjs'
import { catchError, debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs/operators'
import { MappingRequiredModalComponent, MissingActivityMappingItem } from '../../components/mapping-required-modal/mapping-required-modal.component'
import { UnsavedChangesModalComponent } from '../../components/unsaved-changes-modal/unsaved-changes-modal.component'
import { UploadResultData, UploadResultModalComponent } from '../../components/upload-result-modal/upload-result-modal.component'
import { CustomSnackbarService } from '../../services/custom-snackbar.service'
import { FracApiService } from '../../services/frac-api.service'
import { transformRoles, transformActivities } from '../../utils/common.util'

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
  childEntityType: 'Activity'
  childEntityCode: string
  competencies: any[]
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
  readonly languages = ['English', 'Hindi', 'Kannada', 'Tamil']
  selectedLanguage = 'English'
  isOpen = false
  isEditing = true
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

  private roleSearch$ = new Subject<string>()
  private activitySearch$ = new Subject<string>()
  private destroy$ = new Subject<void>()
  private readonly roleMappingCache = new Map<string, RoleActivityDetail[]>()
  private readonly roleDraftStore = new Map<string, RoleActivityDetail[]>()
  private activeRoleMappingRequestKey: string | null = null

  ngOnInit(): void {
    this.setupSearchStreams()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private setupSearchStreams(): void {
    this.roleSearch$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(keyword => this.fetchRoles(keyword))

    this.activitySearch$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(keyword => this.fetchActivities(keyword))
  }

  // ---------------------------------------------------------------------------
  // API search
  // ---------------------------------------------------------------------------

  private fetchRoles(keyword: string): void {
    this.isRolesLoading = true
    this.fracApiService.searchEntities('role', keyword, this.selectedLanguage).subscribe({
      next: (res) => {
        this.isRolesLoading = false
        const apiEntity = this.extractEntityList(res)
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
        console.error('Failed to load roles', e)
        this.rolesData = []
        this.roles = []
        this.filteredRoles = []
      },
    })
  }

  private fetchActivities(keyword: string): void {
    this.isActivitiesLoading = true
    this.fracApiService.searchEntities('activity', keyword, this.selectedLanguage).subscribe({
      next: (res) => {
        this.isActivitiesLoading = false
        const apiEntity = this.extractEntityList(res)
        const transformed = transformActivities(apiEntity) as ActivityItem[]

        this.activitiesData = transformed
        this.activities = [...transformed]
        this.filteredActivities = [...transformed]

        this.buildSelectedActivitySummary()
      },
      error: (e) => {
        this.isActivitiesLoading = false
        console.error('Failed to load activities', e)
        this.activitiesData = []
        this.activities = []
        this.filteredActivities = []
      },
    })
  }

  private extractEntityList(response: any): any[] {
    if (!response) return []
    if (Array.isArray(response)) return response

    const entityList =
      response?.result?.entity ||
      response?.result?.data?.entity ||
      response?.data?.entity ||
      response?.entity

    return Array.isArray(entityList) ? entityList : []
  }

  // ---------------------------------------------------------------------------
  // Language dropdown
  // ---------------------------------------------------------------------------
  toggleDropdown(): void {
    this.isOpen = !this.isOpen
  }

  selectLanguage(lang: string, event: MouseEvent): void {
    event.stopPropagation()
    if (!this.languages.includes(lang)) return
    this.selectedLanguage = lang
    this.isOpen = false
    this.activeRoleMappingRequestKey = null

    this.roleSearch$.next(this.roleSearchTerm)
    this.activitySearch$.next(this.activitySearchTerm)

    if (this.selectedRole?.code) {
      const selected = this.selectedRole
      this.loadRoleActivityMappings(selected)
    }
  }

  // ---------------------------------------------------------------------------
  // Roles (left pane)
  // ---------------------------------------------------------------------------
  onRoleSearch(keyword: string): void {
    this.roleSearchTerm = keyword.trim()
    this.roleSearch$.next(this.roleSearchTerm)
  }

  onRoleSelected(role: RoleItem): void {
    this.selectedRole = role
    this.selectedActivityMap = {}
    this.selectedActivitySummary = []
    this.loadRoleActivityMappings(role)
  }

  onRoleToggleExpand(role: RoleItem): void {
    this.expandedRole = this.expandedRole === role ? null : role
  }

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
          console.error('Failed to load role mappings', err)
          this.selectedActivityMap = {}
          this.selectedActivitySummary = []
          this.snackbar.error('Unable to fetch existing role mappings.')
        },
      })
  }

  private extractMappedActivities(response: any): RoleActivityDetail[] {
    const result = Array.isArray(response?.result) ? response.result : []
    const first = result[0] || {}
    const childHierarchy = Array.isArray(first?.childHierarchy) ? first.childHierarchy : []

    return childHierarchy
      .filter((child: any) => (child?.entityType || '').toLowerCase() === 'activity')
      .map((child: any) => ({
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
      this.hasUnsavedChanges = true
      this.snackbar.success('Role–activity mapping updated successfully.')
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
          this.hasUnsavedChanges = true
          this.snackbar.success('Role–activity mapping updated successfully.')
        },
        error: (err) => {
          this.isValidatingActivityMappings = false
          console.error('Failed to validate activity competency mappings', err)
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

  private hasMappedCompetencyLevels(response: any): boolean {
    const result = Array.isArray(response?.result) ? response.result : []
    const first = result[0] || {}
    const childHierarchy = Array.isArray(first?.childHierarchy) ? first.childHierarchy : []

    return childHierarchy.some((child: any) => {
      const isCompetency = (child?.entityType || '').toLowerCase() === 'competency'
      if (!isCompetency) {
        return false
      }

      const levels = Array.isArray(child?.competencies) ? child.competencies : []
      return levels.some((level: any) => {
        if (typeof level === 'number') {
          return Number.isFinite(level) && level > 0
        }
        if (typeof level === 'string') {
          const parsed = Number(level)
          return Number.isFinite(parsed) && parsed > 0
        }

        const parsed = Number(level?.levelNumber ?? level?.level ?? level?.levelId)
        return Number.isFinite(parsed) && parsed > 0
      })
    })
  }

  private openMappingRequiredModal(missingActivities: MissingActivityMappingItem[]): void {
    const dialogRef = this.dialog.open(MappingRequiredModalComponent, {
      width: '425px',
      maxWidth: '92vw',
      disableClose: true,
      panelClass: 'mapping-required-dialog',
      data: {
        activities: missingActivities,
      },
    })

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((action: 'back' | 'map-now' | undefined) => {
        if (action === 'map-now') {
          this.router.navigateByUrl('/app/frac/map-activity')
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
  // Save
  // ---------------------------------------------------------------------------
  onSaveClicked(): void {
    this.syncCurrentSelectedRoleSelection()
    const payload = this.buildPayload()

    if (!payload.length) {
      this.snackbar.warning('Nothing to save !!')
      return
    }

    if (this.isSaving) {
      return
    }

    this.isSaving = true

    this.fracApiService.mapEntity(payload).subscribe({
      next: (res) => {
        this.isSaving = false
        this.hasUnsavedChanges = false
        this.roleDraftStore.clear()
        this.syncUpdatedRolesFromDraftStore()

        const mappedPairs = this.extractMappedPairs(res, payload)
        const successData: UploadResultData = {
          type: 'success',
          title: 'Mapping Saved',
          message: 'Role to activity mappings saved successfully.',
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
          'Failed to save role to activity mapping.'

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

  private buildPayload(): RoleActivityApiRequestItem[] {
    const payload: RoleActivityApiRequestItem[] = []
    const mappedPairs = new Set<string>()

    for (const [key, activityDetails] of this.roleDraftStore.entries()) {
      const roleCode = this.extractEntityCodeFromMappingKey(key)
      if (!roleCode) continue

      for (const activityDetail of activityDetails) {
        const childCode = (activityDetail?.code || '').trim()
        if (!childCode) continue

        const pairKey = `${roleCode}::${childCode}`
        if (mappedPairs.has(pairKey)) {
          continue
        }
        mappedPairs.add(pairKey)

        payload.push({
          parentEntityType: 'Role',
          parentEntityCode: roleCode,
          childEntityType: 'Activity',
          childEntityCode: childCode,
          competencies: [],
        })
      }
    }

    return payload
  }

  private syncCurrentSelectedRoleSelection(): void {
    if (!this.selectedRole) return

    if (!this.selectedRole.activityDetails) {
      this.selectedRole.activityDetails = []
    }

    this.buildSelectedActivitySummary()
    this.removeDeselectedActivities()
    this.updateOrInsertActivities()
    this.refreshRolesState()
  }

  private buildRoleMappingKey(roleCode: string): string {
    return `${this.selectedLanguage.trim().toLowerCase()}::${(roleCode || '').trim()}`
  }

  private extractEntityCodeFromMappingKey(key: string): string {
    const separator = '::'
    const separatorIndex = key.indexOf(separator)
    if (separatorIndex === -1) {
      return key
    }

    return key.slice(separatorIndex + separator.length)
  }

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

  private setRoleDraft(roleCode: string, details: RoleActivityDetail[]): void {
    const key = this.buildRoleMappingKey(roleCode)
    const normalizedDetails = this.cloneActivityDetails(details)

    if (normalizedDetails.length) {
      this.roleDraftStore.set(key, normalizedDetails)
    } else {
      this.roleDraftStore.delete(key)
    }

    this.roleMappingCache.set(key, normalizedDetails)
    this.syncUpdatedRolesFromDraftStore()
  }

  private syncUpdatedRolesFromDraftStore(): void {
    const roleMap = new Map<string, RoleActivityDetail[]>()

    for (const [key, details] of this.roleDraftStore.entries()) {
      const roleCode = this.extractEntityCodeFromMappingKey(key)
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

  private extractMappedPairs(response: any, fallbackPayload: RoleActivityApiRequestItem[]): string[] {
    const resultArray = Array.isArray(response?.result) ? response.result : []
    const source = resultArray.length ? resultArray : fallbackPayload

    return source
      .map((item: any) => {
        const parentCode = item?.parentEntityCode || ''
        const childCode = item?.childEntityCode || ''
        return `${parentCode} <=> ${childCode}`
      })
      .filter(Boolean)
  }

  private showResultModal(data: UploadResultData, redirectOnClose = false): void {
    const dialogRef = this.dialog.open(UploadResultModalComponent, {
      width: '440px',
      disableClose: true,
      panelClass: 'upload-result-dialog',
      data,
    })

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (redirectOnClose && data.type === 'success') {
          this.router.navigateByUrl('/app/home/frac/dashboard')
        }
      })
  }

  onHomeClick(): void {
    if (this.isSaving || this.isValidatingActivityMappings) {
      return
    }

    if (!this.hasUnsavedChanges) {
      this.router.navigateByUrl('/app/home/frac/dashboard')
      return
    }

    const dialogRef = this.dialog.open(UnsavedChangesModalComponent, {
      width: '363px',
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
          this.router.navigateByUrl('/app/home/frac/dashboard')
        }
      })
  }
}
