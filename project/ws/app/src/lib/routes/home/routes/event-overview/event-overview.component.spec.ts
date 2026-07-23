import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { Router } from '@angular/router'
import { ActivatedRoute } from '@angular/router'
import { MatDialog } from '@angular/material/dialog'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { of } from 'rxjs'

import { EventOverviewComponent } from './event-overview.component'
import { EventService } from '../../services/event.service'
import { ConfigurationsService } from '@sunbird-cb/utils'

describe('EventOverviewComponent', () => {
  let component: EventOverviewComponent
  let fixture: ComponentFixture<EventOverviewComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EventOverviewComponent],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        {
          provide: EventService,
          useValue: {
            currentEvent: of(null),
            getParticipants: jest.fn().mockReturnValue(of([])),
            getEventById: jest.fn().mockReturnValue(of({})),
            updateEvent: jest.fn(),
            downloadCertificates: jest.fn().mockReturnValue(of(new Blob())),
          },
        },
        {
          provide: ConfigurationsService,
          useValue: {
            instanceConfig: {},
            baseUrl: '',
          },
        },
        { provide: MatDialog, useValue: { open: jest.fn() } },
        { provide: Router, useValue: { navigate: jest.fn(), navigateByUrl: jest.fn(), events: of() } },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
            params: of({}),
            snapshot: { params: {}, queryParams: {}, data: {} },
            data: of({}),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(EventOverviewComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
