import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'

import { ParticipantsComponent } from './participants.component'
import { EventService } from '../../services/event.service'

describe('ParticipantsComponent', () => {
  let component: ParticipantsComponent
  let fixture: ComponentFixture<ParticipantsComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ParticipantsComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({}),
            snapshot: { params: {}, queryParams: {}, data: {} },
            parent: { params: of({ id: 'test-event-id' }) },
          },
        },
        {
          provide: EventService,
          useValue: {
            getParticipants: jest.fn().mockReturnValue(of([])),
            getUserProfile: jest.fn().mockReturnValue(of({})),
            currentEvent: of(null),
          },
        },
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(ParticipantsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
