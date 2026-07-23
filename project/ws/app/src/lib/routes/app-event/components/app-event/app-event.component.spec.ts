import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { BehaviorSubject } from 'rxjs'

import { AppEventComponent } from './app-event.component'
import { EventService } from '../../services/event.service'
import { ConfigurationsService } from '@sunbird-cb/utils'

describe('AppEventComponent', () => {
  let component: AppEventComponent
  let fixture: ComponentFixture<AppEventComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AppEventComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({}),
            snapshot: { params: {}, queryParams: {}, data: {} },
            params: of({}),
            queryParams: of({}),
          },
        },
        {
          provide: EventService,
          useValue: {
            bannerisEnabled: new BehaviorSubject<boolean>(true),
          },
        },
        {
          provide: ConfigurationsService,
          useValue: {
            pageNavBar: {},
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AppEventComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
