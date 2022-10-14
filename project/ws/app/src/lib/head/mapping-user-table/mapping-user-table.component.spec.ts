import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MappingUserTableComponent } from './mapping-user-table.component';

describe('MappingUserTableComponent', () => {
  let component: MappingUserTableComponent;
  let fixture: ComponentFixture<MappingUserTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MappingUserTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MappingUserTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
