import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityMappingTableComponent } from './activity-mapping-table.component';

describe('ActivityMappingTableComponent', () => {
  let component: ActivityMappingTableComponent;
  let fixture: ComponentFixture<ActivityMappingTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ActivityMappingTableComponent]
    });
    fixture = TestBed.createComponent(ActivityMappingTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
