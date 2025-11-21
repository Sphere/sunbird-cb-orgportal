import { Component, OnInit } from '@angular/core'
import { CustomSnackbarService } from '../../services/custom-snackbar.service'
import { transformRoles, transformActivities } from '../../utils/common.util'
import roleMockRes from '../../mock-api-response/mockActivityRes.json'
import activityMockRes from '../../mock-api-response/mockActivityRes.json'

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

interface RoleActivityMappingItem {
  type: 'ROLE_ACTIVITY'
  parentId: string
  childMap: null
  childIds: string[]
}

interface RoleActivityMappingPayload {
  request: RoleActivityMappingItem[]
}

@Component({
  selector: 'ws-app-map-role-activities',
  templateUrl: './map-role-activities.component.html',
  styleUrls: ['./map-role-activities.component.scss'],
})
export class MapRoleActivitiesComponent implements OnInit {

  constructor(private snackbar: CustomSnackbarService) { }

  // language
  readonly languages = ['English', 'Hindi', 'Kannada']
  selectedLanguage = 'English'
  isOpen = false
  isEditing = true

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

  ngOnInit(): void {
    this.loadRoles()
    this.loadActivities()
  }

  // ---------------------------------------------------------------------------
  // Load roles (left)
  // ---------------------------------------------------------------------------
  private loadRoles(): void {
    try {
      const apiEntity = roleMockRes.result?.data?.entity ?? []

      this.rolesData = transformRoles(apiEntity)
      this.roles = [...this.rolesData]
      this.filteredRoles = [...this.rolesData]
    } catch (e) {
      console.error('Failed to load roles', e)
      this.rolesData = []
      this.roles = []
      this.filteredRoles = []
    }
  }

  // ---------------------------------------------------------------------------
  // Load activities (right)
  // ---------------------------------------------------------------------------
  private loadActivities(): void {
    try {
      const apiEntity = activityMockRes.result?.data?.entity ?? []

      const transformed = transformActivities(apiEntity)
      // transformActivities already builds { code, title }
      this.activitiesData = transformed
      this.activities = []
      this.filteredActivities = []
    } catch (e) {
      console.error('Failed to load activities', e)
      this.activitiesData = []
      this.activities = []
      this.filteredActivities = []
    }
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
  }

  // ---------------------------------------------------------------------------
  // Roles (left pane)
  // ---------------------------------------------------------------------------
  onRoleSearch(keyword: string): void {
    const value = keyword.trim().toLowerCase()
    if (!value) {
      this.filteredRoles = [...this.rolesData]
      this.roles = [...this.rolesData]
      return
    }

    this.filteredRoles = this.rolesData.filter(r =>
      r.code.toLowerCase().includes(value) ||
      r.title.toLowerCase().includes(value),
    )

    this.roles = [...this.filteredRoles]
  }

  onRoleSelected(role: RoleItem): void {
    this.selectedRole = role

    // restore per-role selection map
    this.restoreSelectedActivityMapFromRole(role)

    // make sure activities list is the full list initially
    this.activities = [...this.activitiesData]
    this.filteredActivities = [...this.activitiesData]
  }

  onRoleToggleExpand(role: RoleItem): void {
    this.expandedRole = this.expandedRole === role ? null : role
  }

  private restoreSelectedActivityMapFromRole(role: RoleItem): void {
    this.selectedActivityMap = {}

    if (!role.activityDetails?.length) {
      this.selectedActivitySummary = []
      return
    }

    for (const a of role.activityDetails) {
      if (!a.code) continue
      this.selectedActivityMap[a.code] = true
    }

    this.buildSelectedActivitySummary()
  }

  // ---------------------------------------------------------------------------
  // Activities (right pane)
  // ---------------------------------------------------------------------------
  onActivitySearch(keyword: string): void {
    const value = keyword.trim().toLowerCase()
    if (!value) {
      this.filteredActivities = [...this.activitiesData]
      this.activities = [...this.activitiesData]
      return
    }

    this.filteredActivities = this.activitiesData.filter(a =>
      a.code.toLowerCase().includes(value) ||
      a.title.toLowerCase().includes(value),
    )

    this.activities = [...this.filteredActivities]
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
      result.push({
        code,
        label: meta?.title ?? '',
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

    this.roles = this.roles.map(r =>
      r.code === this.selectedRole!.code ? { ...this.selectedRole! } : r,
    )

    this.rolesData = this.rolesData.map(r =>
      r.code === this.selectedRole!.code ? { ...this.selectedRole! } : r,
    )

    // Track roles that will go into payload
    this.updatedRoles = this.roles.filter(r => r.activityDetails?.length)
  }

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------
  onSaveClicked(): void {
    const payload = this.buildPayload()

    if (!payload.request.length) {
      this.snackbar.warning('Nothing to save !!')
      return
    }

    console.log('Role–Activity payload:', payload)
    // TODO: inject service + call POST here
    this.snackbar.success('Role–activity mapping saved (mock).')
  }

  private buildPayload(): RoleActivityMappingPayload {
    return {
      request: this.updatedRoles.map(r => ({
        type: 'ROLE_ACTIVITY',        // <<< adjust if backend uses other type
        parentId: r.code,
        childMap: null,
        childIds: (r.activityDetails ?? []).map(a => a.code),
      })),
    }
  }
}
