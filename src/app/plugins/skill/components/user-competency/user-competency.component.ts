import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material'
import { ActivatedRoute } from '@angular/router'
import * as _ from 'lodash'
import { UsersService } from '../../services/users.service'
import { AddCompetencyDialogComponent } from '../add-competency-dialog/add-competency-dialog.component'
import { ProficiencyLevelDialogComponent } from './../proficiency-level-dialog/proficiency-level-dialog.component'

@Component({
  selector: 'ws-user-competency',
  templateUrl: './user-competency.component.html',
  styleUrls: ['./user-competency.component.scss'],
})
export class UserCompetencyComponent implements OnInit {

  legends: any[] = [
    {
      name: 'Self Assessment',
      color: '#FFE7C3',
    },
    {
      name: 'Course',
      color: '#D5ECFF',
    },
    {
      name: 'Admin added',
      color: '#ABE5C3',
    }
  ]

  competenciesList: any = []

  selectCompetencyList: any = [
    {
      displayName: 'Procurement and Distribution of HCM',
      value: 'c1',
    },
    {
      displayName: 'Store management and planning and coordination of THR and Dry ration',
      value: 'c2',
    },
    {
      displayName: 'Early Childhood Care Education',
      value: 'c3',
    },
    {
      displayName: 'Growth assessment and monitoring',
      value: 'c4',
    },
    {
      displayName: 'Conducts Community based events',
      value: 'c5',
    },
  ]

  panelOpenState: boolean[] = []

  tableData: {
    key: string,
    displayName: string
  }[] = [
      {
        key: 'level',
        displayName: 'Level',
      },
      {
        key: 'source',
        displayName: 'Source',
      },
      {
        key: 'date',
        displayName: 'Date',
      },
    ]

  dataSource = [
    {
      level: 'Understands HCM guidelines',
      source: 'Self Assessment',
      date: '28-10-2022',
    },
    {
      level: 'Plans for storage',
      source: 'Course Completion',
      date: '28-10-2022',
    },
    {
      level: 'Continues follow-up care',
      source: 'Admin Added',
      date: '28-10-2022',
    },
  ]

  userID: string = '';
  userDetails: any = {
    userName: 'User Name',
    role: 'Role',
    designation: 'Designation'
  }

  color = '#FFE7C3'
  numberOfProficiencies = 5

  constructor(
    private dialog: MatDialog,
    private usersSvc: UsersService,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit() {
    this.getUserId()
  }

  getUserId() {
    this.userID = this.route.snapshot.paramMap.get('id') as string
    if (this.userID) {
      // this.getUserDetails()
    }
  }

  getUserDetails() {
    this.usersSvc.getUserById(this.userID)
      .subscribe((userDetails: any) => {
        this.userDetails = userDetails
        console.log(this.userDetails)
      })
  }

  openAddComperencyDialog() {
    const dialogRef = this.dialog.open(AddCompetencyDialogComponent, {
      height: '100vh',
      width: '90vw',
    })

    dialogRef.afterClosed().subscribe((response: any) => {
      if (response) {
        let competency: any = {}
        competency.selectCompetency = response.selectCompetency,
          competency.selectDate = response.selectDate,
          competency.proficiencyLevels = []
        for (let i = 0; i < this.numberOfProficiencies; i++) {
          const proficiency = {
            proficiencyLevel: 'l' + (i + 1),
            displayLevel: i + 1,
            selected: false,
            comments: response.comments,
          }
          if (response.selectProficiency === proficiency.proficiencyLevel) {
            proficiency.selected = true
          }
          competency.proficiencyLevels.push(proficiency)
        }
        this.competenciesList.push(competency)
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

  addIndidualLevels(level: number) {
    const dialogRef = this.dialog.open(ProficiencyLevelDialogComponent, {
      data: {
        level: level
      },
      height: '255px',
      width: '500px',
      maxWidth: '90vw',
      panelClass: 'competencies',
    })

    dialogRef.afterClosed().subscribe((response: any) => {
      if (response && response.addLevel) {
        this.competenciesList
          .find((competency: any) => competency.proficiencyLevels
            .find((element: any) => {
              if (element.displayLevel === level) {
                element.comments = response.formData.comments
                element.selected = true
              }
            })
          )
      }
    })
  }
}
