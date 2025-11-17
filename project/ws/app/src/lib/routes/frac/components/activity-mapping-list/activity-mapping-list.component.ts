import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core'

@Component({
  selector: 'app-activity-mapping-list',
  templateUrl: './activity-mapping-list.component.html',
  styleUrls: ['./activity-mapping-list.component.scss']
})
export class ActivityMappingListComponent implements OnInit, OnChanges {

  @Input() activities: any[] = [];
  @Output() searchChange = new EventEmitter<string>();
  @Output() activitySelected = new EventEmitter<any>();

  searchTerm = '';
  filteredActivities: any[] = [];
  expanded: any = null;

  selectedActivity: any = null; // UI highlight

  ngOnInit() {
    this.filteredActivities = [...this.activities]
  }
  ngOnChanges() {
    this.filteredActivities = [...this.activities]
  }
  // Send search keyword to parent
  onSearchChange() {
    this.searchChange.emit(this.searchTerm)
  }

  expand(item: any) {
    this.expanded = this.expanded === item ? null : item
  }

  // send selected activity to parent
  activitySelectedHandler(a: any) {
    this.selectedActivity = a
    this.activitySelected.emit(a)
  }
}
