import { ComponentFixture, TestBed } from '@angular/core/testing'

import { UploadActivityListTableComponent } from './upload-activity-list-table.component'

describe('UploadActivityListTableComponent', () => {
  let component: UploadActivityListTableComponent
  let fixture: ComponentFixture<UploadActivityListTableComponent>

  beforeEach(async) {
    await TestBed.configureTestingModule({
      declarations: [UploadActivityListTableComponent]
    })
      .compileComponents()

    fixture = TestBed.createComponent(UploadActivityListTableComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

it('should create', () => {
  expect(component).toBeTruthy()
});
});
