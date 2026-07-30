import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { createSpyObj } from 'src/test-utils/create-spy-obj';

import { MapRoleActivitiesComponent } from './map-role-activities.component';

describe('MapRoleActivitiesComponent', () => {
  let component: MapRoleActivitiesComponent;
  let fixture: ComponentFixture<MapRoleActivitiesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MapRoleActivitiesComponent],
      imports: [RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: MatDialog, useValue: createSpyObj('MatDialog', ['open']) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(MapRoleActivitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
