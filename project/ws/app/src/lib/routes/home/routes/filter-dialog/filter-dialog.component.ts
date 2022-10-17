import { COMMA, ENTER } from '@angular/cdk/keycodes'
import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MatChipInputEvent, MatDialogRef } from '@angular/material'

@Component({
  selector: 'ws-app-filter-dialog',
  templateUrl: './filter-dialog.component.html',
  styleUrls: ['./filter-dialog.component.scss']
})

export class FilterDialogComponent implements OnInit {

  //#region Global variables

  //#region select lists
  rolesList: list[] = [
    {
      displayText: 'Role1',
      value: 1
    },
  ];
  statesList: list[] = [
    {
      displayText: 'State1',
      value: 1
    },
  ];
  subCentersList: list[] = [
    {
      displayText: 'Sub Center1',
      value: 1
    },
  ];
  designationsList: list[] = [
    {
      displayText: 'Designation1',
      value: 1
    },
  ];
  citysList: list[] = [
    {
      displayText: 'City1',
      value: 1
    },
  ];
  competencysList: list[] = [
    {
      displayText: 'Competency1',
      value: 1
    },
  ];
  blocksList: list[] = [
    {
      displayText: 'Block1',
      value: 1
    },
  ];
  //#endregion

  //#region chps for phone number and email
  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  selectedEmailList: string[] = [];
  selectedPhoneNumberList: string[] = [];
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
      emails: ['', Validators.email],
      phoneNumber: ['', [Validators.pattern("^[0-9]*$"),
      Validators.minLength(10), Validators.maxLength(10)]],
    })
  }
  //#endregion

  //#region (ngOnInit)
  ngOnInit() {
  }
  //#endregion

  //#region eamils and phone number selection

  //#region (addChip) adding value to list
  addChip(event: MatChipInputEvent, controller: string): void {
    const value = (event.value || '').trim()
    let valid = false

    // Add our value
    if (value) {
      switch (controller) {
        case 'email':
          if (this.filterForm.controls.emails.valid) {
            this.selectedEmailList.push(value)
            valid = true
          }
          break
        case 'phone number':
          if (this.filterForm.controls.phoneNumber.valid) {
            this.selectedPhoneNumberList.push(value)
            valid = true
          }
          break
      }
    }

    // Clear the input value
    if (valid) {
      event.input.value = ''
    }
  }
  //#endregion

  //#region (remaoveEmail) remoave value from list
  removeChip(email: string, controller: string): void {
    if (email) {
      switch (controller) {
        case 'email':
          const emailIndex = this.selectedEmailList.indexOf(email)
          if (emailIndex >= 0) {
            this.selectedEmailList.splice(emailIndex, 1)
          }
          break
        case 'phone number':
          const PNindex = this.selectedPhoneNumberList.indexOf(email)
          if (PNindex >= 0) {
            this.selectedPhoneNumberList.splice(PNindex, 1)
          }
          break
      }
    }
  }
  //#endregion

  //#endregion

  //#region applying filter
  onApply() {
  }
  //#endregion
}

export interface list {
  displayText: string,
  value: number
}
