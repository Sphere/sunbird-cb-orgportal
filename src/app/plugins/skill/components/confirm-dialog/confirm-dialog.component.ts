import { Component, Inject, OnInit } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material'

interface IPopData {
  title: string
  buttonTemplate: {
    leftTitle: string
    rightTitle: string
  }
}

@Component({
  selector: 'ws-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent implements OnInit {

  leftButton: {
    Title: string
  } = {
      Title: ''
    }

  rightButton: {
    Title: string
  } = {
      Title: ''
    }

  constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IPopData,
  ) {
    if (data && data.buttonTemplate) {
      this.leftButton.Title = data.buttonTemplate.leftTitle ? data.buttonTemplate.leftTitle : ''
      this.rightButton.Title = data.buttonTemplate.rightTitle ? data.buttonTemplate.rightTitle : ''
    }
  }

  ngOnInit() {
  }

  buttonClick() {
    this.dialogRef.close()
  }
}
