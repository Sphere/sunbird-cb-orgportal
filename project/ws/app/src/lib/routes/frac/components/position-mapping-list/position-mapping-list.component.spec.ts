import { ComponentFixture, TestBed } from '@angular/core/testing'

import { PositionMappingListComponent } from './position-mapping-list.component'

describe('PositionMappingListComponent', () => {
  let component: PositionMappingListComponent
  let fixture: ComponentFixture<PositionMappingListComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PositionMappingListComponent]
    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(PositionMappingListComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
