import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core'
import { FRAC_STUDIO_POSTING_VALUES, FRAC_STUDIO_ROLES_COLLAPSE_FROM, FRAC_STUDIO_SOURCE_TIERS } from '../../constants/frac-studio.constants'
import { FracActivity, FracPosting, FracRole } from '../../models/frac-studio.models'
import {
  addActivity,
  addRole,
  moveRole,
  removeActivity,
  removeRole,
  updateActivity,
  updateRole,
} from '../../utils/frac-studio-edit.util'
import { SortedRow, TableSort } from '../../utils/frac-studio-sort.util'

/**
 * Roles & activities editor (spec 5.3 + gap 7). Emits a new roles array on every change;
 * the Creator page autosaves it. Codes renumber after any structural change.
 */
@Component({
  selector: 'ws-app-frac-roles-editor',
  templateUrl: './roles-editor.component.html',
  styleUrls: ['./roles-editor.component.scss'],
  standalone: false,
})
export class RolesEditorComponent implements OnChanges {
  @Input() roles: FracRole[] = []
  @Input() postings: FracPosting[] = []
  @Output() readonly rolesChange = new EventEmitter<FracRole[]>()

  readonly postingValues = FRAC_STUDIO_POSTING_VALUES
  readonly tiers = FRAC_STUDIO_SOURCE_TIERS

  /** One sort for every role's activities; posting columns sort by the key "post:P1", "post:P2"… */
  readonly sort = new TableSort<FracActivity>((a, key) => (key.startsWith('post:') ? a.postings[key.slice(5)] : a[key as 'code']))

  /** Role waiting for an inline delete confirmation. */
  confirmDeleteRole: number | null = null

  /** Roles shown closed, by position. A long FRAC opens with only its first role expanded; new roles open expanded. */
  collapsed = new Set<number>()
  private seeded = false

  ngOnChanges(): void {
    if (!this.seeded && this.roles.length) {
      this.seeded = true
      if (this.roles.length > FRAC_STUDIO_ROLES_COLLAPSE_FROM) {
        this.roles.forEach((_, i) => i > 0 && this.collapsed.add(i))
      }
    }
  }

  isOpen(roleIndex: number): boolean {
    return !this.collapsed.has(roleIndex)
  }

  toggle(roleIndex: number): void {
    if (this.collapsed.has(roleIndex)) {
      this.collapsed.delete(roleIndex)
    } else {
      this.collapsed.add(roleIndex)
    }
  }

  expandAll(): void {
    this.collapsed.clear()
  }

  collapseAll(): void {
    this.collapsed = new Set(this.roles.map((_, i) => i))
  }

  /** Activities in a role not yet mapped to a competency, for the count on its header. */
  unmapped(role: FracRole): number {
    return role.activities.filter(a => !a.comp.trim()).length
  }

  setRoleTitle(roleIndex: number, title: string): void {
    this.emit(updateRole(this.roles, roleIndex, { title }))
  }

  setActivity(roleIndex: number, activityIndex: number, patch: Partial<FracActivity>): void {
    this.emit(updateActivity(this.roles, roleIndex, activityIndex, patch))
  }

  setPosting(roleIndex: number, activityIndex: number, key: string, value: string): void {
    const current = this.roles[roleIndex].activities[activityIndex].postings
    this.setActivity(roleIndex, activityIndex, { postings: { ...current, [key]: value } })
  }

  addRole(): void {
    this.emit(addRole(this.roles))
  }

  moveRole(roleIndex: number, delta: -1 | 1): void {
    this.sort.refresh() // the kept orders are per role position
    // The open or closed state moves with the role
    const other = roleIndex + delta
    const [a, b] = [this.collapsed.has(roleIndex), this.collapsed.has(other)]
    this.setCollapsed(roleIndex, b)
    this.setCollapsed(other, a)
    this.emit(moveRole(this.roles, roleIndex, delta))
  }

  deleteRole(roleIndex: number): void {
    this.confirmDeleteRole = null
    this.sort.refresh()
    // Roles after the deleted one move up a place, and keep their open or closed state
    this.collapsed = new Set([...this.collapsed].filter(i => i !== roleIndex).map(i => (i > roleIndex ? i - 1 : i)))
    this.emit(removeRole(this.roles, roleIndex))
  }

  addActivity(roleIndex: number): void {
    this.emit(addActivity(this.roles, roleIndex, this.postings))
  }

  deleteActivity(roleIndex: number, activityIndex: number): void {
    this.emit(removeActivity(this.roles, roleIndex, activityIndex))
  }

  trackByIndex(index: number): number {
    return index
  }

  trackByRow(_index: number, row: SortedRow<FracActivity>): number {
    return row.index
  }

  private setCollapsed(roleIndex: number, closed: boolean): void {
    if (closed) {
      this.collapsed.add(roleIndex)
    } else {
      this.collapsed.delete(roleIndex)
    }
  }

  private emit(roles: FracRole[]): void {
    this.rolesChange.emit(roles)
  }
}
