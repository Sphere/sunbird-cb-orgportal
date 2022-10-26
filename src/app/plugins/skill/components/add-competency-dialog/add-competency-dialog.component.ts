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
  form!: FormGroup
  levelForm!: FormGroup
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
      level: 1,
      selected: true,
      curentSelected: false
    },
    {
      level: 2,
      selected: true,
      curentSelected: false
    },
    {
      level: 3,
      selected: true,
      curentSelected: false
    },
    {
      level: 4,
      selected: false,
      curentSelected: false
    },
    {
      level: 5,
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
      // addComments: ['']
    })
    console.log(this.proficiencyLevel.length)
    if (this.proficiencyLevel.length > 0) {
      this.addPProficiency()
    }


  }


  get proficiencyLevelControl(): FormArray {
    return this.addCompetencyForm.controls.proficiencyLevel as FormArray
  }

  addPProficiency() {

    const level = this.addCompetencyForm.controls.proficiencyLevel as FormArray

    // const levelForm = this.aastrikaFormBuilder.group({
    //   // level: [],
    //   addComments: []
    // })
    this.proficiencyLevel.forEach(() => {
      // if (element.value === level) {
      //   element.curentSelected = true
      //   this.selectedLeves.push(level)
      //   // this.proficiencyLevelControl.push(level)
      // }
      level.push(this.aastrikaFormBuilder.group({
        addComments: '',
      }))
    })


    // console.log("add", this.proficiencyLevelControl, levelForm, this.addCompetencyForm)





  }

  levelSelect() {
    this.curentSelected = true
  }

  submit() {
    // this.selectedLeves.forEach((el: any) => {
    //   this.proficiencyLevelControl.push(el)
    // })
    console.log(this.addCompetencyForm.value)
  }

}
