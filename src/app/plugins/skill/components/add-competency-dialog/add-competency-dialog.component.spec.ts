import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { AddCompetencyDialogComponent } from './add-competency-dialog.component'

describe('AddCompetencyDialogComponent', () => {
  let component: AddCompetencyDialogComponent
  let fixture: ComponentFixture<AddCompetencyDialogComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddCompetencyDialogComponent],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AddCompetencyDialogComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
