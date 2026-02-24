import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core'

@Component({
  selector: 'app-role-mapping-list',
  templateUrl: './role-mapping-list.component.html',
  styleUrls: ['./role-mapping-list.component.scss']
})
export class RoleMappingListComponent implements OnInit, OnChanges {

  @Input() roles: any[] = []
  @Input() isLoading = false
  @Input() selectedRoleCode: string | null = null

  @Output() searchChange = new EventEmitter<string>()
  @Output() roleSelected = new EventEmitter<any>()
  @Output() toggle = new EventEmitter<any>()

  searchTerm = ''
  filteredRoles: any[] = []
  expandedRoleCode: string | null = null

  ngOnInit(): void {
    this.filteredRoles = [...this.roles]
  }

  ngOnChanges(): void {
    this.filteredRoles = [...this.roles]
  }

  onSearchChange(): void {
    this.searchChange.emit(this.searchTerm)
  }

  onHeaderClick(item: any, event: MouseEvent): void {
    event.stopPropagation()
    const itemCode = item?.code || null
    if (itemCode && itemCode !== this.selectedRoleCode) {
      this.roleSelected.emit(item)
    }
    this.expand(item)
  }

  expand(item: any): void {
    const nextCode = item?.code || null
    this.expandedRoleCode = this.expandedRoleCode === nextCode ? null : nextCode
    this.toggle.emit(item)
  }

  roleSelectedHandler(r: any): void {
    this.roleSelected.emit(r)
  }

  trackByCode(index: number, item: any): string {
    return item?.code || `${index}`
  }
}
