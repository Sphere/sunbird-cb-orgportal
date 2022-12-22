import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { ProficiencyLevelDialogComponent } from './proficiency-level-dialog.component'

describe('ProficiencyLevelDialogComponent', () => {
  let component: ProficiencyLevelDialogComponent
  let fixture: ComponentFixture<ProficiencyLevelDialogComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ProficiencyLevelDialogComponent],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ProficiencyLevelDialogComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
