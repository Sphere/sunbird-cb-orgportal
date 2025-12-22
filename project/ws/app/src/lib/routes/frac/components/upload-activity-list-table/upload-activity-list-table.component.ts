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

/** Column configuration for Activity table */
export interface ActivityTableColumn {
  key: string        // Column data key (e.g., 'code', 'name')
  label: string      // Column header label
  width?: string     // Fixed column width (e.g., '100px', '300px')
}

/** Grid line style options: horizontal, vertical, both, or none */
type GridStyle = 'horizontal' | 'vertical' | 'both' | 'none'

@Component({
  selector: 'app-upload-activity-list-table',
  templateUrl: './upload-activity-list-table.component.html',
  styleUrls: ['./upload-activity-list-table.component.scss'],
})
export class UploadActivityListTableComponent implements OnChanges, AfterViewInit {
  // ============= INPUTS =============

  /** Column configuration with headers and widths */
  @Input() columns: ActivityTableColumn[] = []

  /** Table data to display */
  @Input() data: any[] = []

  /** Show/hide checkbox selection column */
  @Input() showCheckbox = true

  /** Enable sorting functionality */
  @Input() enableSorting = true

  /** Enable pagination */
  @Input() enablePagination = false

  /** Pagination page size options */
  @Input() pageSizeOptions: number[] = [5, 10, 20]

  /** Grid border style: 'horizontal' | 'vertical' | 'both' | 'none' */
  @Input() gridStyle: GridStyle = 'both'

  /** Enable/disable edit mode for selected rows */
  @Input() isEditing = false

  // ============= OUTPUTS =============

  /** Emits array of selected rows when selection changes */
  @Output() selectionChange = new EventEmitter<any[]>()

  // ============= PROPERTIES =============

  /** Material table data source */
  dataSource = new MatTableDataSource<any>([])

  /** CDK selection model for checkboxes */
  selection = new SelectionModel<any>(true, [])

  /** Dynamic column keys for table rendering */
  displayedColumns: string[] = []

  /** Default columns to show when no column config is provided */
  defaultColumns: ActivityTableColumn[] = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Label' },
    // { key: 'description', label: 'Description' },
    // { key: 'type', label: 'Type' },
    // { key: 'status', label: 'Status' },
  ]

  @ViewChild(MatPaginator) paginator!: MatPaginator
  @ViewChild(MatSort) sort!: MatSort

  // ============= LIFECYCLE HOOKS =============

  ngOnChanges(): void {
    const activeColumns = this.getActiveColumns()

    // Update displayed columns based on checkbox visibility
    this.displayedColumns = this.showCheckbox
      ? ['select', ...activeColumns.map(c => c.key)]
      : activeColumns.map(c => c.key)

    // Update data source
    this.dataSource = new MatTableDataSource(this.data)
  }

  ngAfterViewInit() {
    // Attach paginator and sorter after view initialization
    setTimeout(() => {
      if (this.enablePagination && this.paginator)
        this.dataSource.paginator = this.paginator
      if (this.enableSorting && this.sort)
        this.dataSource.sort = this.sort
    })
  }

  // ============= CHECKBOX HANDLERS =============

  /** Check if all rows are selected */
  isAllSelected() {
    const numSelected = this.selection.selected.length
    const numRows = this.dataSource.data.length
    return numSelected === numRows
  }

  /** Toggle all rows selection */
  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach(row => this.selection.select(row))
  }

  /** Get checkbox aria-label text */
  checkboxLabel(row?: any): string {
    if (!row) return `${this.isAllSelected() ? 'deselect' : 'select'} all`
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row`
  }

  // ============= ROW SELECTION =============

  /** Toggle row selection and emit change event */
  onRowSelect(row: any) {
    this.selection.toggle(row)
    this.selectionChange.emit(this.selection.selected)
  }

  // ============= EMPTY STATE =============

  /** Generate empty rows to fill container height (40px per row) */
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

  /** Return provided columns or default columns when none were supplied */
  getActiveColumns(): ActivityTableColumn[] {
    return this.columns && this.columns.length > 0 ? this.columns : this.defaultColumns
  }
}
