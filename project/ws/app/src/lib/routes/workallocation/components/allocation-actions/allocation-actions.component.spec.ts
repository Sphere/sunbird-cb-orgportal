import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'

import { AllocationActionsComponent } from './allocation-actions.component'

describe('AllocationActionsComponent', () => {
  let component: AllocationActionsComponent
  let fixture: ComponentFixture<AllocationActionsComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AllocationActionsComponent],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AllocationActionsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
