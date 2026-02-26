import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core'

@Component({
  selector: 'app-activity-mapping-list',
  templateUrl: './activity-mapping-list.component.html',
  styleUrls: ['./activity-mapping-list.component.scss']
})
export class ActivityMappingListComponent implements OnInit, OnChanges {

  /* INPUT: List of activities */
  @Input() activities: any[] = [];
  @Input() isLoading = false;
  @Input() selectedActivityCode: string | null = null;
  @Input() searchResetKey = 0;

  /* OUTPUT: Emit search keyword to parent */
  @Output() searchChange = new EventEmitter<string>();

  /* OUTPUT: Notify parent when user selects an activity */
  @Output() activitySelected = new EventEmitter<any>();

  searchTerm = '';
  filteredActivities: any[] = [];
  expanded: any = null;

  ngOnInit() {
    this.filteredActivities = [...this.activities]
  }

  ngOnChanges(changes: SimpleChanges) {
    this.filteredActivities = [...this.activities]
    if (changes['searchResetKey'] && !changes['searchResetKey'].firstChange) {
      this.searchTerm = ''
    }
  }

  /** Emit search keyword to parent */
  onSearchChange() {
    this.searchChange.emit(this.searchTerm)
  }

  /** Expand/collapse a card */
  expand(item: any) {
    this.expanded = this.expanded === item ? null : item
  }

  /** User clicked an activity */
  activitySelectedHandler(a: any) {
    this.activitySelected.emit(a)
  }

  trackByCode(index: number, item: any): string {
    return item?.code || `${index}`
  }

  /** Check if activity has any valid competency levels */
  hasValidLevels(activity: any): boolean {
    if (!activity?.competencyDetails?.length) return false

    return activity.competencyDetails.some((c: any) =>
      c.levels && c.levels.trim() !== ''
    )
  }
}
