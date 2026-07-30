import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { FracUploadPopupComponent } from './frac-upload-popup.component'

describe('FracUploadPopupComponent', () => {
  let component: FracUploadPopupComponent
  let fixture: ComponentFixture<FracUploadPopupComponent>

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FracUploadPopupComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { title: 'Upload' } },
        { provide: MatDialogRef, useValue: createSpyObj('MatDialogRef', ['close']) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    fixture = TestBed.createComponent(FracUploadPopupComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
