import { ComponentFixture, TestBed } from '@angular/core/testing'

import { MapActivitiyCompetenciesComponent } from './map-activity-competencies.component'

describe('MapActivitiyCompetenciesComponent', () => {
  let component: MapActivitiyCompetenciesComponent
  let fixture: ComponentFixture<MapActivitiyCompetenciesComponent>

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MapActivitiyCompetenciesComponent]
    })
    fixture = TestBed.createComponent(MapActivitiyCompetenciesComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
