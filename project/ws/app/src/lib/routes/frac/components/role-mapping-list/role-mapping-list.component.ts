import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core'
import { FracRoleMappingItem } from '../../models/frac-mapping.models'

@Component({
  standalone: false,
  selector: 'app-role-mapping-list',
  templateUrl: './role-mapping-list.component.html',
  styleUrls: ['./role-mapping-list.component.scss']
})
export class RoleMappingListComponent implements OnInit, OnChanges {
  private readonly collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

  @Input() roles: FracRoleMappingItem[] = []
  @Input() isLoading = false
  @Input() selectedRoleCode: string | null = null
  @Input() searchResetKey = 0

  @Output() searchChange = new EventEmitter<string>()
  @Output() roleSelected = new EventEmitter<FracRoleMappingItem>()
  @Output() toggle = new EventEmitter<FracRoleMappingItem>()

  searchTerm = ''
  filteredRoles: FracRoleMappingItem[] = []
  expandedRoleCode: string | null = null

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
    this.filteredRoles = [...this.roles]
    this.applySort()
    if (changes['searchResetKey'] && !changes['searchResetKey'].firstChange) {
      this.searchTerm = ''
    }
  }

  private applySort(): void {
    this.filteredRoles.sort((a, b) => {
      return this.compareEntities(a.code, a.title, b.code, b.title)
    })
  }

  onSearchChange(): void {
    this.searchChange.emit(this.searchTerm)
  }

  onHeaderClick(item: FracRoleMappingItem, event: MouseEvent): void {
    event.stopPropagation()
    const itemCode = item?.code || null
    if (itemCode && itemCode !== this.selectedRoleCode) {
      this.roleSelected.emit(item)
    } else {
      this.expand(item)
    }
  }

  expand(item: FracRoleMappingItem): void {
    const nextCode = item?.code || null
    this.expandedRoleCode = this.expandedRoleCode === nextCode ? null : nextCode
    this.toggle.emit(item)
  }

  roleSelectedHandler(r: FracRoleMappingItem): void {
    this.roleSelected.emit(r)
  }

  trackByCode(index: number, item: FracRoleMappingItem): string {
    return item?.code || `${index}`
  }

  getSortedActivities(role: FracRoleMappingItem): FracRoleMappingItem['activityDetails'] {
    const details = role?.activityDetails || []
    return [...details].sort((a, b) => this.compareEntities(a.code, a.label, b.code, b.label))
  }

  private compareEntities(aCode?: string, aLabel?: string, bCode?: string, bLabel?: string): number {
    const codeCompare = this.collator.compare(aCode || '', bCode || '')
    if (codeCompare !== 0) {
      return codeCompare
    }
    return this.collator.compare(aLabel || '', bLabel || '')
  }
}
