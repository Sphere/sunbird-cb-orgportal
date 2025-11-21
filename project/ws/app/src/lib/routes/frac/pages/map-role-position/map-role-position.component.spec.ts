import { ComponentFixture, TestBed } from '@angular/core/testing'

import { MapRolePositionComponent } from './map-role-position.component'

describe('MapRolePositionComponent', () => {
  let component: MapRolePositionComponent
  let fixture: ComponentFixture<MapRolePositionComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MapRolePositionComponent]
    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(MapRolePositionComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
