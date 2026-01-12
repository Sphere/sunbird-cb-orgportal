import { Component, Inject } from '@angular/core'
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog'

export interface ErrorDialogData {
    title: string
    message: string
    details?: string
}

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
