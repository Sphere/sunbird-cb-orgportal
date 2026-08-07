import { Component, OnInit, OnDestroy, Inject } from '@angular/core'
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog'
import { UntypedFormControl } from '@angular/forms'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
@Component({
  standalone: false,
  selector: 'ws-app-view-users',
  templateUrl: './view-users.component.html',
  styleUrls: ['./view-users.component.scss'],
})
export class ViewUsersComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>()
  userData: {
    userArray: any[],
    noOfUser: string
  }
  userDataList: any[] = []
  searchControl = new UntypedFormControl()
  constructor(
    private readonly dialogRef: MatDialogRef<ViewUsersComponent>,
    @Inject(MAT_DIALOG_DATA) data: {
      userArray: any[],
      noOfUser: string
    },
  ) {
    this.userData = data
  }

  ngOnInit() {
    this.userDataList = this.userData.userArray
    this.searchControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
      if (this.userData.userArray.filter(d => d.UserName.toLowerCase().includes(val.toLowerCase()))) {
        this.userDataList = this.userData.userArray.filter(d => d.UserName.toLowerCase().includes(val.toLowerCase()))
      }
    })
  }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

  clear() {
    this.searchControl.setValue('')
  }
  close(): void {
    this.dialogRef.close()
  }
}
