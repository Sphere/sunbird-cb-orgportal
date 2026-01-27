import { Component, Inject } from '@angular/core'
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog'

/**
 * Data passed to the Error Dialog
 */
export interface ErrorDialogData {
    /** Dialog title */
    title: string
    /** Main error message */
    message: string
    /** Optional technical details */
    details?: string
}

/**
 * Error Dialog Component
 * Displays error messages with optional retry functionality
 */
@Component({
    selector: 'app-error-dialog',
    templateUrl: './error-dialog.component.html',
    styleUrls: ['./error-dialog.component.scss'],
})
export class ErrorDialogComponent {
    labels = {
        close: 'Close',
        tryAgain: 'Try Again'
    }

    constructor(
        public dialogRef: MatDialogRef<ErrorDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ErrorDialogData
    ) { }

    onClose(): void {
        this.dialogRef.close(false)
    }

    onRetry(): void {
        this.dialogRef.close(true)
    }
}
