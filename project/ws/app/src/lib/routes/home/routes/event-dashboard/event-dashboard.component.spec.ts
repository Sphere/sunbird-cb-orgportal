import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { Router } from '@angular/router'
import { MatDialog } from '@angular/material/dialog'
import { of } from 'rxjs'

import { EventDashboardComponent } from './event-dashboard.component'
import { EventService } from '../../services/event.service'
import { WorkallocationService } from '../../services/workallocation.service'

describe('EventDashboardComponent', () => {
  let component: EventDashboardComponent
  let fixture: ComponentFixture<EventDashboardComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EventDashboardComponent],
      providers: [
        {
          provide: EventService,
          useValue: {
            updateEvent: jest.fn(),
            getAllEvents: jest.fn().mockReturnValue(of([])),
            setUserData: jest.fn(),
            currentEvent: of(null),
          },
        },
        {
          provide: WorkallocationService,
          useValue: {
            getAllUsers: jest.fn().mockReturnValue(of({ result: { response: { userId: 'u1', userName: 'Test' } } })),
          },
        },
        { provide: MatDialog, useValue: { open: jest.fn() } },
        { provide: Router, useValue: { navigate: jest.fn(), navigateByUrl: jest.fn(), events: of() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(EventDashboardComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
