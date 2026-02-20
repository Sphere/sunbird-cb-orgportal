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
    const hadPrevious = !!this.selectedRole?.positionDetails?.length

    if (!hasSelected && !hadPrevious) return true
    return false
  }
}
