import { Component, Inject, OnInit } from '@angular/core'
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog'

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
  selector: 'ws-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent implements OnInit {

  constructor(
    private readonly dialogRef: MatDialogRef<ConfirmDialogComponent>,
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
