import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { EventBannerComponent } from './event-banner.component'

describe('EventBannerComponent', () => {
  let component: EventBannerComponent
  let fixture: ComponentFixture<EventBannerComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EventBannerComponent],
    imports: [HttpClientTestingModule],
    providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ pageData: { data: {} }, eventdata: { data: {} } }),
            paramMap: of({ get: () => null }),
            params: of({}),
            snapshot: { paramMap: { get: () => null }, queryParamMap: { get: () => null }, data: {}, params: {} },
            parent: { data: of({ eventdata: { data: {} } }), params: of({}) },
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
    component.data = { SessionCards: { Sessions: {} }, Home: { EventImageURL: ['', ''] } }
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
