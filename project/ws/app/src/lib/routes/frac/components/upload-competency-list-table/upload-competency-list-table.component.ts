import {
  Component,
  Input,
  ViewChild,
  OnChanges,
  AfterViewInit,
  EventEmitter,
  Output,
} from '@angular/core'
import { MatTableDataSource } from '@angular/material/table'
import { MatPaginator } from '@angular/material/paginator'
import { MatSort } from '@angular/material/sort'
import { SelectionModel } from '@angular/cdk/collections'

export interface TableColumn {
  key: string
  label: string
  width?: string
}

type GridStyle = 'horizontal' | 'vertical' | 'both' | 'none'

@Component({
  selector: 'app-upload-competency-list-table',
  templateUrl: './upload-competency-list-table.component.html',
  styleUrls: ['./upload-competency-list-table.component.scss'],
})
export class UploadCompetencyListTableComponent implements OnChanges, AfterViewInit {
  // ============= INPUTS =============

  @Input() columns: TableColumn[] = []
  @Input() data: any[] = []
  @Input() maxHeight: string = '400px'
  @Input() showCheckbox = true
  @Input() enableSorting = true
  @Input() enablePagination = true
  @Input() pageSizeOptions: number[] = [5, 10, 20]
  @Input() gridStyle: GridStyle = 'horizontal'
  @Input() isEditing = false

  // ============= OUTPUTS =============

  @Output() selectionChange = new EventEmitter<any[]>()

  // ============= PROPERTIES =============

  dataSource = new MatTableDataSource<any>([])
  selection = new SelectionModel<any>(true, [])
  displayedColumns: string[] = []

  // ✅ Default columns for empty state (hardcoded)
  defaultColumns: TableColumn[] = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Label' },
    { key: 'description', label: 'Description' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status' },
    { key: `level_L1_label`, label: `Level 1 Label` },
    { key: `level_L1_description`, label: `Level 1 Description` },

    // { key: `level_L2_label`, label: `Level 2 Label` },
    // { key: `level_L2_description`, label: `Level 2 Description` },

    // { key: `level_L3_label`, label: `Level 3 Label` },
    // { key: `level_L3_description`, label: `Level 3 Description` },

    // { key: `level_L4_label`, label: `Level 4 Label` },
    // { key: `level_L4_description`, label: `Level 4 Description` },

    // { key: `level_L5_label`, label: `Level 5 Label` },
    // { key: `level_L5_description`, label: `Level 5 Description` },

  ]

  @ViewChild(MatPaginator) paginator!: MatPaginator
  @ViewChild(MatSort) sort!: MatSort

  // ============= LIFECYCLE HOOKS =============

  ngOnChanges(): void {
    // ✅ Use provided columns, or default columns if empty
    const activeColumns = this.columns && this.columns.length > 0 ? this.columns : this.defaultColumns

    this.displayedColumns = this.showCheckbox
      ? ['select', ...activeColumns.map(c => c.key)]
      : activeColumns.map(c => c.key)

    this.dataSource = new MatTableDataSource(this.data)
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.enablePagination && this.paginator)
        this.dataSource.paginator = this.paginator
      if (this.enableSorting && this.sort)
        this.dataSource.sort = this.sort
    })
  }

  // ============= GET ACTIVE COLUMNS =============

  /** Get columns to display - either provided or default */
  getActiveColumns(): TableColumn[] {
    return (this.columns && this.columns.length > 0) ? this.columns : this.defaultColumns
  }

  // ============= CHECKBOX HANDLERS =============

  /** Check if all rows are selected */
  isAllSelected() {
    const numSelected = this.selection.selected.length
    const numRows = this.dataSource.data.length
    return numSelected === numRows
  }

  /** Toggle selection for all rows */
  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach(row => this.selection.select(row))
  }

  /** Get accessible label for checkbox */
  checkboxLabel(row?: any): string {
    if (!row) return `${this.isAllSelected() ? 'deselect' : 'select'} all`
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row`
  }

  // ============= ROW SELECTION =============

  /** Handle individual row selection */
  onRowSelect(row: any) {
    this.selection.toggle(row)
    this.selectionChange.emit(this.selection.selected)
  }

  /** Filter table data by keyword */
  applyFilter(value: string) {
    this.dataSource.filter = value.trim().toLowerCase()
  }

  // ============= EMPTY STATE =============

  /** Generate empty rows to fill container height when no data exists */
  getEmptyRows(): any[] {
    const rowHeight = 40
    const headerHeight = 40
    const containerHeight = 529
    const availableHeight = containerHeight - headerHeight
    const numEmptyRows = Math.ceil(availableHeight / rowHeight)
    return new Array(numEmptyRows).fill(null)
  }

  /** Generate empty rows to fill remaining space when data exists */
  getEmptyRowsForData(): any[] {
    const rowHeight = 40
    const headerHeight = 40
    const containerHeight = 529
    const dataRowsHeight = this.data.length * rowHeight
    const availableHeight = containerHeight - headerHeight - dataRowsHeight
    const numEmptyRows = Math.ceil(availableHeight / rowHeight)
    return numEmptyRows > 0 ? new Array(numEmptyRows).fill(null) : []
  }
}
