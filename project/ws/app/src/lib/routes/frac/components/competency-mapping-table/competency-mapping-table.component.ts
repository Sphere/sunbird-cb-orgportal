import { Component, Input, Output, EventEmitter } from '@angular/core'

@Component({
  selector: 'app-competency-mapping-table',
  templateUrl: './competency-mapping-table.component.html',
  styleUrls: ['./competency-mapping-table.component.scss']
})
export class CompetencyMappingTableComponent {

  @Input() competencies: any[] = [];
  @Input() selectedMap: any = {};

  // EVERYTHING dynamic — nothing hardcoded in HTML
  @Input() headerConfig = {
    codeLabel: 'Code & Label',
    levels: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'],
    searchPlaceholder: 'Search Competency'
  };

  @Input() levels: string[] = ['L1', 'L2', 'L3', 'L4', 'L5'];

  @Output() checked = new EventEmitter();

  searchTerm = '';
  filteredCompetencies: any[] = [];

  ngOnInit() {
    this.filteredCompetencies = [...this.competencies]

    document.documentElement.style.setProperty(
      '--level-count',
      this.levels.length.toString()
    )

  }

  onSearchChange() {
    const t = this.searchTerm.toLowerCase()
    this.filteredCompetencies = this.competencies.filter(c =>
      c.code.toLowerCase().includes(t) ||
      c.label.toLowerCase().includes(t)
    )
  }

  isChecked(code: string, level: number) {
    return this.selectedMap[code]?.includes(level)
  }

  checkChange(code: string, level: number, checked: boolean) {
    this.checked.emit({ code, level, checked })
  }
  onAddCompetency() {
    console.log('Add Competency clicked')
  }
}
