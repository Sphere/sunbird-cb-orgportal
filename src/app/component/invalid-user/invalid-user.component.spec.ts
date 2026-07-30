import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { PipeSafeSanitizerPipe } from '@sunbird-cb/utils'

import { InvalidUserComponent } from './invalid-user.component'

describe('InvalidUserComponent', () => {
  let component: InvalidUserComponent
  let fixture: ComponentFixture<InvalidUserComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InvalidUserComponent, PipeSafeSanitizerPipe],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { data: of({ pageData: { data: { value: 'invalid' } } }) },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(InvalidUserComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
