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
import { FRAC_DEFAULT_PAGE_SIZE_OPTIONS, FRAC_TABLE_LAYOUT } from '../../constants/frac.constants'
import { FracTableCellValue, FracTableColumn, FracTableRow } from '../../models/frac-table.models'

/** Column configuration for Activity table */
export type ActivityTableColumn = FracTableColumn

/** Grid line style options: horizontal, vertical, both, or none */
type GridStyle = 'horizontal' | 'vertical' | 'both' | 'none'

@Component({
  standalone: false,
  selector: 'app-upload-activity-list-table',
  templateUrl: './upload-activity-list-table.component.html',
  styleUrls: ['./upload-activity-list-table.component.scss'],
})
export class UploadActivityListTableComponent implements OnChanges, AfterViewInit {
  // ============= INPUTS =============

  /** Column configuration with headers and widths */
  @Input() columns: ActivityTableColumn[] = []

  /** Table data to display */
  @Input() data: FracTableRow[] = []
  @Input() isLoading = false

  /** Show/hide checkbox selection column */
  @Input() showCheckbox = true

  /** Enable sorting functionality */
  @Input() enableSorting = true

  /** Enable pagination */
  @Input() enablePagination = false

  /** Pagination page size options */
  @Input() pageSizeOptions: number[] = [...FRAC_DEFAULT_PAGE_SIZE_OPTIONS]

  /** Grid border style: 'horizontal' | 'vertical' | 'both' | 'none' */
  @Input() gridStyle: GridStyle = 'both'

  /** Enable/disable edit mode for selected rows */
  @Input() isEditing = false

  // ============= OUTPUTS =============

  /** Emits array of selected rows when selection changes */
  @Output() selectionChange = new EventEmitter<FracTableRow[]>()

  // ============= PROPERTIES =============

  /** Material table data source */
  dataSource = new MatTableDataSource<FracTableRow>([])

  /** CDK selection model for checkboxes */
  selection = new SelectionModel<FracTableRow>(true, [])

  /** Dynamic column keys for table rendering */
  displayedColumns: string[] = []
  activeColumns: ActivityTableColumn[] = []
  emptyRows: Array<null> = []
  fillerRows: Array<null> = []

  /** Default columns to show when no column config is provided */
  defaultColumns: ActivityTableColumn[] = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
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

  /** Placeholder rows passed to the table when isLoading is true. The table renders them as shimmer cells. */
  readonly shimmerRows: Record<string, unknown>[] = Array.from({ length: 15 }, () => ({}))

  // ============= LIFECYCLE HOOKS =============

  /**
   * Initializes sorting and pagination wiring for the table data source.
   */
  constructor(private readonly hostEl: ElementRef<HTMLElement>) {
    this.configureDataSource()
  }

  /**
   * Triggered whenever Angular detects a change to one of the input properties.
   */
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

  /**
   * Runs after the components views and child views are fully loaded.
   */
  ngAfterViewInit() {
    // Attach paginator and sorter after view initialization
    setTimeout(() => {
      this.attachTableControllers()
      this.syncLoadingColumnWidths()
      this.syncHeaderHeight()
    })

    this.headerCells?.changes.subscribe(() => {
      this.syncLoadingColumnWidths()
      this.syncHeaderHeight()
    })
  }

  /**
   * Returns the measured header width used by loading skeleton cells.
   */
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
  checkboxLabel(row?: FracTableRow): string {
    if (!row) return `${this.isAllSelected() ? 'deselect' : 'select'} all`
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row`
  }

  // ============= ROW SELECTION =============

  /** Toggle row selection and emit change event */
  onRowSelect(row: FracTableRow) {
    this.selection.toggle(row)
    this.selectionChange.emit(this.selection.selected)
  }

  /**
   * Returns true when a column is the code column.
   */
  isCodeField(columnKey: string): boolean {
    return (columnKey || '').toLowerCase() === 'code'
  }

  // ============= EMPTY STATE =============

  /** Generate empty rows to fill container height (40px per row) */
  private computeEmptyRows(): Array<null> {
    const rowHeight = FRAC_TABLE_LAYOUT.rowHeightPx
    const headerHeight = FRAC_TABLE_LAYOUT.headerHeightPx
    const containerHeight = FRAC_TABLE_LAYOUT.containerHeightPx
    const availableHeight = containerHeight - headerHeight
    const numEmptyRows = Math.ceil(availableHeight / rowHeight)
    return new Array(numEmptyRows).fill(null)
  }

  /** Generate empty rows to fill remaining space when data exists */
  private computeEmptyRowsForData(): Array<null> {
    const rowHeight = FRAC_TABLE_LAYOUT.rowHeightPx
    const headerHeight = FRAC_TABLE_LAYOUT.headerHeightPx
    const containerHeight = FRAC_TABLE_LAYOUT.containerHeightPx
    const dataRowsHeight = this.data.length * rowHeight
    const availableHeight = containerHeight - headerHeight - dataRowsHeight
    const numEmptyRows = Math.ceil(availableHeight / rowHeight)
    return numEmptyRows > 0 ? new Array(numEmptyRows).fill(null) : []
  }

  /**
   * Schedules width sync after DOM updates.
   */
  private scheduleLoadingWidthSync(): void {
    setTimeout(() => {
      this.syncLoadingColumnWidths()
      this.syncHeaderHeight()
    })
  }

  /**
   * Measures the real rendered height of the Material table header row
   * and writes it to the --table-header-height CSS variable on the host.
   * This prevents any gap between the sticky header and the shimmer overlay.
   */
  private syncHeaderHeight(): void {
    const headerRow = this.hostEl.nativeElement.querySelector<HTMLElement>(
      '.mat-mdc-header-row, .mat-header-row'
    )
    if (!headerRow) {
      return
    }
    const height = headerRow.getBoundingClientRect().height
    if (height > 0) {
      this.hostEl.nativeElement
        .querySelector<HTMLElement>('.activity-table-container')
        ?.style.setProperty('--table-header-height', `${Math.round(height)}px`)
    }
  }

  /**
   * Configures sorting behavior and attaches table controllers.
   */
  private configureDataSource(): void {
    this.dataSource.sortingDataAccessor = (item: FracTableRow, property: string): string => {
      return this.normalizeSortValue(item?.[property])
    }

    this.dataSource.sortData = (data: FracTableRow[], sort: Sort): FracTableRow[] => {
      if (!sort.active || sort.direction === '') {
        return data.slice()
      }

      const isAscending = sort.direction === 'asc'
      return data.slice().sort((left: FracTableRow, right: FracTableRow) => {
        const leftValue = this.normalizeSortValue(left?.[sort.active])
        const rightValue = this.normalizeSortValue(right?.[sort.active])
        const comparison = this.compareSortValues(leftValue, rightValue)
        return isAscending ? comparison : -comparison
      })
    }

    this.attachTableControllers()
  }

  /**
   * Binds paginator and sort instances to current table source.
   */
  private attachTableControllers(): void {
    this.dataSource.paginator = this.enablePagination ? this.paginator : null
    this.dataSource.sort = this.enableSorting ? this.sort : null
    this.applyDefaultSort()
  }

  /**
   * Applies default sort on code column when no sort is active.
   */
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

  /**
   * Picks default sort key from active columns.
   */
  private resolveDefaultSortKey(): string | null {
    if (this.activeColumns.some(column => column.key === 'code')) {
      return 'code'
    }

    return this.activeColumns[0]?.key || null
  }

  /**
   * Normalizes a cell value into a trimmed string for consistent sorting.
   */
  private normalizeSortValue(value: FracTableCellValue): string {
    return (value ?? '').toString().trim()
  }

  /**
   * Compares two strings with locale and numeric sorting.
   */
  private compareSortValues(left: string, right: string): number {
    return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' })
  }

  /**
   * Measures header widths and stores them for loading row alignment.
   */
  private syncLoadingColumnWidths(): void {
    if (!this.headerCells || !this.headerCells.length) {
      return
    }

    this.loadingColumnWidths = this.headerCells
      .toArray()
      .map(cell => Math.round(cell.nativeElement.getBoundingClientRect().width))
  }
}
