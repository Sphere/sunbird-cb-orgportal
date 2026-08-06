import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { EventModalComponent } from './event-modal.component'

describe('EventModalComponent', () => {
  let component: EventModalComponent
  let fixture: ComponentFixture<EventModalComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EventModalComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: MatDialogRef, useValue: createSpyObj('MatDialogRef', ['close']) },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(EventModalComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should unsubscribe userSubscription on destroy', () => {
    const unsubSpy = jest.spyOn((component as any).userSubscription, 'unsubscribe')
    component.ngOnDestroy()
    expect(unsubSpy).toHaveBeenCalled()
  })

  it('should not throw on destroy when userSubscription is not set', () => {
    ;(component as any).userSubscription = undefined
    expect(() => component.ngOnDestroy()).not.toThrow()
  })

  it('should close dialog on cancel', () => {
    const closeSpy = jest.spyOn(component.dialogRef, 'close')
    component.onCancel()
    expect(closeSpy).toHaveBeenCalled()
  })

  it('should format date with current time', () => {
    const result = component.formatDate('2024-01-01')
    expect(typeof result).toBe('string')
    expect(new Date(result).getFullYear()).toBe(2024)
  })

  it('should not call createEvent/editEvent when form is invalid', () => {
    const eventService = TestBed.inject(EventService)
    const createSpy = jest.spyOn(eventService, 'createEvent')
    component.eventForm.reset()
    component.onSave()
    expect(createSpy).not.toHaveBeenCalled()
  })

  it('should create event when form is valid and not in edit mode', () => {
    const eventService = TestBed.inject(EventService)
    ;(component as any).userData = { userId: 'u1' }
    component.eventForm.patchValue({
      eventName: 'Test Event',
      eventDate: '2024-01-01',
      eventLocation: 'Loc',
      eventDescription: 'Desc',
      certificateType: 'type1',
    })
    const closeSpy = jest.spyOn(component.dialogRef, 'close')
    component.onSave()
    expect(eventService.createEvent).toHaveBeenCalled()
    expect(closeSpy).toHaveBeenCalled()
  })

  it('should default eventDescription to NA when blank/whitespace', () => {
    const eventService = TestBed.inject(EventService)
    ;(component as any).userData = { userId: 'u1' }
    component.eventForm.patchValue({
      eventName: 'Test Event',
      eventDate: '2024-01-01',
      eventLocation: 'Loc',
      eventDescription: '   ',
      certificateType: 'type1',
    })
    component.onSave()
    expect(eventService.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventDescription: 'NA' })
    )
  })

  it('should log error when createEvent fails', () => {
    const eventService = TestBed.inject(EventService)
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    ;(eventService.createEvent as jest.Mock).mockReturnValueOnce(
      new (require('rxjs').Observable)((subscriber: any) => subscriber.error('fail'))
    )
    ;(component as any).userData = { userId: 'u1' }
    component.eventForm.patchValue({
      eventName: 'Test Event',
      eventDate: '2024-01-01',
      eventLocation: 'Loc',
      eventDescription: 'Desc',
      certificateType: 'type1',
    })
    component.onSave()
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('should edit event when in edit mode', () => {
    const eventService = TestBed.inject(EventService)
    ;(component as any).userData = { userId: 'u1' }
    ;(component as any).isEditMode = true
    ;(component as any).data = { event: { eventId: 'e1' } }
    component.eventForm.patchValue({
      eventName: 'Test Event',
      eventDate: '2024-01-01',
      eventLocation: 'Loc',
      eventDescription: 'Desc',
      certificateType: 'type1',
    })
    const closeSpy = jest.spyOn(component.dialogRef, 'close')
    component.onSave()
    expect(eventService.editEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: 'e1' })
    )
    expect(closeSpy).toHaveBeenCalled()
  })

  it('should log error when editEvent fails', () => {
    const eventService = TestBed.inject(EventService)
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    ;(eventService.editEvent as jest.Mock).mockReturnValueOnce(
      new (require('rxjs').Observable)((subscriber: any) => subscriber.error('fail'))
    )
    ;(component as any).userData = { userId: 'u1' }
    ;(component as any).isEditMode = true
    ;(component as any).data = { event: { eventId: 'e1' } }
    component.eventForm.patchValue({
      eventName: 'Test Event',
      eventDate: '2024-01-01',
      eventLocation: 'Loc',
      eventDescription: 'Desc',
      certificateType: 'type1',
    })
    component.onSave()
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})

describe('EventModalComponent - edit mode init', () => {
  let component: EventModalComponent
  let fixture: ComponentFixture<EventModalComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EventModalComponent],
      imports: [ReactiveFormsModule, MatSelectModule, MatInputModule, MatDatepickerModule, MatNativeDateModule],
      providers: [
        { provide: MatDialogRef, useValue: { close: jest.fn() } },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            event: {
              eventName: 'Existing',
              eventDate: '2024-05-05',
              eventPlace: 'Place',
              eventDescription: 'Desc',
              eventType: 'type1',
              eventId: 'e99',
            },
          },
        },
        {
          provide: EventService,
          useValue: {
            currentUserData: of({ userId: 'u2' }),
            createEvent: jest.fn().mockReturnValue(of({})),
            editEvent: jest.fn().mockReturnValue(of({})),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(EventModalComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should initialize form in edit mode and patch values', () => {
    expect(component.isEditMode).toBe(true)
    expect(component.eventForm.value.eventName).toBe('Existing')
    expect((component as any).userData).toEqual({ userId: 'u2' })
  })
})
