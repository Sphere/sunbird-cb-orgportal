import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material'
import { ActivatedRoute, Router } from '@angular/router'
import * as _ from 'lodash'
import { forkJoin } from 'rxjs'
import { CompetencyService } from '../../services/competency.service'
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
    },
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
      {
        key: 'remarks',
        displayName: 'Comments',
      },
    ]

  userID = ''
  userDetails: any = {
    userName: '',
    role: '',
    designation: '',
  }

  allEntity: any

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private usersSvc: UsersService,
    private route: ActivatedRoute,
    private competencySvc: CompetencyService
  ) {
  }

  ngOnInit() {
    this.getUserId()
    this.allEntity = this.getAllEntity()
    this.getCompitencies()
  }

  getCompitencies() {
    if (this.allEntity) {
      const userPassbook = this.getAllUserPassbook()
      forkJoin([this.allEntity, userPassbook]).subscribe(res => {
        const res0 = _.get(res, '[0].result.response')
        const res1 = _.get(res, '[1].result.content')
        const response = this.competencySvc.formatedUserCompetency(res0, res1)
        this.competenciesList = response
      })
    }
  }

  getUserId() {
    this.userID = this.route.snapshot.paramMap.get('id') as string
    if (this.userID) {
      this.getUserDetails()
    } else {
      this.router.navigate([`app/home/competencies`])
    }
  }

  getUserDetails() {
    this.usersSvc.getUserById(this.userID)
      .subscribe((userDetails: any) => {
        this.userDetails = userDetails
      })
  }

  private getAllEntity() {
    const serchBody = {
      search: {
        type: 'Competency',
      },
    }
    return this.competencySvc.getAllEntity(serchBody)
  }

  private getAllUserPassbook() {
    const reqBody = {
      request: {
        typeName: 'competency',
        userId: [this.userID],
      },
    }
    return this.competencySvc.getUserPassbook(reqBody)
  }

  openAddComperencyDialog() {
    const dialogRef = this.dialog.open(AddCompetencyDialogComponent, {
      height: '100vh',
      width: '90vw',
      data: {
        userId: this.userID,
      },
    })

    dialogRef.afterClosed().subscribe((response: any) => {
      if (_.get(response, 'updated', false)) {
        this.getCompitencies()
      }
    })
  }

  selectedCompetency(value: string): string {
    return _.get(_.find(this.selectCompetencyList, sc => sc.value === value), 'displayName') || ''
  }

  getFinalColumns() {
    const columns: string[] = ['level', 'source', 'date', 'remarks']
    return columns
  }

  openProficiencyLevelDialog(level: number) {
    // const levelDetails = {
    //   userId: this.userID
    //   competencyName:
    // }
    const dialogRef = this.dialog.open(ProficiencyLevelDialogComponent, {
      data: {
        level,
      },
      height: '255px',
      width: '500px',
      maxWidth: '90vw',
      panelClass: 'competencies',
    })

    dialogRef.afterClosed().subscribe((response: any) => {
      if (response) {
        this.getCompitencies()
      }
      // if (response && response.addLevel) {
      //   this.competenciesList
      //     .find((competency: any) => competency.proficiencyLevels
      //       .find((element: any) => {
      //         if (element.displayLevel === level) {
      //           element.comments = response.formData.comments
      //           element.selected = true
      //         }
      //       })
      //     )
      // }
    })
  }
}
