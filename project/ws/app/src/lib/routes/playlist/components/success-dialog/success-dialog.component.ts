import { Component } from '@angular/core'
import { MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog'

/**
 * Success Dialog Component
 * Displays after successful playlist save
 * Success dialog for playlist save confirmation
 */
@Component({
    selector: 'app-success-dialog',
    templateUrl: './success-dialog.component.html',
    styleUrls: ['./success-dialog.component.scss']
})
export class SuccessDialogComponent {
    constructor(public dialogRef: MatDialogRef<SuccessDialogComponent, any>) { }

    onContinue(): void {
        this.dialogRef.close('continue')
    }
}
