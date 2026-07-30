import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { EventService } from '../../services/event.service'

import { EventOverviewComponent } from './event-overview.component'

describe('EventOverviewComponent', () => {
  let component: EventOverviewComponent
  let fixture: ComponentFixture<EventOverviewComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EventOverviewComponent],
      imports: [HttpClientTestingModule],
      providers: [
        EventService,
        {
          provide: ActivatedRoute,
          useValue: { parent: { data: of({ eventdata: { data: {} } }) } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(EventOverviewComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
