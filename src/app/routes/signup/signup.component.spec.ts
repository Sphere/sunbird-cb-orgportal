import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { of } from 'rxjs'

import { SignupComponent } from './signup.component'
import { SignupService } from './signup.service'

describe('SignupComponent', () => {
  let component: SignupComponent
  let fixture: ComponentFixture<SignupComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SignupComponent],
      imports: [ReactiveFormsModule],
      providers: [
        {
          provide: MatSnackBar,
          useValue: { open: jest.fn() },
        },
        {
          provide: SignupService,
          useValue: {
            signup: jest.fn().mockReturnValue(of({})),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(SignupComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
