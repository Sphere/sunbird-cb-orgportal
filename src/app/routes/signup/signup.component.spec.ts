import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { SignupComponent } from './signup.component'

describe('SignupComponent', () => {
  let component: SignupComponent
  let fixture: ComponentFixture<SignupComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SignupComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: MatSnackBar, useValue: createSpyObj('MatSnackBar', ['open']) },
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
