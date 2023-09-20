import { Component, OnInit, Inject } from '@angular/core'
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MatChipInputEvent, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material'
import { COMMA, ENTER } from '@angular/cdk/keycodes'
import * as _ from 'lodash'
import { HttpClient } from '@angular/common/http'
@Component({
  selector: 'ws-filter-dialog',
  templateUrl: './filter-dialog.component.html',
  styleUrls: ['./filter-dialog.component.scss'],
})
export class FilterDialogComponent implements OnInit {
  districtUrl = '../../../mdo-assets/files/district.json'
  stateUrl = '../../../mdo-assets/files/state.json'
  disticts: any
  states: any
  //#region select lists
  rolesList: IList[] = [
    {
      displayText: 'Content Creator',
      value: 'CONTENT_CREATOR',
    },
    {
      displayText: 'Content Reviewer',
      value: 'CONTENT_REVIEWER',
    },
    {
      displayText: 'Content Publisher',
      value: 'CONTENT_PUBLISHER',
    },
    {
      displayText: 'MDO Admin',
      value: 'MDO_ADMIN',
    },
    {
      displayText: 'Public',
      value: 'PUBLIC',
    },
    {
      displayText: 'SPV Admin',
      value: 'SPV_ADMIN',
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
  isUser: any = false
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
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient
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
    // tslint:disable-next-line: no-console
    console.log('data', data)

    if (data && data.isUser) {
      this.isUser = data.isUser
    }
  }
  //#endregion

  //#region (ngOnInit)
  ngOnInit() {
    this.http.get(this.stateUrl).subscribe((data: any) => {
      this.states = data.states
    })
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
  stateSelect(option: any) {
    this.http.get(this.districtUrl).subscribe((statesdata: any) => {
      statesdata.states.map((item: any) => {
        if (item.state === option) {
          this.disticts = item.districts
          // tslint:disable-next-line: no-console
          console.log('item state', this.disticts)
        }
      })
    })
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
