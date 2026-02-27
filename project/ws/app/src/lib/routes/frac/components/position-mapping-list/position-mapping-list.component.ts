import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core'
import { FracPositionMappingItem } from '../../models/frac-mapping.models'

@Component({
  selector: 'app-position-mapping-list',
  templateUrl: './position-mapping-list.component.html',
  styleUrls: ['./position-mapping-list.component.scss']
})
export class PositionMappingListComponent implements OnInit, OnChanges {

  @Input() roles: FracPositionMappingItem[] = []
  @Input() isLoading = false
  @Input() selectedPositionCode: string | null = null
  @Input() searchResetKey = 0

  @Output() searchChange = new EventEmitter<string>()
  @Output() searchSubmit = new EventEmitter<string>()
  @Output() roleSelected = new EventEmitter<FracPositionMappingItem>()
  @Output() toggle = new EventEmitter<FracPositionMappingItem>()

  searchTerm = ''
  filteredRoles: FracPositionMappingItem[] = []
  expandedPositionCode: string | null = null

  /**
   * Runs when the component is first initialized on the screen.
   */
  ngOnInit(): void {
    this.filteredRoles = [...this.roles]
    this.applySort()
  }

  /**
   * Triggered whenever Angular detects a change to one of the input properties.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['roles']) {
      this.filteredRoles = [...this.roles]
      this.applySort()
    }
    if (changes['searchResetKey'] && !changes['searchResetKey'].firstChange) {
      this.searchTerm = ''
    }
  }

  private applySort(): void {
    this.filteredRoles.sort((a, b) => {
      const aStr = (a.code || '').toLowerCase()
      const bStr = (b.code || '').toLowerCase()
      return aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' })
    })
  }

  onSearchChange(): void {
    this.searchChange.emit(this.searchTerm)
  }

  onSearchSubmit(): void {
    this.searchSubmit.emit(this.searchTerm)
  }

  onHeaderClick(item: FracPositionMappingItem, event: MouseEvent): void {
    event.stopPropagation()
    const itemCode = item?.code || null
    if (itemCode && itemCode !== this.selectedPositionCode) {
      this.roleSelected.emit(item)
    } else {
      this.expand(item)
    }
  }

  expand(item: FracPositionMappingItem): void {
    const nextCode = item?.code || null
    this.expandedPositionCode = this.expandedPositionCode === nextCode ? null : nextCode
    this.toggle.emit(item)
  }

  roleSelectedHandler(r: FracPositionMappingItem): void {
    this.roleSelected.emit(r)
  }

  trackByCode(index: number, item: FracPositionMappingItem): string {
    return item?.code || `${index}`
  }
}
