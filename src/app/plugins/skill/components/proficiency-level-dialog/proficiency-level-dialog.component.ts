import { Component, Inject, OnInit } from '@angular/core'
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms'
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog'
import * as _ from 'lodash'

@Component({
  selector: 'ws-proficiency-level-dialog',
  templateUrl: './proficiency-level-dialog.component.html',
  styleUrls: ['./proficiency-level-dialog.component.scss'],
})
export class ProficiencyLevelDialogComponent implements OnInit {

  proficiencyLevelForm!: UntypedFormGroup
  aastrikaFormBuilder: UntypedFormBuilder
  constructor(
    formBuilder: UntypedFormBuilder,
    public dialogRef: MatDialogRef<ProficiencyLevelDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.aastrikaFormBuilder = formBuilder
    if (!data) {
      this.dialogRef.close()
    }
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
    }
    this.dialogRef.close(resData)
  }

}
