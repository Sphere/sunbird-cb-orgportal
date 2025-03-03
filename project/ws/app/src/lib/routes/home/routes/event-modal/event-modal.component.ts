import { Component, Inject, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { EventService } from '../../services/event.service'

interface EventData {
  eventName: any
  eventDescription: any
  eventDate: any
  eventPlace: any
  eventType: any
  createdBy: string
  eventId?: string // Optional property
}

@Component({
  selector: 'ws-app-event-modal',
  templateUrl: './event-modal.component.html',
  styleUrls: ['./event-modal.component.scss']
})
export class EventModalComponent implements OnInit {
  eventForm: FormGroup
  isEditMode: boolean = false


  constructor(
    public dialogRef: MatDialogRef<EventModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private eventService: EventService
  ) {
    this.eventForm = this.fb.group({
      eventName: ['', Validators.required],
      eventDate: ['', Validators.required],
      eventLocation: ['', Validators.required],
      eventDescription: ['', [Validators.required]],
      certificateType: ['', Validators.required]
    })

    if (data && data.event) {
      this.isEditMode = true
      this.eventForm.patchValue({
        eventName: data.event.eventName,
        eventDate: data.event.eventDate,
        eventLocation: data.event.eventPlace,
        eventDescription: data.event.eventDescription,
        certificateType: data.event.eventType
      })
    }
  }

  ngOnInit(): void {
  }

  onCancel(): void {
    this.dialogRef.close()
  }

  onSave(): void {
    if (this.eventForm.valid) {
      const eventData: EventData = {
        // event_name: this.eventForm.value.eventName,
        // event_description: this.eventForm.value.eventDescription,
        // event_date: this.eventForm.value.eventDate,
        // event_location: this.eventForm.value.eventLocation,
        // organizer_name: 'Active Birth', // You can change this as needed
        // organizer_contact: '+1-800-555-1234', // You can change this as needed
        // event_type: 'Conference', // You can change this as needed
        // event_status: this.eventForm.value.certificateType, // You can change this as needed
        // is_virtual: false // You can change this as needed


        eventName: this.eventForm.value.eventName,
        eventDescription: this.eventForm.value.eventDescription,
        eventDate: this.eventForm.value.eventDate,
        eventPlace: this.eventForm.value.eventLocation,

        eventType: this.eventForm.value.certificateType,
        createdBy: "test"

      }

      if (this.isEditMode) {
        eventData.eventId = this.data.event.eventId
        // eventData['updatedBy'] = "New Sumit Bajaj" // Replace with actual user
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
