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
import { FRAC_DEFAULT_PAGE_SIZE_OPTIONS, FRAC_TABLE_LAYOUT, FRAC_WORD_WRAP_LIMIT } from '../../constants/frac.constants'
import { FracTableColumn, FracTableRow } from '../../models/frac-table.models'
export type TableColumn = FracTableColumn

type GridStyle = 'horizontal' | 'vertical' | 'both' | 'none'

@Component({
  standalone: false,
  selector: 'app-frac-table',
  templateUrl: './frac-table.component.html',
  styleUrls: ['./frac-table.component.scss'],
})
export class FracTableComponent implements OnChanges, AfterViewInit {
  readonly wordWrapLimit = FRAC_WORD_WRAP_LIMIT

  /** Columns config */
  @Input() columns: TableColumn[] = []

  /** Data to display */
  @Input() data: FracTableRow[] = []

  /** Max height for scrollable table */
  @Input() maxHeight: string = '400px'

  /** Show checkbox column */
  @Input() showCheckbox = true

  /** Enable sorting */
  @Input() enableSorting = true

  /** Enable pagination */
  @Input() enablePagination = true

  /** Page size options */
  @Input() pageSizeOptions: number[] = [...FRAC_DEFAULT_PAGE_SIZE_OPTIONS]

  /** Configurable grid line style: horizontal | vertical | both | none */
  @Input() gridStyle: GridStyle = 'horizontal'

  @Input() isEditing = false
  @Output() selectionChange = new EventEmitter<FracTableRow[]>()

  /** Table data source */
  dataSource = new MatTableDataSource<FracTableRow>([])

  /** Selection model */
  selection = new SelectionModel<FracTableRow>(true, [])

  /** Column keys */
  displayedColumns: string[] = []

  @ViewChild(MatPaginator) paginator!: MatPaginator
  @ViewChild(MatSort) sort!: MatSort

  /**
   * Triggered whenever Angular detects a change to one of the input properties.
   */
  ngOnChanges(): void {
    this.displayedColumns = this.showCheckbox
      ? ['select', ...this.columns.map(c => c.key)]
      : this.columns.map(c => c.key)

    this.dataSource = new MatTableDataSource(this.data)
  }

  /**
   * Runs after the components views and child views are fully loaded.
   */
  ngAfterViewInit() {
    setTimeout(() => {
      if (this.enablePagination && this.paginator)
        this.dataSource.paginator = this.paginator
      if (this.enableSorting && this.sort)
        this.dataSource.sort = this.sort
    })
  }


  /** Checkbox helpers */
  isAllSelected() {
    const numSelected = this.selection.selected.length
    const numRows = this.dataSource.data.length
    return numSelected === numRows
  }

  /**
   * Checks all rows if none are checked, or unchecks all rows if some or all are checked.
   */
  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach(row => this.selection.select(row))
  }

  checkboxLabel(row?: FracTableRow): string {
    if (!row) return `${this.isAllSelected() ? 'deselect' : 'select'} all`
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row`
  }

  /** Optional filter method */
  applyFilter(value: string) {
    this.dataSource.filter = value.trim().toLowerCase()
  }

  onRowSelect(row: FracTableRow) {
    this.selection.toggle(row)
    this.selectionChange.emit(this.selection.selected)
  }

  /** Generate empty rows to fill container height (40px per row) */
  getEmptyRows(): Array<null> {
    const rowHeight = FRAC_TABLE_LAYOUT.rowHeightPx
    const headerHeight = FRAC_TABLE_LAYOUT.headerHeightPx
    const containerHeight = FRAC_TABLE_LAYOUT.containerHeightPx
    const availableHeight = containerHeight - headerHeight
    const numEmptyRows = Math.ceil(availableHeight / rowHeight)
    return new Array(numEmptyRows).fill(null)
  }

  /** Generate empty rows to fill remaining space when data exists */
  getEmptyRowsForData(): Array<null> {
    const rowHeight = FRAC_TABLE_LAYOUT.rowHeightPx
    const headerHeight = FRAC_TABLE_LAYOUT.headerHeightPx
    const containerHeight = FRAC_TABLE_LAYOUT.containerHeightPx
    const dataRowsHeight = this.data.length * rowHeight
    const availableHeight = containerHeight - headerHeight - dataRowsHeight
    const numEmptyRows = Math.ceil(availableHeight / rowHeight)
    return numEmptyRows > 0 ? new Array(numEmptyRows).fill(null) : []
  }
}
