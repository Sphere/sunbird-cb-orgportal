import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of, BehaviorSubject } from 'rxjs'
import { HttpClientTestingModule } from '@angular/common/http/testing'

import { EventOverviewComponent } from './event-overview.component'
import { EventService } from '../../services/event.service'

describe('EventOverviewComponent', () => {
  let component: EventOverviewComponent
  let fixture: ComponentFixture<EventOverviewComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [EventOverviewComponent],
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({}),
            snapshot: { params: {}, queryParams: {}, data: {} },
            params: of({}),
            queryParams: of({}),
            parent: { data: of({ eventdata: { data: { Home: { SessionTypes: {} } } } }) },
          },
        },
        {
          provide: EventService,
          useValue: {
            bannerisEnabled: new BehaviorSubject<boolean>(true),
          },
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
