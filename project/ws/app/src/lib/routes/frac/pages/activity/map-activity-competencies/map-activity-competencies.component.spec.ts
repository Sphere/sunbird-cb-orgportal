import { ComponentFixture, TestBed } from '@angular/core/testing'

import { MapActivityCompetenciesComponent } from './map-activity-competencies.component'

describe('MapActivityCompetenciesComponent', () => {
  let component: MapActivityCompetenciesComponent
  let fixture: ComponentFixture<MapActivityCompetenciesComponent>

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MapActivityCompetenciesComponent]
    })
    fixture = TestBed.createComponent(MapActivityCompetenciesComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
