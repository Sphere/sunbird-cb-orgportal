import { Component, Input, Output, EventEmitter, OnChanges, OnInit } from '@angular/core'

@Component({
  selector: 'app-activity-mapping-table',
  templateUrl: './activity-mapping-table.component.html',
  styleUrls: ['./activity-mapping-table.component.scss'],
})
export class ActivityMappingTableComponent implements OnInit, OnChanges {

  @Input() activities: any[] = []
  @Input() selectedRole: any = null
  @Input() selectedActivityMap: { [code: string]: boolean } = {}

  @Output() searchChange = new EventEmitter<string>()
  @Output() activityCheckChange = new EventEmitter<{ code: string; checked: boolean }>()
  @Output() addActivity = new EventEmitter<void>()

  searchTerm = ''
  filteredActivities: any[] = []

  ngOnInit(): void {
    this.filteredActivities = [...this.activities]
  }

  ngOnChanges(): void {
    this.filteredActivities = [...this.activities]
  }

  onSearchChange(): void {
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
    if (!this.selectedRole) return true

    const hasSelected = Object.values(this.selectedActivityMap || {}).some(v => v)
    const hadPrevious = !!this.selectedRole?.activityDetails?.length

    if (!hasSelected && !hadPrevious) return true
    return false
  }
}
