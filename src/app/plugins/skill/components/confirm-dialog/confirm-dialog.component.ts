import { Component, Inject, OnInit } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material'

interface IPopData {
  title: string
  footerConfig: {
    left: {
      type: string,
      title: string,
    },
    right: {
      type: string,
      title: string,
    }
  }
}

@Component({
  selector: 'ws-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IPopData,
  ) {
  }

  ngOnInit() {
  }

  performAction(button: {
    type: string,
    title: string,
    action: string
  }) {
    this.dialogRef.close(button.action)
  }
}
