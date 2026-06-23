import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { of } from 'rxjs'

import { EventModalComponent } from './event-modal.component'
import { EventService } from '../../services/event.service'

describe('EventModalComponent', () => {
  let component: EventModalComponent
  let fixture: ComponentFixture<EventModalComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EventModalComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: MatDialogRef, useValue: { close: jest.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: null },
        {
          provide: EventService,
          useValue: {
            currentUserData: of(null),
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

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
