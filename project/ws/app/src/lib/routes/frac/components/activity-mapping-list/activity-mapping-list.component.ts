import { Component, Input } from '@angular/core'

@Component({
  selector: 'app-activity-mapping-list',
  templateUrl: './activity-mapping-list.component.html',
  styleUrls: ['./activity-mapping-list.component.scss']
})
export class ActivityMappingListComponent {

  @Input() activities: any[] = [];

  searchTerm = '';
  filteredActivities: any[] = [];
  expanded: any = null;

  ngOnInit() {
    this.filteredActivities = this.activities.map(a => ({
      ...a,
      // competencyDetails: [
      //   { level: 'L1 L2', label: 'C1- Pregnancy Identification' },
      //   { level: 'L2 L3', label: 'C2- Birth Planning and Prep...' },
      //   { level: 'L1 L4 L5', label: 'C3- Vaginal Examination' },
      //   { level: 'L1-L5', label: 'C4- Normal delivery' },
      // ]
    }))
  }

  onSearchChange() {
    const t = this.searchTerm.toLowerCase()

    this.filteredActivities = this.activities.filter(a =>
      a.code.toLowerCase().includes(t) ||
      a.title.toLowerCase().includes(t)
    )
  }

  expand(item: any) {
    this.expanded = this.expanded === item ? null : item
  }


}
