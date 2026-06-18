import { Component, Inject, OnDestroy, OnInit } from '@angular/core'
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { Subscription } from 'rxjs'
import { take } from 'rxjs/operators'
import { EventService } from '../../services/event.service'
import { IEventData } from '../../interface/events'

@Component({
  standalone: false,
  selector: 'ws-app-event-modal',
  templateUrl: './event-modal.component.html',
  styleUrls: ['./event-modal.component.scss'],
})
export class EventModalComponent implements OnInit, OnDestroy {
  eventForm!: UntypedFormGroup
  isEditMode = false
  userData: any
  private userSubscription!: Subscription

  constructor(
    public readonly dialogRef: MatDialogRef<EventModalComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: any,
    private readonly fb: UntypedFormBuilder,
    private readonly eventService: EventService
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
      eventDescription: [''],
      certificateType: ['', Validators.required],
    })

    if (this.data && this.data.event) {
      this.isEditMode = true
      this.eventForm.patchValue({
        eventName: this.data.event.eventName,
        eventDate: this.data.event.eventDate,
        eventLocation: this.data.event.eventPlace,
        eventDescription: this.data.event.eventDescription,
        certificateType: this.data.event.eventType,
      })
    }
  }

  onCancel(): void {
    this.dialogRef.close()
  }

  onSave(): void {

    let formatedDate = this.formatDate(this.eventForm.value.eventDate)
    console.log('formatedDate', formatedDate)


    // console.log('date', new Date(this.eventForm.value.eventDate))
    if (this.eventForm.valid) {
      const eventData: IEventData = {
        eventName: this.eventForm.value.eventName,
        eventDescription: this.eventForm.value.eventDescription?.trim() || 'NA',
        eventDate: formatedDate,
        eventPlace: this.eventForm.value.eventLocation,
        eventType: this.eventForm.value.certificateType,
        createdBy: this.userData.userId,
      }
      console.log('Editmode', this.isEditMode)
      if (this.isEditMode) {

        eventData.eventId = this.data.event.eventId
        this.eventService.editEvent(eventData).subscribe({
          next: response => {
            console.log('Edit Event updated successfully:', response)
            this.dialogRef.close(response)
          },
          error: error => console.error('Error updating event:', error),
        })
      } else {
        this.eventService.createEvent(eventData).subscribe({
          next: response => {
            console.log('Event created successfully:', response)
            this.dialogRef.close(response)
          },
          error: error => console.error('Error creating event:', error),
        })
      }
    }
  }

  formatDate(date: string): string {

    const selectedDate = new Date(date)
    const currentTime = new Date()

    // Set the current time on the selected date
    selectedDate.setHours(
      currentTime.getHours(),
      currentTime.getMinutes(),
      currentTime.getSeconds(),
      currentTime.getMilliseconds()
    )

    return selectedDate.toISOString()

  }
}
