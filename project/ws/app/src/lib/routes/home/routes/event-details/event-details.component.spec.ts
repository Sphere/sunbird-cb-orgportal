import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { MatDialog } from '@angular/material/dialog'
import { of, Subject } from 'rxjs'

import { EventDetailsComponent } from './event-details.component'
import { EventService } from '../../services/event.service'

describe('EventDetailsComponent', () => {
  let component: EventDetailsComponent
  let fixture: ComponentFixture<EventDetailsComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EventDetailsComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: () => null }),
            url: of([]),
            snapshot: { params: {}, queryParams: {}, data: {}, firstChild: null },
            firstChild: null,
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: jest.fn(),
            navigateByUrl: jest.fn(),
            events: of(),
          },
        },
        {
          provide: MatDialog,
          useValue: { open: jest.fn() },
        },
        {
          provide: EventService,
          useValue: {
            getEventById: jest.fn().mockReturnValue(of({})),
            updateEvent: jest.fn(),
          },
        },
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(EventDetailsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
