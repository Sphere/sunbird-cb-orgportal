import { Component, Inject, OnInit } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'

@Component({
  standalone: false,
  selector: 'ws-event-thumbnail',
  templateUrl: './event-thumbnail.component.html',
  styleUrls: ['./event-thumbnail.component.scss'],
})
export class EventThumbnailComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<EventThumbnailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {

  }

  ngOnInit() {

  }
}
