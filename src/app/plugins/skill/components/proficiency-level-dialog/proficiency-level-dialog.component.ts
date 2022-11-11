import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup } from '@angular/forms'
import { MatDialogRef } from '@angular/material'

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
  ) {
    this.aastrikaFormBuilder = formBuilder
  }

  ngOnInit() {
    this.initializeFormFields()
  }

  initializeFormFields() {
    this.proficiencyLevelForm = this.aastrikaFormBuilder.group({
      comments: [''],
      level: [''],
    })

  }

}
