import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapRoleActivitiesComponent } from './map-role-activities.component';

describe('MapRoleActivitiesComponent', () => {
  let component: MapRoleActivitiesComponent;
  let fixture: ComponentFixture<MapRoleActivitiesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MapRoleActivitiesComponent]
    });
    fixture = TestBed.createComponent(MapRoleActivitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
