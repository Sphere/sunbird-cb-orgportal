import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'

@Component({
  selector: 'ws-search-selected-filter',
  templateUrl: './search-selected-filter.component.html',
  styleUrls: ['./search-selected-filter.component.scss'],
})
export class SearchSelectedFilterComponent implements OnInit {
  @Input() selectedFilters: any
  @Input() queryParamsToOmit: any
  @Output() filterChange: EventEmitter<{ status: string, filters?: any }> = new EventEmitter()

  constructor() { }

  ngOnInit() {
  }
  changeFilter(filter: any) {
    if (filter) {
      this.selectedFilters = this.selectedFilters.filter((item: any) => item.label !== filter)
    }
    this.filterChange.emit(this.selectedFilters)
  }

}
