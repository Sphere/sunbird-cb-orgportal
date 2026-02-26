import {
  Component,
  Input,
  ViewChild,
  ViewChildren,
  ElementRef,
  QueryList,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  EventEmitter,
  Output,
} from '@angular/core'
import { MatTableDataSource } from '@angular/material/table'
import { MatPaginator } from '@angular/material/paginator'
import { MatSort, Sort } from '@angular/material/sort'
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
  @Input() isLoading = false

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
  activeColumns: ActivityTableColumn[] = []
  emptyRows: any[] = []
  fillerRows: any[] = []

  /** Default columns to show when no column config is provided */
  defaultColumns: ActivityTableColumn[] = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Label' },
    // { key: 'description', label: 'Description' },
    // { key: 'type', label: 'Type' },
    // { key: 'status', label: 'Status' },
  ]

  private paginator: MatPaginator | null = null
  private sort: MatSort | null = null

  @ViewChild(MatPaginator)
  set matPaginator(paginator: MatPaginator | undefined) {
    this.paginator = paginator ?? null
    this.attachTableControllers()
  }

  @ViewChild(MatSort)
  set matSort(sort: MatSort | undefined) {
    this.sort = sort ?? null
    this.attachTableControllers()
  }

  @ViewChildren('headerCell', { read: ElementRef }) headerCells!: QueryList<ElementRef<HTMLElement>>

  loadingColumnWidths: number[] = []

  // ============= LIFECYCLE HOOKS =============

  constructor() {
    this.configureDataSource()
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.activeColumns = this.columns && this.columns.length > 0 ? this.columns : this.defaultColumns

    // Update displayed columns based on checkbox visibility
    this.displayedColumns = this.showCheckbox
      ? ['select', ...this.activeColumns.map(c => c.key)]
      : this.activeColumns.map(c => c.key)

    // Update data source while preserving existing sort/paginator bindings
    this.dataSource.data = [...(this.data || [])]
    this.attachTableControllers()
    this.emptyRows = this.computeEmptyRows()
    this.fillerRows = this.computeEmptyRowsForData()
    if (changes['data'] || changes['columns']) {
      this.selection.clear()
      this.selectionChange.emit([])
    }
    this.scheduleLoadingWidthSync()
  }

  ngAfterViewInit() {
    // Attach paginator and sorter after view initialization
    setTimeout(() => {
      this.attachTableControllers()
      this.syncLoadingColumnWidths()
    })

    this.headerCells?.changes.subscribe(() => this.syncLoadingColumnWidths())
  }

  getLoadingCellWidth(index: number): number | null {
    const width = this.loadingColumnWidths[index]
    return width && width > 0 ? width : null
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
    this.selectionChange.emit(this.selection.selected)
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

  isCodeField(columnKey: string): boolean {
    return (columnKey || '').toLowerCase() === 'code'
  }

  // ============= EMPTY STATE =============

  /** Generate empty rows to fill container height (40px per row) */
  private computeEmptyRows(): any[] {
    const rowHeight = 40
    const headerHeight = 40
    const containerHeight = 529
    const availableHeight = containerHeight - headerHeight
    const numEmptyRows = Math.ceil(availableHeight / rowHeight)
    return new Array(numEmptyRows).fill(null)
  }

  /** Generate empty rows to fill remaining space when data exists */
  private computeEmptyRowsForData(): any[] {
    const rowHeight = 40
    const headerHeight = 40
    const containerHeight = 529
    const dataRowsHeight = this.data.length * rowHeight
    const availableHeight = containerHeight - headerHeight - dataRowsHeight
    const numEmptyRows = Math.ceil(availableHeight / rowHeight)
    return numEmptyRows > 0 ? new Array(numEmptyRows).fill(null) : []
  }

  private scheduleLoadingWidthSync(): void {
    setTimeout(() => this.syncLoadingColumnWidths())
  }

  private configureDataSource(): void {
    this.dataSource.sortingDataAccessor = (item: any, property: string): string => {
      return this.normalizeSortValue(item?.[property])
    }

    this.dataSource.sortData = (data: any[], sort: Sort): any[] => {
      if (!sort.active || sort.direction === '') {
        return data.slice()
      }

      const isAscending = sort.direction === 'asc'
      return data.slice().sort((left: any, right: any) => {
        const leftValue = this.normalizeSortValue(left?.[sort.active])
        const rightValue = this.normalizeSortValue(right?.[sort.active])
        const comparison = this.compareSortValues(leftValue, rightValue)
        return isAscending ? comparison : -comparison
      })
    }

    this.attachTableControllers()
  }

  private attachTableControllers(): void {
    this.dataSource.paginator = this.enablePagination ? this.paginator : null
    this.dataSource.sort = this.enableSorting ? this.sort : null
    this.applyDefaultSort()
  }

  private applyDefaultSort(): void {
    if (!this.enableSorting || !this.sort || this.sort.direction) {
      return
    }

    const defaultSortKey = this.resolveDefaultSortKey()
    if (!defaultSortKey) {
      return
    }

    this.sort.active = defaultSortKey
    this.sort.direction = 'asc'
    this.sort.sortChange.emit({ active: defaultSortKey, direction: 'asc' })
  }

  private resolveDefaultSortKey(): string | null {
    if (this.activeColumns.some(column => column.key === 'code')) {
      return 'code'
    }

    return this.activeColumns[0]?.key || null
  }

  private normalizeSortValue(value: unknown): string {
    return (value ?? '').toString().trim()
  }

  private compareSortValues(left: string, right: string): number {
    return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' })
  }

  private syncLoadingColumnWidths(): void {
    if (!this.headerCells || !this.headerCells.length) {
      return
    }

    this.loadingColumnWidths = this.headerCells
      .toArray()
      .map(cell => Math.round(cell.nativeElement.getBoundingClientRect().width))
  }
}
