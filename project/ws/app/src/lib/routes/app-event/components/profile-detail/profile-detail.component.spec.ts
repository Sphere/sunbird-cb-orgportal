import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { MatDialog } from '@angular/material/dialog'
import { of, BehaviorSubject } from 'rxjs'

import { ProfileDetailComponent } from './profile-detail.component'
import { EventService } from '../../services/event.service'
import { ValueService } from '@sunbird-cb/utils'

describe('ProfileDetailComponent', () => {
  let component: ProfileDetailComponent
  let fixture: ComponentFixture<ProfileDetailComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProfileDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({}),
            snapshot: { params: {}, queryParams: {}, data: {} },
            params: of({}),
            queryParams: of({}),
            parent: {
              data: of({
                eventdata: {
                  data: {
                    SessionCards: {
                      Sessions: {
                        S1: {
                          SessionImage: '',
                          SessionType: '',
                          SessionTitle: '',
                          Speaker: '',
                          SessionDescription: {
                            PresenterPosition: '',
                            Organization: '',
                            Content4: {},
                            Content3: {},
                          },
                          AttendeesList: {},
                          Attendees: 0,
                        },
                      },
                    },
                    Home: {},
                    Gallery: [],
                  },
                },
              }),
            },
          },
        },
        {
          provide: EventService,
          useValue: {
            bannerisEnabled: new BehaviorSubject<boolean>(true),
          },
        },
        {
          provide: MatDialog,
          useValue: {
            open: jest.fn(),
          },
        },
        {
          provide: ValueService,
          useValue: {
            isLtMedium$: new BehaviorSubject<boolean>(false),
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: jest.fn(),
            navigateByUrl: jest.fn(),
            events: of(),
            getCurrentNavigation: jest.fn().mockReturnValue({
              extras: { state: { sessionID: 'S1' } },
            }),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileDetailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
