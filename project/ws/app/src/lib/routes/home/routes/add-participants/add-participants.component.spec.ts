import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { of } from 'rxjs'

import { AddParticipantsComponent } from './add-participants.component'
import { EventService } from '../../services/event.service'

describe('AddParticipantsComponent', () => {
  let component: AddParticipantsComponent
  let fixture: ComponentFixture<AddParticipantsComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddParticipantsComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: jest.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: { eventId: 'evt-1', eventType: false } },
        {
          provide: EventService,
          useValue: {
            addParticipants: jest.fn().mockReturnValue(of({})),
            currentEvent: of(null),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(AddParticipantsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
