import { Component, Inject } from '@angular/core'
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog'

/** Dialog data interface */
export interface SuccessDialogData {
    title?: string
    message?: string
}

/**
 * Success Dialog Component
 * Displays after successful playlist save
 */
@Component({
    selector: 'app-success-dialog',
    templateUrl: './success-dialog.component.html',
    styleUrls: ['./success-dialog.component.scss']
})
export class SuccessDialogComponent {
    title: string
    message: string

    constructor(
        public dialogRef: MatDialogRef<SuccessDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: SuccessDialogData
    ) {
        this.title = data?.title || 'Courses Updated'
        this.message = data?.message || 'Learners will now see the updated courses on their home screen.'
    }

    onContinue(): void {
        this.dialogRef.close('continue')
    }
}
