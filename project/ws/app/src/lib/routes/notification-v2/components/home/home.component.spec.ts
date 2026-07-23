import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { Router } from '@angular/router'
import { of } from 'rxjs'

import { HomeComponent } from './home.component'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { NotificationApiService } from '../../services/notification-api.service'
import { NotificationService } from '../../services/notification.service'

describe('HomeComponent', () => {
  let component: HomeComponent
  let fixture: ComponentFixture<HomeComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HomeComponent],
      providers: [
        {
          provide: ConfigurationsService,
          useValue: {
            pageNavBar: {},
            instanceConfig: {},
            baseUrl: '',
          },
        },
        {
          provide: NotificationApiService,
          useValue: {
            getNotifications: jest.fn().mockReturnValue(of({ data: [], page: undefined })),
            updateNotificationSeenStatus: jest.fn().mockReturnValue(of({})),
            getCount: jest.fn().mockReturnValue(of(0)),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            mapRoute: jest.fn(),
          },
        },
        { provide: Router, useValue: { navigate: jest.fn(), navigateByUrl: jest.fn(), events: of() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
