import { Component, Input, Output, EventEmitter, OnChanges, OnInit, SimpleChanges } from '@angular/core'
import { FracPositionMappingItem, FracRoleMappingItem, FracSelectionMap } from '../../models/frac-mapping.models'

@Component({
  selector: 'app-role-mapping-table',
  templateUrl: './role-mapping-table.component.html',
  styleUrls: ['./role-mapping-table.component.scss'],
})
export class RoleMappingTableComponent implements OnInit, OnChanges {

  @Input() positions: FracRoleMappingItem[] = []
  @Input() selectedRole: FracPositionMappingItem | null = null
  @Input() selectedPositionMap: FracSelectionMap = {}
  @Input() isLoading = false
  @Input() searchResetKey = 0
  @Input() isReadOnly = false
  @Input() isSaving = false

  @Output() searchChange = new EventEmitter<string>()
  @Output() positionCheckChange = new EventEmitter<{ code: string; checked: boolean }>()
  @Output() addPosition = new EventEmitter<void>()

  searchTerm = ''
  filteredPositions: FracRoleMappingItem[] = []
  sortDirection: 'asc' | 'desc' | '' = 'asc'

  /**
   * Runs when the component is first initialized on the screen.
   */
  ngOnInit(): void {
    this.filteredPositions = [...this.positions]
    this.applySort()
  }

  /**
   * Triggered whenever Angular detects a change to one of the input properties.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['positions']) {
      this.filteredPositions = [...this.positions]
      this.applySort()
    }
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
    this.filteredPositions.sort((a, b) => {
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
    // Search is API-driven from parent; keep input stable across responses.
    this.searchChange.emit(this.searchTerm.trim())
  }

  isChecked(code: string): boolean {
    return !!this.selectedPositionMap?.[code]
  }

  onCheckboxChange(code: string, checked: boolean): void {
    this.positionCheckChange.emit({ code, checked })
  }

  onAddPosition(): void {
    this.addPosition.emit()
  }

  isAddDisabled(): boolean {
    if (!this.selectedRole) return true
    if (this.isSaving) return true

    const hasSelected = Object.values(this.selectedPositionMap || {}).some(v => v)
    const hadPrevious = !!this.selectedRole?.roleDetails?.length

    if (!hasSelected && !hadPrevious) return true
    return false
  }

  get emptyStateMessage(): string {
    const hasSearch = !!this.searchTerm.trim()

    if (!this.selectedRole) {
      return 'Select a position to view and map roles.'
    }

    if (hasSearch) {
      return 'No roles found for your search.'
    }

    return 'No existing roles mapped to this position. Search and add roles.'
  }

  get emptyStateTitle(): string {
    if (!this.selectedRole) {
      return 'Position not selected'
    }
    return this.searchTerm.trim() ? 'No role found' : 'No role mapped yet'
  }

  get emptyStateIcon(): string {
    if (!this.selectedRole) {
      return 'touch_app'
    }
    return this.searchTerm.trim() ? 'manage_search' : 'playlist_add_check'
  }
}
