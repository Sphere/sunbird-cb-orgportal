import { Component, Inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { Router } from '@angular/router'
import { MappedActivity, MappedCompetency, MappedRole } from '../../utils/common.util'
import { FRAC_ROUTES } from '../../constants/frac.constants'

export interface PositionHierarchyViewModalData {
  positionName: string
  positionCode: string
  roles: MappedRole[]
  language?: string
}

/**
 * Read-only dialog that shows the full mapping tree for a position:
 * Position → Roles → Activities → Competencies (with levels).
 * Each Role and Activity row is independently expandable.
 * Side effect: the "Edit Mapping" button closes the dialog and navigates to the mapping page.
 */
@Component({
  selector: 'ws-app-position-hierarchy-view-modal',
  templateUrl: './position-hierarchy-view-modal.component.html',
  styleUrls: ['./position-hierarchy-view-modal.component.scss'],
})
export class PositionHierarchyViewModalComponent {
  /** Tracks which role codes are expanded. */
  expandedRoles = new Set<string>()

  /** Tracks which activity codes are expanded, keyed by roleCode::activityCode. */
  expandedActivities = new Set<string>()

  private readonly collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

  constructor(
    private readonly dialogRef: MatDialogRef<PositionHierarchyViewModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PositionHierarchyViewModalData,
    private readonly router: Router,
  ) { }

  get roles(): MappedRole[] {
    const roles = this.data.roles || []
    return [...roles].sort((a, b) => this.compareEntities(a.code, a.name, b.code, b.name))
  }

  get totalRoles(): number {
    return this.roles.length
  }

  get totalActivities(): number {
    return this.roles.reduce((sum, role) => sum + (role.activities || []).length, 0)
  }

  get totalCompetencies(): number {
    return this.roles.reduce((sum, role) =>
      sum + (role.activities || []).reduce((s, act) => s + (act.competencies || []).length, 0), 0)
  }

  get hasMapping(): boolean {
    return this.roles.length > 0
  }

  /**
   * Toggles a role row open or closed.
   * @param roleCode The role entity code to toggle.
   */
  toggleRole(roleCode: string): void {
    if (this.expandedRoles.has(roleCode)) {
      this.expandedRoles.delete(roleCode)
    } else {
      this.expandedRoles.add(roleCode)
    }
  }

  /**
   * Returns true if the role row is currently expanded.
   * @param roleCode The role entity code to check.
   */
  isRoleExpanded(roleCode: string): boolean {
    return this.expandedRoles.has(roleCode)
  }

  /**
   * Toggles an activity row open or closed within a role.
   * @param roleCode Parent role code.
   * @param activityCode The activity entity code to toggle.
   */
  toggleActivity(roleCode: string, activityCode: string): void {
    const key = `${roleCode}::${activityCode}`
    if (this.expandedActivities.has(key)) {
      this.expandedActivities.delete(key)
    } else {
      this.expandedActivities.add(key)
    }
  }

  /**
   * Returns true if the activity row is currently expanded.
   * @param roleCode Parent role code.
   * @param activityCode The activity entity code to check.
   */
  isActivityExpanded(roleCode: string, activityCode: string): boolean {
    return this.expandedActivities.has(`${roleCode}::${activityCode}`)
  }

  /**
   * Returns a compact display string for a competency's levels.
   * Consecutive ranges are shown as 'L1-L5'; sparse sets as 'L1, L3'.
   * @param competency The competency to format levels for.
   * @returns e.g. 'L1-L5' or 'L1, L3' or '' if no levels.
   */
  formatLevelRange(competency: MappedCompetency): string {
    const levels = this.getLevels(competency)
    if (!levels.length) {
      return ''
    }
    if (levels.length === 1) {
      return levels[0]
    }

    const nums = levels.map(l => Number(l.replace(/[^0-9]/g, ''))).filter(n => Number.isFinite(n))
    if (nums.length !== levels.length) {
      return levels.join(', ')
    }

    const isConsecutive = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1)
    if (isConsecutive) {
      return `L${nums[0]}-L${nums[nums.length - 1]}`
    }

    return levels.join(', ')
  }

  /**
   * Returns levels for a competency, falling back to empty array.
   * @param competency The competency to get levels for.
   */
  getLevels(competency: MappedCompetency): string[] {
    return Array.isArray(competency.levels) ? competency.levels : []
  }

  /**
   * Returns all activities for a given role.
   * @param role The role to get activities for.
   */
  getActivities(role: MappedRole): MappedActivity[] {
    const activities = role.activities || []
    return [...activities].sort((a, b) => this.compareEntities(a.code, a.name, b.code, b.name))
  }

  /**
   * Returns all competencies for a given activity, sorted by code then name.
   */
  getCompetencies(activity: MappedActivity): MappedCompetency[] {
    const competencies = activity.competencies || []
    return [...competencies].sort((a, b) => this.compareEntities(a.code, a.name, b.code, b.name))
  }

  private compareEntities(aCode: string, aName: string | undefined, bCode: string, bName: string | undefined): number {
    const codeCompare = this.collator.compare(aCode || '', bCode || '')
    if (codeCompare !== 0) {
      return codeCompare
    }
    return this.collator.compare(aName || '', bName || '')
  }

  /**
   * Closes the dialog and navigates to the map-role-position page for editing.
   * Side effect: navigation + dialog close.
   */
  onEditMapping(): void {
    const queryParams = this.data.positionCode ? { positionCode: this.data.positionCode } : {}
    this.dialogRef.close()
    this.router.navigate([FRAC_ROUTES.mapRolePosition], { queryParams })
  }

  /** Closes the dialog without any action. */
  onClose(): void {
    this.dialogRef.close()
  }
}
