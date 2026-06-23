import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'

import { SignupAutoComponent } from './signup-auto.component'
import { SignupAutoService } from './signup-auto.service'

describe('SignupAutoComponent', () => {
  let component: SignupAutoComponent
  let fixture: ComponentFixture<SignupAutoComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SignupAutoComponent],
      providers: [
        {
          provide: MatSnackBar,
          useValue: { open: jest.fn() },
        },
        {
          provide: SignupAutoService,
          useValue: {
            signup: jest.fn().mockReturnValue(of({ msg: '1005:success', email: 'test@test.com' })),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {}, data: {} },
            queryParams: of({}),
            params: of({}),
            data: of({}),
            paramMap: of({ get: jest.fn().mockReturnValue('test-id') }),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(SignupAutoComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
