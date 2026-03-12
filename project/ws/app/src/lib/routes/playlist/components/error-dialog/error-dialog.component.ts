import { ChangeDetectionStrategy, Component, Inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'

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
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
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
