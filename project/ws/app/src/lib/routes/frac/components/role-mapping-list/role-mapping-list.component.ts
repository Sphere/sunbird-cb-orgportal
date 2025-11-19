import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core'

@Component({
  selector: 'app-role-mapping-list',
  templateUrl: './role-mapping-list.component.html',
  styleUrls: ['./role-mapping-list.component.scss']
})
export class RoleMappingListComponent implements OnInit, OnChanges {

  @Input() roles: any[] = []

  @Output() searchChange = new EventEmitter<string>()
  @Output() roleSelected = new EventEmitter<any>()
  @Output() toggle = new EventEmitter<any>()

  searchTerm = ''
  filteredRoles: any[] = []
  selectedRole: any = null
  expanded: any = null

  ngOnInit(): void {
    this.filteredRoles = [...this.roles]
  }

  ngOnChanges(): void {
    this.filteredRoles = [...this.roles]
  }

  onSearchChange(): void {
    this.searchChange.emit(this.searchTerm)
  }

  expand(item: any): void {
    this.expanded = this.expanded === item ? null : item
    this.toggle.emit(item)
  }

  roleSelectedHandler(r: any): void {
    this.selectedRole = r
    this.roleSelected.emit(r)
  }
}
