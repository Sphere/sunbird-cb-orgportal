import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core'

@Component({
  selector: 'app-competency-mapping-table',
  templateUrl: './competency-mapping-table.component.html',
  styleUrls: ['./competency-mapping-table.component.scss']
})
export class CompetencyMappingTableComponent implements OnInit, OnChanges {

  /* ---------------------------
     Input data from parent
  --------------------------- */
  @Input() competencies: any[] = [];
  @Input() selectedMap: any = {};

  @Input() headerConfig = {
    codeLabel: 'Code & Label',
    levels: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'],
    searchPlaceholder: 'Search Competency'
  };

  @Input() levels: string[] = ['L1', 'L2', 'L3', 'L4', 'L5'];
  @Input() selectedActivity: any = null;
  @Input() isLoading = false;

  /* ---------------------------
     Output events to parent
  --------------------------- */
  @Output() checked = new EventEmitter<any>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() addCompetency = new EventEmitter<any>();

  searchTerm = '';
  filteredCompetencies: any[] = [];
  displayLevels: string[] = ['L1', 'L2', 'L3', 'L4', 'L5'];

  ngOnInit() {
    this.filteredCompetencies = [...this.competencies]
    this.syncDisplayLevels()
  }

  ngOnChanges() {
    this.filteredCompetencies = [...this.competencies]
    this.syncDisplayLevels()
  }

  private syncDisplayLevels(): void {
    const defaultLevels = ['L1', 'L2', 'L3', 'L4', 'L5']
    const normalizedIncomingLevels = (this.levels || [])
      .map(level => (level || '').toString().trim().toUpperCase())
      .filter(level => /^L\d+$/.test(level))

    const extraLevels = normalizedIncomingLevels.filter(level => !defaultLevels.includes(level))
    this.displayLevels = [...defaultLevels, ...extraLevels]

    // Keep grid columns aligned with rendered level cells.
    document.documentElement.style.setProperty('--level-count', this.displayLevels.length.toString())
  }

  /* --------------------------------
     Send search input to parent
  -------------------------------- */
  onSearchChange() {
    if (!this.selectedActivity) {
      return
    }
    this.searchChange.emit(this.searchTerm)
  }

  /* --------------------------------
     Checkbox selection handler
  -------------------------------- */
  isChecked(code: string, levelCode: string) {
    return this.selectedMap[code]?.includes(levelCode)
  }

  checkChange(code: string, levelCode: string, checked: boolean) {
    this.checked.emit({ code, level: levelCode, checked })
  }

  /* --------------------------------
     Build selected competency list
  -------------------------------- */
  buildSelectedCompetencies() {
    return Object.keys(this.selectedMap).map(code => {
      const comp = this.competencies.find(c => c.code === code)

      const levels = this.selectedMap[code]
        .map((lv: string) => lv.split('_')[1]) // "C5013_L1" → "L1"
        .join(',')

      return {
        code,
        label: comp?.label || '',
        levels
      }
    })
  }

  /* --------------------------------
     Emit "add competency" event
  -------------------------------- */
  onAddCompetency() {
    const selectedList = this.buildSelectedCompetencies()
    this.addCompetency.emit([...selectedList]) // Send fresh array
  }

  isAddDisabled(): boolean {
    // No activity selected
    if (!this.selectedActivity) return true

    // Extract selected levels from selectedMap
    const hasSelectedLevels =
      Object.values(this.selectedMap || {}).some(
        (levels: any) => levels.length > 0
      )

    // Check whether previously activity had competencies
    const hadPreviousCompetencies =
      this.selectedActivity?.competencyDetails?.length > 0

    // Allowed case: user clearing all mappings
    // const userIsClearingAll = !hasSelectedLevels && hadPreviousCompetencies

    // Disable only when no levels selected AND no previous mapping
    if (!hasSelectedLevels && !hadPreviousCompetencies) return true

    return false // Enable otherwise
  }

}
