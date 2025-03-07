import { Component, Inject, OnDestroy, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { Subscription } from 'rxjs'
import { take } from 'rxjs/operators'
import { EventService } from '../../services/event.service'
import { EventData } from '../../interface/events'



@Component({
  selector: 'ws-app-event-modal',
  templateUrl: './event-modal.component.html',
  styleUrls: ['./event-modal.component.scss']
})
export class EventModalComponent implements OnInit, OnDestroy {
  eventForm!: FormGroup
  isEditMode: boolean = false
  userData: any
  private userSubscription!: Subscription

  constructor(
    public dialogRef: MatDialogRef<EventModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private eventService: EventService
  ) { }

  ngOnInit(): void {
    this.initializeForm()
    this.userSubscription = this.eventService.currentUserData.pipe(take(1)).subscribe(data => {
      this.userData = data
    })
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe() // ✅ Unsubscribe to prevent memory leaks
    }
  }

  initializeForm(): void {
    this.eventForm = this.fb.group({
      eventName: ['', Validators.required],
      eventDate: ['', Validators.required],
      eventLocation: ['', Validators.required],
      eventDescription: ['', [Validators.required]],
      certificateType: ['', Validators.required]
    })

    if (this.data && this.data.event) {
      this.isEditMode = true
      this.eventForm.patchValue({
        eventName: this.data.event.eventName,
        eventDate: this.data.event.eventDate,
        eventLocation: this.data.event.eventPlace,
        eventDescription: this.data.event.eventDescription,
        certificateType: this.data.event.eventType
      })
    }
  }

  onCancel(): void {
    this.dialogRef.close()
  }

  onSave(): void {
    if (this.eventForm.valid) {
      const eventData: EventData = {
        eventName: this.eventForm.value.eventName,
        eventDescription: this.eventForm.value.eventDescription,
        eventDate: this.eventForm.value.eventDate,
        eventPlace: this.eventForm.value.eventLocation,
        eventType: this.eventForm.value.certificateType,
        createdBy: this.userData.userName,
      }

      if (this.isEditMode) {
        eventData.eventId = this.data.event.eventId
        this.eventService.editEvent(eventData).subscribe(
          response => {
            console.log('Edit Event updated successfully:', response)
            this.dialogRef.close(response)
          },
          error => {
            console.error('Error updating event:', error)
          }
        )
      } else {
        this.eventService.createEvent(eventData).subscribe(
          response => {
            console.log('Event created successfully:', response)
            this.dialogRef.close(response)
          },
          error => {
            console.error('Error creating event:', error)
          }
        )
      }
    }
  }
}
