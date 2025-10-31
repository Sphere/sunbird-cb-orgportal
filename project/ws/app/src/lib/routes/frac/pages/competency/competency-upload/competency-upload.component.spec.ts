import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompetencyUploadComponent } from './competency-upload.component';

describe('CompetencyUploadComponent', () => {
  let component: CompetencyUploadComponent;
  let fixture: ComponentFixture<CompetencyUploadComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CompetencyUploadComponent]
    });
    fixture = TestBed.createComponent(CompetencyUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
