import { Component, Input, Output, EventEmitter, OnChanges, OnInit, SimpleChanges } from '@angular/core'

@Component({
  selector: 'app-role-mapping-table',
  templateUrl: './role-mapping-table.component.html',
  styleUrls: ['./role-mapping-table.component.scss'],
})
export class RoleMappingTableComponent implements OnInit, OnChanges {

  @Input() positions: any[] = []
  @Input() selectedRole: any = null
  @Input() selectedPositionMap: { [code: string]: boolean } = {}
  @Input() isLoading = false

  @Output() searchChange = new EventEmitter<string>()
  @Output() positionCheckChange = new EventEmitter<{ code: string; checked: boolean }>()
  @Output() addPosition = new EventEmitter<void>()

  searchTerm = ''
  filteredPositions: any[] = []

  ngOnInit(): void {
    this.filteredPositions = [...this.positions]
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['positions']) {
      this.filteredPositions = [...this.positions]
    }
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
}
