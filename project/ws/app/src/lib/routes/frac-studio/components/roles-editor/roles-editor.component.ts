import { Component, EventEmitter, Input, Output } from '@angular/core'
import { FRAC_STUDIO_POSTING_VALUES, FRAC_STUDIO_SOURCE_TIERS } from '../../constants/frac-studio.constants'
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
export class RolesEditorComponent {
  @Input() roles: FracRole[] = []
  @Input() postings: FracPosting[] = []
  @Output() readonly rolesChange = new EventEmitter<FracRole[]>()

  readonly postingValues = FRAC_STUDIO_POSTING_VALUES
  readonly tiers = FRAC_STUDIO_SOURCE_TIERS

  /** One sort for every role's activities; P1–P3 columns sort by the key "post:P1". */
  readonly sort = new TableSort<FracActivity>((a, key) => (key.startsWith('post:') ? a.postings[key.slice(5)] : a[key as 'code']))

  /** Role waiting for an inline delete confirmation. */
  confirmDeleteRole: number | null = null

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
    this.emit(moveRole(this.roles, roleIndex, delta))
  }

  deleteRole(roleIndex: number): void {
    this.confirmDeleteRole = null
    this.sort.refresh()
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

  private emit(roles: FracRole[]): void {
    this.rolesChange.emit(roles)
  }
}
