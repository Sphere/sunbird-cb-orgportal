import { Component, OnDestroy, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { forkJoin, of, Subject } from 'rxjs'
import { catchError, debounceTime, distinctUntilChanged, map, switchMap, takeUntil } from 'rxjs/operators'
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
  ) { }

  // language
  readonly languages = ['English', 'Hindi', 'Kannada', 'Tamil']
  selectedLanguage = 'English'
  isOpen = false
  isEditing = true
  isSaving = false
  isRoleMappingLoading = false

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
    this.fracApiService.searchEntities('role', keyword, this.selectedLanguage).subscribe({
      next: (res) => {
        const apiEntity = this.extractEntityList(res)
        const transformed = transformRoles(apiEntity)

        this.rolesData = transformed
        this.roles = [...transformed]
        this.filteredRoles = [...transformed]

        if (this.selectedRole) {
          const matched = transformed.find(r => r.code === this.selectedRole!.code)
          if (!matched) {
            this.selectedRole = null
            this.selectedActivityMap = {}
            this.selectedActivitySummary = []
          }
        }
      },
      error: (e) => {
        console.error('Failed to load roles', e)
        this.rolesData = []
        this.roles = []
        this.filteredRoles = []
      },
    })
  }

  private fetchActivities(keyword: string): void {
    this.fracApiService.searchEntities('activity', keyword, this.selectedLanguage).subscribe({
      next: (res) => {
        const apiEntity = this.extractEntityList(res)
        const transformed = transformActivities(apiEntity) as ActivityItem[]

        this.activitiesData = transformed
        this.activities = [...transformed]
        this.filteredActivities = [...transformed]

        this.buildSelectedActivitySummary()
      },
      error: (e) => {
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

    if (this.roleSearchTerm) {
      this.roleSearch$.next(this.roleSearchTerm)
    } else {
      this.rolesData = []
      this.roles = []
      this.filteredRoles = []
      this.selectedRole = null
      this.selectedActivityMap = {}
      this.selectedActivitySummary = []
    }

    if (this.activitySearchTerm) {
      this.activitySearch$.next(this.activitySearchTerm)
    } else {
      this.activitiesData = []
      this.activities = []
      this.filteredActivities = []
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

    this.loadRoleActivityMappings(role)
  }

  onRoleToggleExpand(role: RoleItem): void {
    this.expandedRole = this.expandedRole === role ? null : role
  }

  private loadRoleActivityMappings(role: RoleItem): void {
    this.isRoleMappingLoading = true

    this.fracApiService.searchEntityMapping('role', role.code, this.selectedLanguage)
      .pipe(
        switchMap((res) => {
          const mappedActivities = this.extractMappedActivities(res)

          if (!mappedActivities.length) {
            return of({ mappedActivities, hydratedActivities: [] as ActivityItem[] })
          }

          const mappedCodes = mappedActivities.map(item => item.code).filter(Boolean)
          return this.fetchActivitiesByCodes(mappedCodes).pipe(
            map((hydratedActivities) => ({ mappedActivities, hydratedActivities })),
          )
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: ({ mappedActivities, hydratedActivities }) => {
          if (this.selectedRole?.code !== role.code) {
            return
          }
          this.isRoleMappingLoading = false
          this.applyMappedActivitiesToRole(role, mappedActivities, hydratedActivities)
        },
        error: (err) => {
          if (this.selectedRole?.code !== role.code) {
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

  private fetchActivitiesByCodes(codes: string[]) {
    const uniqueCodes = Array.from(new Set(codes.filter(Boolean)))

    if (!uniqueCodes.length) {
      return of([] as ActivityItem[])
    }

    const requests = uniqueCodes.map((code) =>
      this.fracApiService.searchEntities('activity', code, this.selectedLanguage).pipe(
        map((res) => {
          const apiEntity = this.extractEntityList(res)
          const transformed = transformActivities(apiEntity) as ActivityItem[]
          const exactMatch = transformed.find(item => item.code === code)
          return exactMatch || transformed[0] || { code, title: '' }
        }),
        catchError(() => of({ code, title: '' } as ActivityItem)),
      ),
    )

    return forkJoin(requests).pipe(
      map((items) => {
        const deduped = new Map<string, ActivityItem>()
        items.forEach((item) => {
          if (item?.code && !deduped.has(item.code)) {
            deduped.set(item.code, item)
          }
        })
        return Array.from(deduped.values())
      }),
    )
  }

  private applyMappedActivitiesToRole(
    role: RoleItem,
    mappedActivities: RoleActivityDetail[],
    hydratedActivities: ActivityItem[],
  ): void {
    const activityDetails: RoleActivityDetail[] = mappedActivities.map((mapped) => {
      const hydrated = hydratedActivities.find(item => item.code === mapped.code)
      return {
        code: mapped.code,
        label: hydrated?.title || mapped.label || '',
      }
    })

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

    this.activitiesData = [...hydratedActivities]
    this.activities = [...hydratedActivities]
    this.filteredActivities = [...hydratedActivities]
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

    this.removeDeselectedActivities()
    this.updateOrInsertActivities()
    this.refreshRolesState()

    this.snackbar.success('Role–activity mapping updated successfully.')
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

    const updatedSelectedRole: RoleItem = {
      ...this.selectedRole,
      code: this.selectedRole.code,
      title: this.selectedRole.title,
    }

    this.roles = this.roles.map(r =>
      r.code === updatedSelectedRole.code ? updatedSelectedRole : r,
    )

    this.rolesData = this.rolesData.map(r =>
      r.code === updatedSelectedRole.code ? updatedSelectedRole : r,
    )

    this.filteredRoles = this.filteredRoles.map(r =>
      r.code === updatedSelectedRole.code ? updatedSelectedRole : r,
    )

    // Track roles that will go into payload
    this.updatedRoles = this.roles.filter(r => r.activityDetails?.length)
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

        const mappedPairs = this.extractMappedPairs(res, payload)
        const successData: UploadResultData = {
          type: 'success',
          title: 'Mapping Saved',
          message: 'Role to activity mappings saved successfully.',
          errorDetails: mappedPairs.join('\n'),
        }
        this.showResultModal(successData)
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

    for (const role of this.updatedRoles) {
      const childCodes = (role.activityDetails ?? []).map(a => a.code).filter(Boolean)
      for (const childCode of childCodes) {
        payload.push({
          parentEntityType: 'Role',
          parentEntityCode: role.code,
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

  private showResultModal(data: UploadResultData): void {
    this.dialog.open(UploadResultModalComponent, {
      width: '440px',
      disableClose: true,
      panelClass: 'upload-result-dialog',
      data,
    })
  }
}
