import { Component, OnInit } from '@angular/core'
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MatChipInputEvent, MatDialogRef } from '@angular/material'
import { COMMA, ENTER } from '@angular/cdk/keycodes'
import * as _ from 'lodash'

@Component({
  selector: 'ws-filter-dialog',
  templateUrl: './filter-dialog.component.html',
  styleUrls: ['./filter-dialog.component.scss'],
})
export class FilterDialogComponent implements OnInit {

  //#region Global variables

  //#region select lists
  rolesList: IList[] = [
    {
      displayText: 'Role1',
      value: 'Role1',
    },
  ]
  statesList: IList[] = [
    {
      displayText: 'State1',
      value: 'State1',
    },
  ]
  subCentersList: IList[] = [
    {
      displayText: 'Sub Center1',
      value: 'Sub Center1',
    },
  ]
  designationsList: IList[] = [
    {
      displayText: 'Designation1',
      value: 'Designation1',
    },
  ]
  citysList: IList[] = [
    {
      displayText: 'City1',
      value: 'Designation1',
    },
  ]
  competencysList: IList[] = [
    {
      displayText: 'Competency1',
      value: 'Competency1',
    },
  ]
  blocksList: IList[] = [
    {
      displayText: 'Block1',
      value: 'Block1',
    },
  ]
  activitsList: IList[] = [
    {
      displayText: 'Activity1',
      value: 'Activity1',
    },
  ]
  //#endregion

  //#region chps for phone number and email
  selectable = true
  removable = true
  addOnBlur = true
  readonly separatorKeysCodes = [ENTER, COMMA] as const
  //#endregion

  filterForm: FormGroup
  //#endregion

  //#region (constructor)
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FilterDialogComponent>,
  ) {
    this.filterForm = this.fb.group({
      role: [''],
      state: [''],
      subCenter: [''],
      designation: [''],
      city: [''],
      competency: [''],
      block: [''],
      emails: this.fb.array([], Validators.email),
      phoneNumber: this.fb.array([], [Validators.pattern('^[0-9]*$'),
      Validators.minLength(10), Validators.maxLength(10)]),
    })
  }
  //#endregion

  //#region (ngOnInit)
  ngOnInit() {
  }
  //#endregion

  get emailControls(): FormArray {
    return this.filterForm.controls.emails as FormArray
  }
  get phoneNumberControls(): FormArray {
    return this.filterForm.controls.phoneNumber as FormArray
  }
  /* adding email for mobile field to form array */
  addValueToForm(event: MatChipInputEvent, controller: string): void {
    if (_.trim(_.get(event.input, 'value'))) {
      switch (controller) {
        case 'emails': this.emailControls.push(this.fb.control(_.trim(_.get(event.input, 'value'))))
          break

        case 'phoneNumber': this.phoneNumberControls.push(this.fb.control(_.trim(_.get(event.input, 'value'))))
          break
      }
    }
  }

  remove(value: string): void {
    const index = this.emailControls.value.indexOf(value)
    if (index >= 0) {
      this.emailControls.removeAt(index)
    }
  }
  phoneNumberRemove(value: string): void {
    const index = this.phoneNumberControls.value.indexOf(value)
    if (index >= 0) {
      this.phoneNumberControls.removeAt(index)
    }
  }
  //#region eamils and phone number selection

  //#region applying filter submit
  submit() {
    this.dialogRef.close(this.filterForm.value)
  }
  //#endregion
}

export interface IList {
  displayText: string,
  value: string
}
