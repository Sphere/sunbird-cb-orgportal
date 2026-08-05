import { Component, Inject, OnInit } from '@angular/core'
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog'

@Component({
  selector: 'ws-role-confirm-dialog',
  templateUrl: './role-confirm-dialog.component.html',
  styleUrls: ['./role-confirm-dialog.component.scss'],
})
export class RoleConfirmDialogComponent implements OnInit {

  constructor(
    private readonly dialogRef: MatDialogRef<RoleConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
  }

  ngOnInit() {
  }

  close() {
    this.dialogRef.close('close')
  }
}
