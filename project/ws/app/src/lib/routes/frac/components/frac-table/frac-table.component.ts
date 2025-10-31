import {
  Component,
  Input,
  ViewChild,
  OnChanges,
  AfterViewInit,
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
  selector: 'app-frac-table',
  templateUrl: './frac-table.component.html',
  styleUrls: ['./frac-table.component.scss'],
})
export class FracTableComponent implements OnChanges, AfterViewInit {
  /** Columns config */
  @Input() columns: TableColumn[] = []

  /** Data to display */
  @Input() data: any[] = []

  /** Max height for scrollable table */
  @Input() maxHeight: string = '400px'

  /** Show checkbox column */
  @Input() showCheckbox = true

  /** Enable sorting */
  @Input() enableSorting = true

  /** Enable pagination */
  @Input() enablePagination = true

  /** Page size options */
  @Input() pageSizeOptions: number[] = [5, 10, 20]

  /** Configurable grid line style: horizontal | vertical | both | none */
  @Input() gridStyle: GridStyle = 'horizontal'

  /** Table data source */
  dataSource = new MatTableDataSource<any>([])

  /** Selection model */
  selection = new SelectionModel<any>(true, [])

  /** Column keys */
  displayedColumns: string[] = []

  @ViewChild(MatPaginator) paginator!: MatPaginator
  @ViewChild(MatSort) sort!: MatSort

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


  /** Checkbox helpers */
  isAllSelected() {
    const numSelected = this.selection.selected.length
    const numRows = this.dataSource.data.length
    return numSelected === numRows
  }

  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach(row => this.selection.select(row))
  }

  checkboxLabel(row?: any): string {
    if (!row) return `${this.isAllSelected() ? 'deselect' : 'select'} all`
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row`
  }

  /** Optional filter method */
  applyFilter(value: string) {
    this.dataSource.filter = value.trim().toLowerCase()
  }
}
