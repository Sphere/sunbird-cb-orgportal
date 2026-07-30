import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog'

import { ViewUsersComponent } from './view-users.component'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('ViewUsersComponent', () => {
  let component: ViewUsersComponent
  let fixture: ComponentFixture<ViewUsersComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ViewUsersComponent],
      providers: [
        { provide: MatDialogRef, useValue: createSpyObj('MatDialogRef', ['close']) },
        { provide: MAT_DIALOG_DATA, useValue: { userArray: [], noOfUser: '0' } },
      ],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewUsersComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
