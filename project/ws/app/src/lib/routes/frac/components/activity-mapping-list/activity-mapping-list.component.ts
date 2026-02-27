import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core'
import { FracActivityMappingItem, FracMappingDetail } from '../../models/frac-mapping.models'

@Component({
  selector: 'app-activity-mapping-list',
  templateUrl: './activity-mapping-list.component.html',
  styleUrls: ['./activity-mapping-list.component.scss']
})
export class ActivityMappingListComponent implements OnInit, OnChanges {

  /* INPUT: List of activities */
  @Input() activities: FracActivityMappingItem[] = [];
  @Input() isLoading = false;
  @Input() selectedActivityCode: string | null = null;
  @Input() searchResetKey = 0;

  /* OUTPUT: Emit search keyword to parent */
  @Output() searchChange = new EventEmitter<string>();

  /* OUTPUT: Notify parent when user selects an activity */
  @Output() activitySelected = new EventEmitter<FracActivityMappingItem>();

  searchTerm = '';
  filteredActivities: FracActivityMappingItem[] = [];
  expanded: FracActivityMappingItem | null = null;

  /**
   * Runs when the component is first initialized on the screen.
   */
  ngOnInit() {
    this.filteredActivities = [...this.activities]
    this.applySort()
  }

  /**
   * Triggered whenever Angular detects a change to one of the input properties.
   */
  ngOnChanges(changes: SimpleChanges) {
    this.filteredActivities = [...this.activities]
    this.applySort()
    if (changes['searchResetKey'] && !changes['searchResetKey'].firstChange) {
      this.searchTerm = ''
    }
  }

  private applySort(): void {
    this.filteredActivities.sort((a, b) => {
      const aStr = (a.code || '').toLowerCase()
      const bStr = (b.code || '').toLowerCase()
      return aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' })
    })
  }

  /** Emit search keyword to parent */
  onSearchChange() {
    this.searchChange.emit(this.searchTerm)
  }

  /** Expand/collapse a card */
  expand(item: FracActivityMappingItem): void {
    this.expanded = this.expanded === item ? null : item
  }

  onHeaderClick(item: FracActivityMappingItem, event: MouseEvent): void {
    event.stopPropagation()
    if (this.selectedActivityCode !== item.code) {
      this.activitySelected.emit(item)
    } else {
      this.expand(item)
    }
  }

  /** User clicked an activity */
  activitySelectedHandler(a: FracActivityMappingItem): void {
    this.activitySelected.emit(a)
  }

  trackByCode(index: number, item: FracActivityMappingItem): string {
    return item?.code || `${index}`
  }

  /** Check if activity has any valid competency levels */
  hasValidLevels(activity: FracActivityMappingItem): boolean {
    if (!activity?.competencyDetails?.length) return false

    return activity.competencyDetails.some((c: FracMappingDetail) =>
      c.levels && c.levels.trim() !== ''
    )
  }
}
