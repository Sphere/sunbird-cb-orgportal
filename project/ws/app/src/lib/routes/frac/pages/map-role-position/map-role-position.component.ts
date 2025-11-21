import { Component, OnInit } from '@angular/core'
import { CustomSnackbarService } from '../../services/custom-snackbar.service'
import { transformRoles, transformPositions } from '../../utils/common.util'
import roleMockRes from '../../mock-api-response/mockActivityRes.json'
import positionMockRes from '../../mock-api-response/mockActivityRes.json'

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

interface RolePositionMappingItem {
  type: 'ROLE_POSITION'
  parentId: string
  childMap: null
  childIds: string[]
}

interface RolePositionMappingPayload {
  request: RolePositionMappingItem[]
}

@Component({
  selector: 'ws-app-map-role-position',
  templateUrl: './map-role-position.component.html',
  styleUrls: ['./map-role-position.component.scss'],
})
export class MapRolePositionComponent implements OnInit {

  constructor(private snackbar: CustomSnackbarService) { }

  // language
  readonly languages = ['English', 'Hindi', 'Kannada']
  selectedLanguage = 'English'
  isOpen = false
  isEditing = true

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

  ngOnInit(): void {
    this.loadRoles()
    this.loadPositions()
  }

  // ---------------------------------------------------------------------------
  // Load positions (left)
  // ---------------------------------------------------------------------------
  private loadPositions(): void {
    try {
      const apiEntity = positionMockRes.result?.data?.entity ?? []

      this.positionsData = transformPositions(apiEntity)
      this.positions = [...this.positionsData]
      this.filteredPositions = [...this.positionsData]
    } catch (e) {
      console.error('Failed to load positions', e)
      this.positionsData = []
      this.positions = []
      this.filteredPositions = []
    }
  }

  // ---------------------------------------------------------------------------
  // Load roles (right)
  // ---------------------------------------------------------------------------
  private loadRoles(): void {
    try {
      const apiEntity = roleMockRes.result?.data?.entity ?? []

      const transformed = transformRoles(apiEntity)
      this.rolesData = transformed
      this.roles = []
      this.filteredRoles = []
    } catch (e) {
      console.error('Failed to load roles', e)
      this.rolesData = []
      this.roles = []
      this.filteredRoles = []
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
  // Positions (left pane)
  // ---------------------------------------------------------------------------
  onPositionSearch(keyword: string): void {
    const value = keyword.trim().toLowerCase()
    if (!value) {
      this.filteredPositions = [...this.positionsData]
      this.positions = [...this.positionsData]
      return
    }

    this.filteredPositions = this.positionsData.filter(p =>
      p.code.toLowerCase().includes(value) ||
      p.title.toLowerCase().includes(value),
    )

    this.positions = [...this.filteredPositions]
  }

  onPositionSelected(position: PositionItem): void {
    this.selectedPosition = position

    // restore per-position selection map
    this.restoreSelectedRoleMapFromPosition(position)

    // Show all available roles for the selected position (reset search)
    this.filteredRoles = [...this.rolesData]
    this.roles = [...this.rolesData]
  }

  onPositionToggleExpand(position: PositionItem): void {
    this.expandedPosition = this.expandedPosition === position ? null : position
  }

  private restoreSelectedRoleMapFromPosition(position: PositionItem): void {
    this.selectedRoleMap = {}

    if (!position.roleDetails?.length) {
      this.selectedRoleSummary = []
      return
    }

    for (const r of position.roleDetails) {
      if (!r.code) continue
      this.selectedRoleMap[r.code] = true
    }

    this.buildSelectedRoleSummary()
  }

  // ---------------------------------------------------------------------------
  // Roles (right pane)
  // ---------------------------------------------------------------------------
  onRoleSearch(keyword: string): void {
    const searchValue = keyword.trim().toLowerCase()

    if (!searchValue) {
      this.filteredRoles = [...this.rolesData]
    } else {
      this.filteredRoles = this.rolesData.filter(r =>
        r.code?.toLowerCase().includes(searchValue) ||
        r.title?.toLowerCase().includes(searchValue),
      )
    }
    // This method is called from child component but filtering
    // is already done in the child component itself
    // Parent just needs to emit/track if needed for future use
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
      result.push({
        code,
        label: meta?.title ?? '',
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

    this.removeDeselectedRoles()
    this.updateOrInsertRoles()
    this.refreshPositionsState()

    this.snackbar.success('Position–role mapping updated successfully.')
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

    this.positions = this.positions.map(p =>
      p.code === this.selectedPosition!.code ? { ...this.selectedPosition! } : p,
    )

    this.positionsData = this.positionsData.map(p =>
      p.code === this.selectedPosition!.code ? { ...this.selectedPosition! } : p,
    )

    // Track positions that will go into payload
    this.updatedPositions = this.positions.filter(p => p.roleDetails?.length)

    // Refresh available roles display for the currently selected position
    if (this.selectedPosition) {
      this.filteredRoles = [...this.rolesData]
      this.roles = [...this.rolesData]
    }
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

    console.log('Position–Role payload:', payload)
    // TODO: inject service + call POST here
    this.snackbar.success('Position–role mapping saved (mock).')
  }

  private buildPayload(): RolePositionMappingPayload {
    return {
      request: this.updatedPositions.map(p => ({
        type: 'ROLE_POSITION',
        parentId: p.code,
        childMap: null,
        childIds: (p.roleDetails ?? []).map(r => r.code),
      })),
    }
  }
}
