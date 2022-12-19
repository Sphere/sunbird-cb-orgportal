import { Component, Inject, OnInit } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material'
import { FormGroup, FormBuilder, Validators } from '@angular/forms'
import * as _ from 'lodash'
import { CompetencyService } from '../../services/competency.service'
@Component({
  selector: 'ws-add-competency-dialog',
  templateUrl: './add-competency-dialog.component.html',
  styleUrls: ['./add-competency-dialog.component.scss'],
})
export class AddCompetencyDialogComponent implements OnInit {

  addCompetencyForm!: FormGroup
  aastrikaFormBuilder: FormBuilder
  selectedLeves: any[] = []

  selectCompetencyList: any = []

  selectProficiencyList: any = [
    {
      displayName: 'Level 1',
      value: '1',
    },
    {
      displayName: 'Level 2',
      value: '2',
    },
    {
      displayName: 'Level 3',
      value: '3',
    },
    {
      displayName: 'Level 4',
      value: '4',
    },
    {
      displayName: 'Level 5',
      value: '5',
    },
  ]

  UserId = ''

  constructor(
    formBuilder: FormBuilder,
    private competencySvc: CompetencyService,
    public dialogRef: MatDialogRef<AddCompetencyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.aastrikaFormBuilder = formBuilder
    this.UserId = _.get(data, 'userId')
  }

  ngOnInit() {
    this.initializeFormFields()
    this.getCompetencyList()
  }

  initializeFormFields() {
    this.addCompetencyForm = this.aastrikaFormBuilder.group({
      selectCompetency: ['', Validators.required],
      selectProficiency: ['', Validators.required],
      selectDate: [''],
      comments: ['']

    })
  }

  getCompetencyList() {
    const serchBody = {
      search: {
        type: "Competency"
      }
    }
    this.competencySvc.getAllEntity(serchBody)
      .subscribe((data: any) => {
        this.selectCompetencyList = data
        console.log('entities', data)
      })
  }

  submit() {
    if (this.addCompetencyForm.valid) {
      this.getFormatedData()
    }
  }

  getFormatedData() {
    const competencyFormVAlue = _.get(this.addCompetencyForm, 'value')
    const selectedCompetency = _.find(this.selectCompetencyList, (competency: any) => {
      return competency.value === _.get(competencyFormVAlue, 'selectCompetency')
    })
    const formatedData = {
      competencyDetails: [
        {
          acquiredDetails: {
            additionalParams: {
              remarks: _.get(competencyFormVAlue, 'comments', '')
            },
            competencyLevelId: _.get(competencyFormVAlue, 'selectProficiency'),
            acquiredChannel: "selfAssessment"
          },
          additionalParams: {
            competencyName: _.get(selectedCompetency, 'displayName')
          },
          competencyId: _.get(selectedCompetency, 'value')
        }
      ],
      typeName: "competency",
      userId: this.UserId
    }

    this.addSelectedCompetency(formatedData)
  }

  addSelectedCompetency(formatedData: any) {
    if (formatedData) {
      this.competencySvc.updatePassbook(formatedData).subscribe((data: any) => {
        if (data) {
          this.dialogRef.close({ updated: true })
        }
      })
    }
  }


}
