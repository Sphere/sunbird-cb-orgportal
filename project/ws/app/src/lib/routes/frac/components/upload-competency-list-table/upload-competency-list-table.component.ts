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

type GridStyle = 'horizontal' | 'vertical' | 'both' | 'none'

@Component({
  selector: 'app-upload-competency-list-table',
  templateUrl: './upload-competency-list-table.component.html',
  styleUrls: ['./upload-competency-list-table.component.scss'],
})
export class UploadCompetencyListTableComponent implements OnChanges, AfterViewInit {
  // ============= INPUTS =============

  @Input() columns: FracTableColumn[] = []
  @Input() data: FracTableRow[] = []
  @Input() maxHeight: string = '400px'
  @Input() showCheckbox = true
  @Input() enableSorting = true
  @Input() enablePagination = true
  @Input() pageSizeOptions: number[] = [...FRAC_DEFAULT_PAGE_SIZE_OPTIONS]
  @Input() gridStyle: GridStyle = 'horizontal'
  @Input() isEditing = false
  @Input() editRows: FracTableRow[] = []
  @Input() isLoading = false

  // ============= OUTPUTS =============

  @Output() selectionChange = new EventEmitter<FracTableRow[]>()

  // ============= PROPERTIES =============

  dataSource = new MatTableDataSource<FracTableRow>([])
  selection = new SelectionModel<FracTableRow>(true, [])
  displayedColumns: string[] = []
  activeColumns: FracTableColumn[] = []
  emptyRows: Array<null> = []
  fillerRows: Array<null> = []

  /** Default fallback columns shown when backend columns are not available. */
  defaultColumns: FracTableColumn[] = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'type', label: 'Type' },
    { key: 'area', label: 'Area' },
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
  constructor(private readonly hostEl: ElementRef<HTMLElement>) { }

  @ViewChild(MatPaginator) paginator!: MatPaginator
  @ViewChild(MatSort) sort!: MatSort
  @ViewChildren('headerCell', { read: ElementRef }) headerCells!: QueryList<ElementRef<HTMLElement>>

  loadingColumnWidths: number[] = []

  /** Placeholder rows passed to the table when isLoading is true. The table renders them as shimmer cells. */
  readonly shimmerRows: Record<string, unknown>[] = Array.from({ length: 15 }, () => ({}))

  // ============= LIFECYCLE HOOKS =============

  /**
   * Triggered whenever Angular detects a change to one of the input properties.
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Use incoming columns when provided; otherwise keep fallback columns.
    this.activeColumns = this.columns && this.columns.length > 0 ? this.columns : this.defaultColumns

    this.displayedColumns = this.showCheckbox
      ? ['select', ...this.activeColumns.map(c => c.key)]
      : this.activeColumns.map(c => c.key)

    this.dataSource = new MatTableDataSource(this.data)
    this.configureDataSource()
    this.emptyRows = this.computeEmptyRows()
    this.fillerRows = this.computeEmptyRowsForData()
    if (changes.data || changes.columns) {
      this.selection.clear()
      this.selectionChange.emit([])
    }

    this.scheduleLoadingWidthSync()
  }

  /**
   * Runs after the components views and child views are fully loaded.
   */
  ngAfterViewInit() {
    setTimeout(() => {
      this.configureDataSource()
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

  // ============= GET ACTIVE COLUMNS =============

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
    this.selectionChange.emit(this.selection.selected)
  }

  /** Get accessible label for checkbox */
  checkboxLabel(row?: FracTableRow): string {
    if (!row) return `${this.isAllSelected() ? 'deselect' : 'select'} all`
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row`
  }

  // ============= ROW SELECTION =============

  /** Handle individual row selection */
  onRowSelect(row: FracTableRow) {
    this.selection.toggle(row)
    this.selectionChange.emit(this.selection.selected)
  }

  /**
   * Returns true when the row should render in edit mode.
   */
  isRowInEditMode(row: FracTableRow): boolean {
    return this.isEditing && this.editRows.includes(row)
  }

  /**
   * Returns true when field should use a text area in edit mode.
   */
  isTextAreaField(columnKey: string): boolean {
    const key = (columnKey || '').toLowerCase()
    const isLevelLabel = key.includes('level_') && key.includes('_label')
    return (
      key.includes('name') ||
      key.includes('description') ||
      key === 'type' ||
      key === 'area' ||
      isLevelLabel
    )
  }

  /**
   * Returns true when a column is the code column.
   */
  isCodeField(columnKey: string): boolean {
    return (columnKey || '').toLowerCase() === 'code'
  }

  /**
   * Returns true when a field needs taller text area styling.
   */
  isTallDescriptionField(columnKey: string): boolean {
    const key = (columnKey || '').toLowerCase()
    return key === 'description' || /^level_l\d+_description$/.test(key)
  }

  /** Filter table data by keyword */
  applyFilter(value: string) {
    this.dataSource.filter = value.trim().toLowerCase()
  }

  // ============= EMPTY STATE =============

  /** Generate empty rows to fill container height when no data exists */
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
        .querySelector<HTMLElement>('.competency-table-container')
        ?.style.setProperty('--table-header-height', `${Math.round(height)}px`)
    }
  }

  /**
   * Configures sorting behavior and table controllers.
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

    if (this.enablePagination && this.paginator) {
      this.dataSource.paginator = this.paginator
    }
    if (this.enableSorting && this.sort) {
      this.dataSource.sort = this.sort
      this.applyDefaultSort()
    }
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
