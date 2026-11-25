import { Component, Inject } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'

interface IPopData {
  title: string
  footerConfig: {
    left: {
      type: string,
      title: string
    },
    right: {
      type: string,
      title: string
    }
  }
}

@Component({
  standalone: false,
  selector: 'ws-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent {

  constructor(
    private readonly dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IPopData,
  ) {
  }

  performAction(button: {
    type: string,
    title: string,
    action: string
  }) {
    this.dialogRef.close(button.action)
  }
}
