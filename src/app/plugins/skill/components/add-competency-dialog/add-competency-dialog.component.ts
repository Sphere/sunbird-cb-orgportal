import { Component, Inject, OnInit } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material'
import { FormGroup, FormBuilder, Validators } from '@angular/forms'
import * as _ from 'lodash'
import { CompetencyService } from '../../services/competency.service'
import { map } from 'rxjs/operators'
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
      value: 'l1',
    },
    {
      displayName: 'Level 2',
      value: 'l2',
    },
    {
      displayName: 'Level 3',
      value: 'l3',
    },
    {
      displayName: 'Level 4',
      value: 'l4',
    },
    {
      displayName: 'Level 5',
      value: 'l5',
    },
  ]

  userId = ''

  constructor(
    formBuilder: FormBuilder,
    private competencySvc: CompetencyService,
    public dialogRef: MatDialogRef<AddCompetencyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.aastrikaFormBuilder = formBuilder
    this.userId = _.get(data, 'userId')
  }

  ngOnInit() {
    this.initializeFormFields()
    this.getAllEntity()
  }

  initializeFormFields() {
    this.addCompetencyForm = this.aastrikaFormBuilder.group({
      selectCompetency: ['', Validators.required],
      selectProficiency: ['', Validators.required],
      selectDate: [''],
      comments: [''],

    })
  }

  getAllEntity() {
    const serchBody = {
      search: {
        type: 'Competency',
      },
    }
    this.competencySvc.getAllEntity(serchBody)
      .pipe(map((data: any) => {
        return this.competencySvc.getFormatedData(data)
      }))
      .subscribe((data: any) => {
        this.selectCompetencyList = data
      })
  }

  submit() {
    if (this.addCompetencyForm.valid) {
      this.getFormatedData()
    }

    // this.dialogRef.close(this.addCompetencyForm.value)
  }

  getFormatedData() {
    const competencyFormValue = _.get(this.addCompetencyForm, 'value')
    const selectedCompetency = _.find(this.selectCompetencyList, (competency: any) => {
      return competency.value === _.get(competencyFormValue, 'selectCompetency')
    })
    const formatedData = {
      request: {
        competencyDetails: [
          {
            acquiredDetails: {
              additionalParams: {
                remarks: _.get(competencyFormValue, 'comments', ''),
              },
              competencyLevelId: _.get(competencyFormValue, 'selectProficiency'),
              acquiredChannel: 'selfAssessment',
            },
            additionalParams: {
              competencyName: _.get(selectedCompetency, 'displayName'),
            },
            competencyId: _.toString(_.get(selectedCompetency, 'value')),
          },
        ],
        typeName: 'competency',
        userId: this.userId,
        effectiveDate: _.get(competencyFormValue, 'selectDate'),
      },
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
