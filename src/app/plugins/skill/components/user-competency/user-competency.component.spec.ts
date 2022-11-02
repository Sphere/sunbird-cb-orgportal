import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { UserCompetencyComponent } from './user-competency.component'

describe('UserCompetencyComponent', () => {
  let component: UserCompetencyComponent
  let fixture: ComponentFixture<UserCompetencyComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [UserCompetencyComponent],
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
