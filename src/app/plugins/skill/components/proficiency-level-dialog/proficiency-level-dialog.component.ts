import { Component, Inject, OnInit } from '@angular/core'
import { FormBuilder, FormGroup } from '@angular/forms'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material'
import * as _ from 'lodash'

@Component({
  selector: 'ws-proficiency-level-dialog',
  templateUrl: './proficiency-level-dialog.component.html',
  styleUrls: ['./proficiency-level-dialog.component.scss']
})
export class ProficiencyLevelDialogComponent implements OnInit {

  proficiencyLevelForm!: FormGroup
  aastrikaFormBuilder: FormBuilder
  constructor(
    formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<ProficiencyLevelDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.aastrikaFormBuilder = formBuilder
  }

  ngOnInit() {
    this.initializeFormFields()
  }

  initializeFormFields() {
    this.proficiencyLevelForm = this.aastrikaFormBuilder.group({
      comments: [''],
    })

  }

  submit() {
    const resData = {
      formData: this.proficiencyLevelForm.value,
      addLevel: true
    }
    this.dialogRef.close(resData)
  }

}
