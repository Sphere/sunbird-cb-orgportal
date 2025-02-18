import { Component, Inject, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'

@Component({
  selector: 'ws-app-event-modal',
  templateUrl: './event-modal.component.html',
  styleUrls: ['./event-modal.component.scss']
})
export class EventModalComponent implements OnInit {
  eventForm: FormGroup

  constructor(
    public dialogRef: MatDialogRef<EventModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.eventForm = this.fb.group({
      eventName: ['', Validators.required],
      eventDate: ['', Validators.required],
      eventLocation: ['', Validators.required],
      eventDescription: ['', [Validators.required, Validators.maxLength(200)]],
      certificateType: ['', Validators.required]
    })
  }

  ngOnInit(): void {
  }

  onCancel(): void {
    this.dialogRef.close()
  }

  onSave(): void {
    if (this.eventForm.valid) {
      this.dialogRef.close(this.eventForm.value)
    }
  }

}
