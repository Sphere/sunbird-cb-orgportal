import { Component, OnInit } from '@angular/core'
import { MatDialogRef } from '@angular/material'
import { FormGroup, FormBuilder, Validators, FormArray, FormControl } from '@angular/forms'
import * as _ from 'lodash'
@Component({
  selector: 'ws-add-competency-dialog',
  templateUrl: './add-competency-dialog.component.html',
  styleUrls: ['./add-competency-dialog.component.scss'],
})
export class AddCompetencyDialogComponent implements OnInit {

  addCompetencyForm!: FormGroup
  aastrikaFormBuilder: FormBuilder
  selectedLeves: any[] = []

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

  proficiencyLevel: any = [
    {
      level: 1,
      selected: false,
      curentSelected: false,
    },
    {
      level: 2,
      selected: false,
      curentSelected: false,
    },
    {
      level: 3,
      selected: false,
      curentSelected: false,
    },
    {
      level: 4,
      selected: false,
      curentSelected: false,
    },
    {
      level: 5,
      selected: false,
      curentSelected: false,
    },
  ]

  constructor(
    formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AddCompetencyDialogComponent>,
  ) {
    this.aastrikaFormBuilder = formBuilder
  }

  ngOnInit() {
    this.initializeFormFields()
  }

  initializeFormFields() {
    this.addCompetencyForm = this.aastrikaFormBuilder.group({
      selectCompetency: ['', Validators.required],
      proficiencyLevel: this.aastrikaFormBuilder.array([]),
    })
    if (this.proficiencyLevel.length > 0) {
      this.addPProficiency()
    }
  }
  get proficiencyLevelControl(): FormArray {
    return this.addCompetencyForm.get('proficiencyLevel') as FormArray
  }
  getLeveleSelected(index: any) {
    const formArray: any = (<FormArray>this.addCompetencyForm.get('proficiencyLevel')).at(index).get('level')
    return formArray.value.curentSelected
  }
  newProficiencyLevel(item?: any): FormGroup {
    return this.aastrikaFormBuilder.group({
      comments: new FormControl(''),
      level: new FormControl(item),
    })
  }

  addPProficiency() {
    _.forEach(this.proficiencyLevel, key => {
      this.proficiencyLevelControl.push(this.newProficiencyLevel(key))
    })

  }

  selectLevel(level: any) {
    const formArray: any = (<FormArray>this.addCompetencyForm.get('proficiencyLevel')).at(level).get('level')
    formArray.patchValue({ curentSelected: true, selected: true, level: level + 1 })
  }

  submit() {
    this.dialogRef.close(this.addCompetencyForm.value)
  }

}
