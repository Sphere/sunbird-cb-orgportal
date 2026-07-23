import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { Router } from '@angular/router'
import { MatDialog } from '@angular/material/dialog'
import { of } from 'rxjs'

import { MapActivityCompetenciesComponent } from './map-activity-competencies.component'
import { CustomSnackbarService } from '../../../services/custom-snackbar.service'
import { FracApiService } from '../../../services/frac-api.service'

describe('MapActivityCompetenciesComponent', () => {
  let component: MapActivityCompetenciesComponent
  let fixture: ComponentFixture<MapActivityCompetenciesComponent>

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MapActivityCompetenciesComponent],
      providers: [
        { provide: CustomSnackbarService, useValue: { success: jest.fn(), error: jest.fn(), warning: jest.fn() } },
        {
          provide: FracApiService,
          useValue: {
            searchEntities: jest.fn().mockReturnValue(of({})),
            searchEntityMapping: jest.fn().mockReturnValue(of({})),
            mapEntity: jest.fn().mockReturnValue(of({})),
          },
        },
        { provide: MatDialog, useValue: { open: jest.fn() } },
        { provide: Router, useValue: { navigate: jest.fn(), navigateByUrl: jest.fn(), events: of() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    fixture = TestBed.createComponent(MapActivityCompetenciesComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
