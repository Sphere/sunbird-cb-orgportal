import { Component, Input, Output, EventEmitter, OnChanges, OnInit, SimpleChanges } from '@angular/core'
import { FracActivityMappingItem, FracRoleMappingItem, FracSelectionMap } from '../../models/frac-mapping.models'

@Component({
  standalone: false,
  selector: 'app-activity-mapping-table',
  templateUrl: './activity-mapping-table.component.html',
  styleUrls: ['./activity-mapping-table.component.scss'],
})
export class ActivityMappingTableComponent implements OnInit, OnChanges {

  @Input() activities: FracActivityMappingItem[] = []
  @Input() selectedRole: FracRoleMappingItem | null = null
  @Input() selectedActivityMap: FracSelectionMap = {}
  @Input() isLoading = false
  @Input() isActionLoading = false
  @Input() searchResetKey = 0
  @Input() isReadOnly = false
  @Input() isSaving = false

  @Output() searchChange = new EventEmitter<string>()
  @Output() activityCheckChange = new EventEmitter<{ code: string; checked: boolean }>()
  @Output() addActivity = new EventEmitter<void>()

  searchTerm = ''
  filteredActivities: FracActivityMappingItem[] = []
  sortDirection: 'asc' | 'desc' | '' = 'asc'

  /**
   * Runs when the component is first initialized on the screen.
   */
  ngOnInit(): void {
    this.filteredActivities = [...this.activities]
    this.applySort()
  }

  /**
   * Triggered whenever Angular detects a change to one of the input properties.
   */
  ngOnChanges(changes: SimpleChanges): void {
    this.filteredActivities = [...this.activities]
    this.applySort()
    if (changes['searchResetKey'] && !changes['searchResetKey'].firstChange) {
      this.searchTerm = ''
    }
  }

  toggleSort(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'
    this.applySort()
  }

  applySort(): void {
    if (!this.sortDirection) return
    this.filteredActivities.sort((a, b) => {
      const aStr = (a.code || '').toLowerCase()
      const bStr = (b.code || '').toLowerCase()
      const modifier = this.sortDirection === 'desc' ? -1 : 1
      return aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' }) * modifier
    })
  }

  onSearchChange(): void {
    if (!this.selectedRole) {
      return
    }
    this.searchChange.emit(this.searchTerm)
  }

  isChecked(code: string): boolean {
    return !!this.selectedActivityMap?.[code]
  }

  onCheckboxChange(code: string, checked: boolean): void {
    this.activityCheckChange.emit({ code, checked })
  }

  onAddActivity(): void {
    this.addActivity.emit()
  }

  isAddDisabled(): boolean {
    if (this.isLoading || this.isActionLoading || this.isSaving) return true
    if (!this.selectedRole) return true

    const hasSelected = Object.values(this.selectedActivityMap || {}).some(v => v)
    const hadPrevious = !!this.selectedRole?.activityDetails?.length

    if (!hasSelected && !hadPrevious) return true
    return false
  }

  get emptyStateMessage(): string {
    const hasSearch = !!this.searchTerm.trim()

    if (!this.selectedRole) {
      return 'Select a role to view and map activities.'
    }

    if (hasSearch) {
      return 'No activities found for your search.'
    }

    return 'No existing activities mapped to this role. Search and add activities.'
  }

  get emptyStateTitle(): string {
    if (!this.selectedRole) {
      return 'Role not selected'
    }
    return this.searchTerm.trim() ? 'No activity found' : 'No activity mapped yet'
  }

  get emptyStateIcon(): string {
    if (!this.selectedRole) {
      return 'touch_app'
    }
    return this.searchTerm.trim() ? 'manage_search' : 'playlist_add_check'
  }
}
