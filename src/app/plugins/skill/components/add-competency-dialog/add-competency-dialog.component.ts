import { Component, OnInit } from '@angular/core'
import { MatDialogRef } from '@angular/material'
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms'

@Component({
  selector: 'ws-add-competency-dialog',
  templateUrl: './add-competency-dialog.component.html',
  styleUrls: ['./add-competency-dialog.component.scss']
})
export class AddCompetencyDialogComponent implements OnInit {

  addCompetencyForm!: FormGroup
  aastrikaFormBuilder: FormBuilder
  curentSelected: boolean = false
  selectedLeves: any[] = []

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

  proficiencyLevel: any = [
    {
      value: 1,
      selected: true,
      curentSelected: false
    },
    {
      value: 2,
      selected: true,
      curentSelected: false
    },
    {
      value: 3,
      selected: true,
      curentSelected: false
    },
    {
      value: 4,
      selected: false,
      curentSelected: false
    },
    {
      value: 5,
      selected: false,
      curentSelected: false
    },

  ]
  constructor(
    formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AddCompetencyDialogComponent>,
  ) {
    this.aastrikaFormBuilder = formBuilder
  }

  ngOnInit() {
    this.initForm()
  }

  initForm() {
    this.addCompetencyForm = this.aastrikaFormBuilder.group({
      selectCompetency: ['', Validators.required],
      proficiencyLevel: this.aastrikaFormBuilder.array([]),
      addComments: ['']
    })
  }


  get proficiencyLevelControl(): FormArray {
    return this.addCompetencyForm.controls.proficiencyLevel as FormArray
  }

  addPProficiency(level: any) {
    this.proficiencyLevel.forEach((element: any) => {
      if (element.value === level) {
        element.curentSelected = true
        this.selectedLeves.push(level)
        // this.proficiencyLevelControl.push(level)
      }
    })
  }

  submit() {
    // this.selectedLeves.forEach((el: any) => {
    //   this.proficiencyLevelControl.push(el)
    // })
    console.log(this.addCompetencyForm.value)
  }

}
