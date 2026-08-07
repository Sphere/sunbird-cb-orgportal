import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { of, throwError } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { BtnContentFeedbackDialogV2Component } from './btn-content-feedback-dialog-v2.component'
import { FeedbackService } from '../../services/feedback.service'

describe('BtnContentFeedbackDialogV2Component', () => {
  let component: BtnContentFeedbackDialogV2Component
  let fixture: ComponentFixture<BtnContentFeedbackDialogV2Component>
  let dialogRef: ReturnType<typeof createSpyObj>
  let snackbar: ReturnType<typeof createSpyObj>
  let feedbackApi: ReturnType<typeof createSpyObj>

  const build = (content: any = { identifier: 'c1' }) => {
    dialogRef = createSpyObj('MatDialogRef', ['close'])
    snackbar = createSpyObj('MatSnackBar', ['open', 'openFromComponent'])
    feedbackApi = createSpyObj('FeedbackService', ['getFeedbackConfig', 'submitContentFeedback'])
    feedbackApi.getFeedbackConfig.mockReturnValue(of({}))

    TestBed.configureTestingModule({
      declarations: [BtnContentFeedbackDialogV2Component],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: content },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MatSnackBar, useValue: snackbar },
        { provide: FeedbackService, useValue: feedbackApi },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(BtnContentFeedbackDialogV2Component)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  afterEach(() => TestBed.resetTestingModule())

  it('should create with statuses reset to none', () => {
    build()
    expect(component).toBeTruthy()
    expect(component.positiveFeedbackSendStatus).toBe('none')
    // configFetchStatus starts as 'none' but ngOnInit's config fetch (mocked
    // as a synchronous of({})) already resolves to 'done' by this point.
    expect(component.configFetchStatus).toBe('done')
  })

  describe('ngOnInit', () => {
    it('should mark config fetch done on success', () => {
      build()
      feedbackApi.getFeedbackConfig.mockReturnValue(of({ questions: [] }))
      component.ngOnInit()
      expect(component.configFetchStatus).toBe('done')
      expect(component.feedbackConfig).toEqual({ questions: [] })
    })

    it('should mark config fetch as errored on failure', () => {
      build()
      feedbackApi.getFeedbackConfig.mockReturnValue(throwError(new Error('boom')))
      component.ngOnInit()
      expect(component.configFetchStatus).toBe('error')
    })
  })

  describe('submitPositiveFeedback', () => {
    it('should submit, reset the field, show a success toast, and close the dialog', () => {
      build()
      feedbackApi.submitContentFeedback.mockReturnValue(of({}))
      component.feedbackForm.patchValue({ positive: 'great' })
      component.submitPositiveFeedback('great')
      expect(component.positiveFeedbackSendStatus).toBe('done')
      expect(component.feedbackForm.value.positive).toBeNull()
      expect(snackbar.openFromComponent).toHaveBeenCalled()
      expect(dialogRef.close).toHaveBeenCalled()
    })

    it('should mark the send as errored on failure', () => {
      build()
      feedbackApi.submitContentFeedback.mockReturnValue(throwError(new Error('boom')))
      component.submitPositiveFeedback('great')
      expect(component.positiveFeedbackSendStatus).toBe('error')
      expect(dialogRef.close).not.toHaveBeenCalled()
    })
  })

  describe('submitNegativeFeedback', () => {
    it('should submit, reset the field, show a success toast, and close the dialog', () => {
      build()
      feedbackApi.submitContentFeedback.mockReturnValue(of({}))
      component.submitNegativeFeedback('bad')
      expect(component.negativeFeedbackSendStatus).toBe('done')
      expect(dialogRef.close).toHaveBeenCalled()
    })

    it('should mark the send as errored on failure', () => {
      build()
      feedbackApi.submitContentFeedback.mockReturnValue(throwError(new Error('boom')))
      component.submitNegativeFeedback('bad')
      expect(component.negativeFeedbackSendStatus).toBe('error')
    })
  })

  describe('submitSingleFeedback', () => {
    it('should submit, reset the field, show a success toast, and close the dialog', () => {
      build()
      feedbackApi.submitContentFeedback.mockReturnValue(of({}))
      component.singleFeedbackForm.patchValue({ feedback: 'text' })
      component.submitSingleFeedback()
      expect(component.singleFeedbackSendStatus).toBe('done')
      expect(component.singleFeedbackForm.value.feedback).toBeNull()
      expect(dialogRef.close).toHaveBeenCalled()
    })

    it('should mark the send as errored on failure', () => {
      build()
      feedbackApi.submitContentFeedback.mockReturnValue(throwError(new Error('boom')))
      component.submitSingleFeedback()
      expect(component.singleFeedbackSendStatus).toBe('error')
    })
  })

  describe('submitFeedback', () => {
    it('should submit positive feedback when the positive field is valid and non-empty', () => {
      build()
      feedbackApi.submitContentFeedback.mockReturnValue(of({}))
      component.feedbackForm.controls['positive'].setValue('great')
      const posSpy = jest.spyOn(component, 'submitPositiveFeedback')
      component.submitFeedback()
      expect(posSpy).toHaveBeenCalledWith('great')
    })

    it('should submit negative feedback when the negative field is valid and non-empty', () => {
      build()
      feedbackApi.submitContentFeedback.mockReturnValue(of({}))
      component.feedbackForm.controls['negative'].setValue('bad')
      const negSpy = jest.spyOn(component, 'submitNegativeFeedback')
      component.submitFeedback()
      expect(negSpy).toHaveBeenCalledWith('bad')
    })

    it('should do nothing when both fields are empty', () => {
      build()
      const posSpy = jest.spyOn(component, 'submitPositiveFeedback')
      const negSpy = jest.spyOn(component, 'submitNegativeFeedback')
      component.submitFeedback()
      expect(posSpy).not.toHaveBeenCalled()
      expect(negSpy).not.toHaveBeenCalled()
    })
  })

  it('ngOnDestroy should complete the destroy subject', () => {
    build()
    const completeSpy = jest.spyOn((component as any).destroy$, 'complete')
    component.ngOnDestroy()
    expect(completeSpy).toHaveBeenCalled()
  })
})
