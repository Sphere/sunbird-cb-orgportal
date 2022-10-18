import { Component, OnInit } from '@angular/core'
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MatChipInputEvent, MatDialogRef } from '@angular/material'
import { COMMA, ENTER } from '@angular/cdk/keycodes'

@Component({
  selector: 'ws-filter-table',
  templateUrl: './filter-table.component.html',
  styleUrls: ['./filter-table.component.scss']
})
export class FilterTableComponent implements OnInit {

  //#region Global variables

  //#region select lists
  rolesList: list[] = [
    {
      displayText: 'Role1',
      value: 'Role1'
    },
  ];
  statesList: list[] = [
    {
      displayText: 'State1',
      value: 'State1'
    },
  ];
  subCentersList: list[] = [
    {
      displayText: 'Sub Center1',
      value: 'Sub Center1'
    },
  ];
  designationsList: list[] = [
    {
      displayText: 'Designation1',
      value: 'Designation1'
    },
  ];
  citysList: list[] = [
    {
      displayText: 'City1',
      value: 'Designation1'
    },
  ];
  competencysList: list[] = [
    {
      displayText: 'Competency1',
      value: 'Competency1'
    },
  ];
  blocksList: list[] = [
    {
      displayText: 'Block1',
      value: 'Block1'
    },
  ];
  //#endregion

  //#region chps for phone number and email
  selectable = true;
  removable = true;
  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  //#endregion

  filterForm: FormGroup
  //#endregion

  //#region (constructor)
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FilterTableComponent>,
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
      phoneNumber: this.fb.array([], [Validators.pattern("^[0-9]*$"),
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

  add(event: MatChipInputEvent, controller: string): void {
    const input = event.input
    const value = event.value


    // Add values
    if ((value || "").trim()) {
      switch (controller) {
        case 'emails': this.emailControls.push(this.fb.control(value))
          break

        case 'phoneNumber': this.phoneNumberControls.push(this.fb.control(value))
          break
      }


    }

    // Reset the input value
    if (input) {
      input.value = ""
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

export interface list {
  displayText: string,
  value: string
}
