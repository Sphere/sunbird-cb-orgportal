import { Component, OnInit } from '@angular/core'
import { MatDialogRef } from '@angular/material/dialog'

@Component({
  selector: 'ws-app-add-participants',
  templateUrl: './add-participants.component.html',
  styleUrls: ['./add-participants.component.scss']
})
export class AddParticipantsComponent implements OnInit {

  constructor(private dialogRef: MatDialogRef<AddParticipantsComponent>) { }

  ngOnInit(): void {
  }

  saveParticipants(): void {
    this.dialogRef.close('saved')
  }


}
