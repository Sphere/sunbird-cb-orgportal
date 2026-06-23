import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'

import { InvalidUserComponent } from './invalid-user.component'

describe('InvalidUserComponent', () => {
  let component: InvalidUserComponent
  let fixture: ComponentFixture<InvalidUserComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [InvalidUserComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
            params: of({}),
            snapshot: { params: {}, queryParams: {}, data: {} },
            data: of({ pageData: { data: { value: '' } } }),
          },
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
