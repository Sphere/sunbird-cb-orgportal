import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core'
import { MatDialog, MatPaginator, MatSort, MatTableDataSource } from '@angular/material'
import _ from 'lodash'
import { SelectionModel } from '@angular/cdk/collections'
import { FilterDialogComponent } from '../filter-dialog/filter-dialog.component'

@Component({
  selector: 'ws-app-skill-table',
  templateUrl: './skill-table.component.html',
  styleUrls: ['./skill-table.component.scss']
})
export class SkillTableComponent implements OnInit {

  @Input() tableData!: any | undefined
  @Input() data?: []
  @Input() topBarConfig: any
  @Input() isUpload?: boolean
  @Input() isCreate?: boolean
  @Output() clicked?: EventEmitter<any>
  @Output() actionsClick?: EventEmitter<any>
  @Output() eOnRowClick = new EventEmitter<any>()
  @Output() eOnButtonClick = new EventEmitter<any>()
  @Output() searchByEnterKey = new EventEmitter<any>()

  bodyHeight = document.body.clientHeight - 125
  displayedColumns: any[] | undefined
  dataSource!: any
  widgetData: any
  length!: number
  pageSize = 5
  pageSizeOptions = [5, 10, 20]
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator
  @ViewChild(MatSort, { static: false }) set matSort(sort: MatSort) {
    if (!this.dataSource.sort) {
      this.dataSource.sort = sort
    }
  }
  selection = new SelectionModel<any>(true, [])
  selectedFilters: any = []
  constructor(
    public dialog: MatDialog,
  ) {
    this.dataSource = new MatTableDataSource<any>()
    this.dataSource.paginator = this.paginator
    this.actionsClick = new EventEmitter()
    this.clicked = new EventEmitter()
  }

  ngOnInit() {
    console.log(this.data)
    if (this.tableData) {
      this.displayedColumns = this.tableData.columns
    }
    if (this.data) {
      this.dataSource.data = this.data
      this.dataSource.paginator = this.paginator
    }
    console.log(this.displayedColumns, this.dataSource)
  }

  ngOnChanges(data: SimpleChanges) {
    this.dataSource.data = _.get(data, 'data.currentValue')
    this.length = this.dataSource.data.length
    this.paginator.firstPage()
  }

  ngAfterViewInit() { }

  applyFilter(filterValue: any) {
    if (filterValue) {
      let fValue = filterValue.trim()
      fValue = filterValue.toLowerCase()
      this.dataSource.filter = fValue
    } else {
      this.dataSource.filter = ''
    }
  }

  buttonClick(action: string, row: any) {
    if (this.tableData) {
      const isDisabled = _.get(_.find(this.tableData.actions, ac => ac.name === action), 'disabled') || false
      if (!isDisabled && this.actionsClick) {
        this.actionsClick.emit({ action, row })
      }
    }
  }

  getFinalColumns() {
    if (this.tableData !== undefined) {
      const columns = _.map(this.tableData.columns, c => c.key)
      if (this.tableData.needCheckBox) {
        columns.splice(0, 0, 'select')
      }
      if (this.tableData.needHash) {
        columns.splice(0, 0, 'SR')
      }
      if (this.tableData.actions && this.tableData.actions.length > 0) {
        columns.push('Actions')
      }
      if (this.tableData.needUserMenus) {
        columns.push('Menu')
      }
      // console.log(columns)
      return columns
    }
    return ''
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length
    const numRows = this.dataSource.data.length
    return numSelected === numRows
  }

  filterList(list: any[], key: string) {
    return list.map(lst => lst[key])
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach((row: any) => this.selection.select(row))
    // console.log(this.selection.selected)
  }

  /** The label for the checkbox on the passed row */
  // checkboxLabel(row?: any): string {
  //   if (!row) {
  //     return `${this.isAllSelected() ? 'select' : 'deselect'} all`
  //   }
  //   return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`
  // }

  onRowClick(e: any) {
    this.eOnRowClick.emit(e)
  }

  onButtonClick(type: string, event: any) {
    this.eOnButtonClick.emit({ type, event })
  }

  onSearchEnter(event: any) {
    this.searchByEnterKey.emit(event.target.value)
  }


  filterTable() {
    const dialogRef = this.dialog.open(FilterDialogComponent, {
      maxHeight: '90vh',
      minHeight: '65%',
      width: '80%',
      autoFocus: false, // To remove auto select
      restoreFocus: false,
      panelClass: 'competencies'
    })
    dialogRef.afterClosed().subscribe((response: any) => {
      console.log(response)
      if (response) {
        this.constuctSelectedFilter(response)
      }

    })

  }
  constuctSelectedFilter(response: any) {
    this.selectedFilters = []
    const filter: any = []
    _.forIn(response, (value: any, key: any) => {
      if (!_.isEmpty(value)) {
        filter.push({
          label: key,
          item: value
        })
      }
    })

    this.selectedFilters = filter
    console.log(this.selectedFilters)
  }

}
