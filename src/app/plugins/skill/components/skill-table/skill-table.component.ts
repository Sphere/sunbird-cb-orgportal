import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core'
import { MatDialog, MatPaginator, MatSort, MatTableDataSource } from '@angular/material'
import * as _ from 'lodash'
import { SelectionModel } from '@angular/cdk/collections'
import { FilterDialogComponent } from '../filter-dialog/filter-dialog.component'
import { AddCompetencyDialogComponent } from '../add-competency-dialog/add-competency-dialog.component'
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component'
import { FormBuilder } from '@angular/forms'
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators'
import { of, Subject } from 'rxjs'
import { UserAutoCompleteService } from '../../services/user-auto-complete.service'
@Component({
  selector: 'ws-app-skill-table',
  templateUrl: './skill-table.component.html',
  styleUrls: ['./skill-table.component.scss'],
})
export class SkillTableComponent implements OnInit, OnChanges {

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
  selectedAll = false
  pageSizeOptions = [5, 10, 20]
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator
  @ViewChild(MatSort, { static: false }) set matSort(sort: MatSort) {
    if (!this.dataSource.sort) {
      this.dataSource.sort = sort
    }
  }
  selection = new SelectionModel<any>(true, [])
  selectedFilters: any = []
  aastrikaFormBuilder: FormBuilder
  /**
  * value typed
  */
  query: any
  modelChanged: Subject<string> = new Subject<string>();
  constructor(
    public dialog: MatDialog,
    formBuilder: FormBuilder,
    public userAutoCompleteService: UserAutoCompleteService

  ) {
    this.dataSource = new MatTableDataSource<any>()
    this.dataSource.paginator = this.paginator
    this.actionsClick = new EventEmitter()
    this.clicked = new EventEmitter()
    this.aastrikaFormBuilder = formBuilder
  }

  ngOnChanges(data: SimpleChanges) {
    this.dataSource.data = _.get(data, 'data.currentValue')
    this.length = this.dataSource.data.length
    this.paginator.firstPage()
  }

  ngOnInit() {
    if (this.tableData) {
      this.displayedColumns = this.tableData.columns
    }
    if (this.data) {
      this.dataSource.data = this.data
      this.dataSource.paginator = this.paginator
    }
    /**
 * subscribe the value and user autocomplete service
 */
    this.modelChanged.pipe(debounceTime(1000),
      distinctUntilChanged(),
      filter(val => typeof val === 'string'),
      switchMap((value: string) => {
        if (typeof value === 'string' && value) {
          return this.userAutoCompleteService.fetchUserList(value)
        } else {
          this.searchByEnterKey.emit(value)
        }
        return of([])
      })
    ).subscribe((users: any) => {
      this.dataSource.data = users
      this.dataSource.paginator = this.paginator
    })
  }
  /**
 * method to update the behaviour subject
 */
  keyup(event: any) {
    this.query = event
    this.modelChanged.next(this.query)
  }
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
    this.selectedAll = this.isAllSelected()

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
      panelClass: 'competencies',
    })
    dialogRef.afterClosed().subscribe((response: any) => {
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
          item: value,
        })
      }
    })

    this.selectedFilters = filter
  }

  performBtnAction(btn: any) {
    switch (btn.actioName) {
      case 'addCompetency': this.addCompetency()
        break
      case 'resetAssessment': this.resetAssessment()
        break
    }
  }

  addCompetency() {
    const dialogRef = this.dialog.open(AddCompetencyDialogComponent, {
      autoFocus: false, // To remove auto select
      restoreFocus: false,
      panelClass: 'add-Competency',
    })
    dialogRef.afterClosed().subscribe((responce: any) => {
      // tslint:disable-next-line: no-console
      console.log(responce)
    })
  }

  resetAssessment() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      autoFocus: false, // To remove auto select
      restoreFocus: false,
      panelClass: 'confirm-dialog',
      data: {
        title: 'Clicking on confrim will enable the self assessment again for selected users.',
        footerConfig: {
          left: {
            type: 'button',
            title: 'Confirm',
          },
          right: {
            type: 'button',
            title: 'Cancel',
          },
        },
      },
    })
    dialogRef.afterClosed().subscribe((responce: any) => {
      // tslint:disable-next-line: no-console
      console.log(responce)
    })
  }

}
