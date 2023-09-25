import { Component, Inject, OnInit } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material'

@Component({
  selector: 'ws-role-confirm-dialog',
  templateUrl: './role-confirm-dialog.component.html',
  styleUrls: ['./role-confirm-dialog.component.scss'],
})
export class RoleConfirmDialogComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<RoleConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
  }

  ngOnInit() {
  }

  close() {
    this.dialogRef.close('close')
  }
}
