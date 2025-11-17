import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core'

@Component({
  selector: 'app-competency-mapping-table',
  templateUrl: './competency-mapping-table.component.html',
  styleUrls: ['./competency-mapping-table.component.scss']
})
export class CompetencyMappingTableComponent implements OnInit, OnChanges {

  @Input() competencies: any[] = [];
  @Input() selectedMap: any = {};

  // Configurable header and labels
  @Input() headerConfig = {
    codeLabel: 'Code & Label',
    levels: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'],
    searchPlaceholder: 'Search Competency'
  };

  // Dynamic level identifiers
  @Input() levels: string[] = ['L1', 'L2', 'L3', 'L4', 'L5'];

  @Output() checked = new EventEmitter();
  @Output() searchChange = new EventEmitter<string>();
  @Output() addCompetency = new EventEmitter<any>();

  searchTerm = '';
  filteredCompetencies: any[] = [];

  ngOnInit() {
    this.filteredCompetencies = [...this.competencies]

    // Dynamically update grid columns count based on level list
    document.documentElement.style.setProperty(
      '--level-count',
      this.levels.length.toString()
    )
  }

  // Handles search filtering
  // onSearchChange() {
  //   const text = this.searchTerm.toLowerCase()

  //   this.filteredCompetencies = this.competencies.filter(c =>
  //     c.code.toLowerCase().includes(text) ||
  //     c.label.toLowerCase().includes(text)
  //   )
  // }
  onSearchChange() {
    console.log('Search term:', this.searchTerm)
    this.searchChange.emit(this.searchTerm)  // pass keyword to parent
  }

  // Returns checkbox selected state
  isChecked(code: string, levelCode: string) {
    return this.selectedMap[code]?.includes(levelCode)
  }

  // Emits checkbox value updates
  checkChange(code: string, levelCode: string, checked: boolean) {
    this.checked.emit({ code, level: levelCode, checked })
  }

  onAddCompetency() {
    const selectedList = this.buildSelectedCompetencies()

    this.addCompetency.emit([...selectedList])  // NEW reference

    // Clear selection for next use
    // this.selectedMap = {}
  }
  ngOnChanges() {
    this.filteredCompetencies = [...this.competencies]

    // Update column count dynamically
    if (this.levels?.length) {
      document.documentElement.style.setProperty(
        '--level-count',
        this.levels.length.toString()
      )
    }
  }
  buildSelectedCompetencies() {
    return Object.keys(this.selectedMap).map(code => {
      const comp = this.competencies.find(c => c.code === code)

      const levels = this.selectedMap[code]
        .map((lv: string) => lv.split("_")[1]) // "C5013_L1" → "L1"
        .join(",")

      return {
        code,
        label: comp?.label || "",
        levels
      }
    })
  }
}
