import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core'

@Component({
  selector: 'app-position-mapping-list',
  templateUrl: './position-mapping-list.component.html',
  styleUrls: ['./position-mapping-list.component.scss']
})
export class PositionMappingListComponent implements OnInit, OnChanges {

  @Input() roles: any[] = []
  @Input() isLoading = false
  @Input() selectedPositionCode: string | null = null
  @Input() searchResetKey = 0

  @Output() searchChange = new EventEmitter<string>()
  @Output() searchSubmit = new EventEmitter<string>()
  @Output() roleSelected = new EventEmitter<any>()
  @Output() toggle = new EventEmitter<any>()

  searchTerm = ''
  filteredRoles: any[] = []
  expandedPositionCode: string | null = null

  ngOnInit(): void {
    this.filteredRoles = [...this.roles]
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['roles']) {
      this.filteredRoles = [...this.roles]
    }
    if (changes['searchResetKey'] && !changes['searchResetKey'].firstChange) {
      this.searchTerm = ''
    }
  }

  onSearchChange(): void {
    this.searchChange.emit(this.searchTerm)
  }

  onSearchSubmit(): void {
    this.searchSubmit.emit(this.searchTerm)
  }

  onHeaderClick(item: any, event: MouseEvent): void {
    event.stopPropagation()
    const itemCode = item?.code || null
    if (itemCode && itemCode !== this.selectedPositionCode) {
      this.roleSelected.emit(item)
    }
    this.expand(item)
  }

  expand(item: any): void {
    const nextCode = item?.code || null
    this.expandedPositionCode = this.expandedPositionCode === nextCode ? null : nextCode
    this.toggle.emit(item)
  }

  roleSelectedHandler(r: any): void {
    this.roleSelected.emit(r)
  }

  trackByCode(index: number, item: any): string {
    return item?.code || `${index}`
  }
}
