import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core'
import { MatPaginator } from '@angular/material'
// tslint:disable-next-line
import _ from 'lodash'
@Component({
  selector: 'app-competencies',
  templateUrl: './competencies.component.html',
  styleUrls: ['./competencies.component.scss'],
})
export class CompetenciesComponent implements OnInit, OnDestroy {
  tableData: any
  data: any
  buttonTemplate: any

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator | undefined

  // displayedCo/lumns: string[] = ['Full_Name', 'Designation', 'State', 'City', 'Block', 'Sub_Centre', 'Competency_Status'];
  // dataSource = new MatTableDataSource<PeriodicElement>();

  constructor() { }

  ngOnInit() {
    this.buttonTemplate = [
      { title: "Add Competency", type: 'button', action: 'addCompetency' },
      { title: "Add Proficieny Manually", type: 'button' }
    ]
    this.tableData = {
      columns: [
        { displayName: 'Full Name', key: 'fullName' },
        { displayName: 'Competency', key: 'competency' },
        { displayName: 'Designation', key: 'designation' },
        { displayName: 'State', key: 'state' },
        { displayName: 'City', key: 'city' },
        { displayName: 'Block', key: 'block' },

      ],
      needCheckBox: false,
      needHash: false,
      sortColumn: 'dateCreatedOn',
      sortState: 'desc',
      needUserMenus: false

    }

    this.data = ELEMENT_DATA

  }


  ngOnDestroy() { }
}

export interface PeriodicElement {
  Full_Name: string
  Designation: string
  State: string
  City: string
  Block: string
  Sub_Centre: string
  Competency_Status: string
}

const ELEMENT_DATA = [
  {
    fullName: 'Full_Name1'
    , designation: 'designation1'
    , state: 'State1', city: 'City1', block: 'Block1',
    competency: 'Competency_Status1'
  }

]
