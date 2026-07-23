import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { of } from 'rxjs'

import { BtnContentFeedbackDialogV2Component } from './btn-content-feedback-dialog-v2.component'
import { FeedbackService } from '../../services/feedback.service'

const mockFeedbackService = {
  getFeedbackConfig: jest.fn().mockReturnValue(of({})),
  submitContentFeedback: jest.fn().mockReturnValue(of({})),
}

const mockDialogRef = {
  close: jest.fn(),
  afterClosed: () => of(undefined),
}

const mockSnackBar = {
  openFromComponent: jest.fn(),
}

describe('BtnContentFeedbackDialogV2Component', () => {
  let component: BtnContentFeedbackDialogV2Component
  let fixture: ComponentFixture<BtnContentFeedbackDialogV2Component>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [BtnContentFeedbackDialogV2Component],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { identifier: 'test-id' } },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: FeedbackService, useValue: mockFeedbackService },
        { provide: MatSnackBar, useValue: mockSnackBar },
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
