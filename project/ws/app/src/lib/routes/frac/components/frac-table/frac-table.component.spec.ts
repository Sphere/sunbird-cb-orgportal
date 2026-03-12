import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FracTableComponent } from './frac-table.component';

describe('FracTableComponent', () => {
  let component: FracTableComponent;
  let fixture: ComponentFixture<FracTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FracTableComponent]
    });
    fixture = TestBed.createComponent(FracTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
