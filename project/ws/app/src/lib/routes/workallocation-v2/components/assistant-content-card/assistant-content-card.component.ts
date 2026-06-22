import { Component, Input, OnInit, OnDestroy } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { PlayerDialogComponent } from '../player-dialog/player-dialog.component'

@Component({
  standalone: false,
  selector: 'ws-app-assistant-content-card',
  templateUrl: './assistant-content-card.component.html',
  styleUrls: ['./assistant-content-card.component.scss'],
})
export class AssistantContentCardComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>()
  @Input() content!: any
  constructor(public dialog: MatDialog) { }

  ngOnDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  }

  ngOnInit() {
  }

  openDialog() {
    const dialogRef = this.dialog.open(PlayerDialogComponent, {
      restoreFocus: false,
      disableClose: false,
      data: this.content,
      // height: '70vh',
      width: '70%',
      maxHeight: '80vh',
      maxWidth: '80%',
    })
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((val: any) => {
      if (val) {
        // tslint:disable-next-line: no-console
        console.log({ val })
      }
    })
  }

}
