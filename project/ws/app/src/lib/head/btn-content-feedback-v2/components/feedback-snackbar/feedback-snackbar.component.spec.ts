import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar'

import { FeedbackSnackbarComponent } from './feedback-snackbar.component'

describe('FeedbackSnackbarComponent', () => {
  let component: FeedbackSnackbarComponent
  let fixture: ComponentFixture<FeedbackSnackbarComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [FeedbackSnackbarComponent],
      providers: [
        { provide: MAT_SNACK_BAR_DATA, useValue: { action: 'content_feedback_submit', code: 'success' } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackSnackbarComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
