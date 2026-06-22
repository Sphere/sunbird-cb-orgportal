import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'

import { FilterDialogComponent } from './filter-dialog.component'

describe('FilterTableComponent', () => {
  let component: FilterDialogComponent
  let fixture: ComponentFixture<FilterDialogComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [FilterDialogComponent],
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterDialogComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
