import { ComponentFixture, TestBed } from '@angular/core/testing'

import { ActivityMappingListComponent } from './activity-mapping-list.component'

describe('ActivityMappingListComponent', () => {
  let component: ActivityMappingListComponent
  let fixture: ComponentFixture<ActivityMappingListComponent>

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ActivityMappingListComponent]
    })
    fixture = TestBed.createComponent(ActivityMappingListComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
