import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'

import { SkillTableComponent } from './skill-table.component'

describe('MappingUserTableComponent', () => {
  let component: SkillTableComponent
  let fixture: ComponentFixture<SkillTableComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SkillTableComponent],
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillTableComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
