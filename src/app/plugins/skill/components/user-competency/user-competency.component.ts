import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material'
import _ from 'lodash'
import { AddCompetencyDialogComponent } from '../add-competency-dialog/add-competency-dialog.component'

@Component({
  selector: 'ws-user-competency',
  templateUrl: './user-competency.component.html',
  styleUrls: ['./user-competency.component.scss'],
})
export class UserCompetencyComponent implements OnInit {

  legends: Legend[] = [
    {
      name: 'Self Assessment',
      color: '#f3c581bd',
    },
    {
      name: 'Course',
      color: '#b9eeff',
    },
    {
      name: 'Admin added',
      color: '#a8f6c1',
    },
    {
      name: 'Required',
      color: '#0075B7',
    },
  ];

  competenciesList: any = [];

  selectCompetencyList: any = [
    {
      displayName: 'Procurement and Distribution of HCM',
      value: 'c1'
    },
    {
      displayName: 'Store management and planning and coordination of THR and Dry ration',
      value: 'c2'
    },
    {
      displayName: 'Early Childhood Care Education',
      value: 'c3'
    },
    {
      displayName: 'Growth assessment and monitoring',
      value: 'c4'
    },
    {
      displayName: 'Conducts Community based events',
      value: 'c5'
    },
  ];

  panelOpenState: boolean[] = [];

  tableData: {
    key: string,
    displayName: string
  }[] = [
      {
        key: 'level',
        displayName: 'Level'
      },
      {
        key: 'source',
        displayName: 'Source'
      },
      {
        key: 'date',
        displayName: 'Date'
      }
    ]

  dataSource = [
    {
      level: 'Understands HCM guidelines',
      source: 'Self Assessment',
      date: '28-10-2022'
    },
    {
      level: 'Plans for storage',
      source: 'Course Completion',
      date: '28-10-2022'
    },
    {
      level: 'Continues follow-up care',
      source: 'Admin Added',
      date: '28-10-2022'
    },
  ]

  constructor(
    private dialog: MatDialog
  ) {
  }

  ngOnInit() {
  }

  openAddComperencyDialog() {
    const dialogRef = this.dialog.open(AddCompetencyDialogComponent, {
      height: '100vh',
      width: '90vw',
    })

    dialogRef.afterClosed().subscribe((response: any) => {
      if (response) {
        console.log(response)
        this.competenciesList.push(response)
      }
    })
  }

  selectedCompetency(value: string): string {
    return _.get(_.find(this.selectCompetencyList, sc => sc.value === value), 'displayName') || ''
  }

  getFinalColumns() {
    const columns: string[] = ['level', 'source', 'date']
    return columns
  }
}

export class Legend {
  name?: string
  color?: string
}
