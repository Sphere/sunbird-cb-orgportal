import { Component, Inject } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'

@Component({
  standalone: false,
  selector: 'ws-role-confirm-dialog',
  templateUrl: './role-confirm-dialog.component.html',
  styleUrls: ['./role-confirm-dialog.component.scss'],
})
export class RoleConfirmDialogComponent {

  constructor(
    private dialogRef: MatDialogRef<RoleConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
  }

  close() {
    this.dialogRef.close('close')
  }
}
