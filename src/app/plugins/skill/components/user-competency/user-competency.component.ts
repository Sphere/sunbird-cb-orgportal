import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material'
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

  constructor(
    private dialog: MatDialog
  ) { }

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
      }
    })
  }

}

export class Legend {
  name?: string
  color?: string
}
