import { Component, OnInit } from '@angular/core'
import { MatDialogRef } from '@angular/material'
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



  constructor(
    formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AddCompetencyDialogComponent>,
    private competencySvc: CompetencyService
  ) {
    this.aastrikaFormBuilder = formBuilder
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
    console.log(this.addCompetencyForm.value)
    this.dialogRef.close(this.addCompetencyForm.value)
  }

}
