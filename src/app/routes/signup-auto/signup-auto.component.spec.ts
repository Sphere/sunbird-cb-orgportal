import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'

import { SignupAutoComponent } from './signup-auto.component'

describe('SignupAutoComponent', () => {
  let component: SignupAutoComponent
  let fixture: ComponentFixture<SignupAutoComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SignupAutoComponent],
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
