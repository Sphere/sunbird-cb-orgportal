import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { of } from 'rxjs'

import { EventBannerComponent } from './event-banner.component'

const mockEventData = {
  Home: {
    EventImageURL: ['', 'https://example.com/image.jpg'],
  },
  SessionCards: {
    Sessions: {},
  },
}

describe('EventBannerComponent', () => {
  let component: EventBannerComponent
  let fixture: ComponentFixture<EventBannerComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [EventBannerComponent],
      providers: [
        {
          provide: Router,
          useValue: {
            navigate: jest.fn(),
            navigateByUrl: jest.fn(),
            events: of(),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({}),
            snapshot: { params: {}, queryParams: {}, data: {} },
            params: of({}),
            queryParams: of({}),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(EventBannerComponent)
    component = fixture.componentInstance
    component.data = mockEventData
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
