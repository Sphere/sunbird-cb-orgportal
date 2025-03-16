import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button'
import { MatIconModule } from '@angular/material/icon'
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip'
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog'
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner'
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field'
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input'
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar'

import { BtnContentFeedbackV2Component } from './components/btn-content-feedback-v2/btn-content-feedback-v2.component'
import { BtnContentFeedbackDialogV2Component } from './components/btn-content-feedback-dialog-v2/btn-content-feedback-dialog-v2.component'
import { FeedbackSnackbarComponent } from './components/feedback-snackbar/feedback-snackbar.component'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'

@NgModule({
    declarations: [
        BtnContentFeedbackV2Component,
        BtnContentFeedbackDialogV2Component,
        FeedbackSnackbarComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        MatFormFieldModule,
        MatInputModule,
        MatSnackBarModule,
    ],
    exports: [
        BtnContentFeedbackV2Component,
        BtnContentFeedbackDialogV2Component,
        FeedbackSnackbarComponent,
    ]
})
export class BtnContentFeedbackV2Module { }
