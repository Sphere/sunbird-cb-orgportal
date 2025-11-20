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

  @ViewChild(MatPaginator) paginator!: MatPaginator
  @ViewChild(MatSort) sort!: MatSort

  // ============= LIFECYCLE HOOKS =============

  ngOnChanges(): void {
    this.displayedColumns = this.showCheckbox
      ? ['select', ...this.columns.map(c => c.key)]
      : this.columns.map(c => c.key)

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
