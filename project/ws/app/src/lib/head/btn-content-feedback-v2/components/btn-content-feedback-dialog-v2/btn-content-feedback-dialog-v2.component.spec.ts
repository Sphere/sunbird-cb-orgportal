import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { BtnContentFeedbackDialogV2Component } from './btn-content-feedback-dialog-v2.component'

describe('BtnContentFeedbackDialogV2Component', () => {
  let component: BtnContentFeedbackDialogV2Component
  let fixture: ComponentFixture<BtnContentFeedbackDialogV2Component>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BtnContentFeedbackDialogV2Component],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: createSpyObj('MatDialogRef', ['close']) },
        { provide: MatSnackBar, useValue: createSpyObj('MatSnackBar', ['open', 'openFromComponent']) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(BtnContentFeedbackDialogV2Component)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
