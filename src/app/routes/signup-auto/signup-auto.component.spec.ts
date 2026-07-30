import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar'
import { of } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { SignupAutoService } from './signup-auto.service'

import { SignupAutoComponent } from './signup-auto.component'

describe('SignupAutoComponent', () => {
  let component: SignupAutoComponent
  let fixture: ComponentFixture<SignupAutoComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SignupAutoComponent],
      imports: [HttpClientTestingModule],
      providers: [
        SignupAutoService,
        { provide: MatSnackBar, useValue: createSpyObj('MatSnackBar', ['open']) },
        { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => null }) } },
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
