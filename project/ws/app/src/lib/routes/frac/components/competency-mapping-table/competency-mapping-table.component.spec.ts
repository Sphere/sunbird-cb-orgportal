import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompetencyMappingTableComponent } from './competency-mapping-table.component';

describe('CompetencyMappingTableComponent', () => {
  let component: CompetencyMappingTableComponent;
  let fixture: ComponentFixture<CompetencyMappingTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CompetencyMappingTableComponent]
    });
    fixture = TestBed.createComponent(CompetencyMappingTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
