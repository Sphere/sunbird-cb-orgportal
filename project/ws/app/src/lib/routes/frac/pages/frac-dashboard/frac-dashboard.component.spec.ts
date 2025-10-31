import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FracDashboardComponent } from './frac-dashboard.component';

describe('FracDashboardComponent', () => {
  let component: FracDashboardComponent;
  let fixture: ComponentFixture<FracDashboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FracDashboardComponent]
    });
    fixture = TestBed.createComponent(FracDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
