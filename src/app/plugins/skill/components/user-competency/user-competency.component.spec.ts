import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ActivatedRoute, Router } from '@angular/router'
import { of } from 'rxjs'

import { UserCompetencyComponent } from './user-competency.component'
import { CompetencyService } from '../../services/competency.service'
import { UsersService } from '../../services/users.service'

describe('UserCompetencyComponent', () => {
  let component: UserCompetencyComponent
  let fixture: ComponentFixture<UserCompetencyComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [UserCompetencyComponent],
      providers: [
        {
          provide: MatDialog,
          useValue: { open: jest.fn().mockReturnValue({ afterClosed: () => of(undefined) }) },
        },
        {
          provide: Router,
          useValue: { navigate: jest.fn(), navigateByUrl: jest.fn(), events: of() },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: jest.fn().mockReturnValue(null) },
              params: {},
              queryParams: {},
              data: {},
            },
            queryParams: of({}),
            params: of({}),
            data: of({}),
          },
        },
        {
          provide: CompetencyService,
          useValue: {
            getAllEntity: jest.fn().mockReturnValue(of({ result: { response: [] } })),
            getFormatedData: jest.fn().mockReturnValue([]),
            getUserPassbook: jest.fn().mockReturnValue(of({ result: { content: [] } })),
            updatePassbook: jest.fn().mockReturnValue(of({})),
            formatedUserCompetency: jest.fn().mockReturnValue([]),
          },
        },
        {
          provide: UsersService,
          useValue: {
            getUserById: jest.fn().mockReturnValue(of({})),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(UserCompetencyComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
