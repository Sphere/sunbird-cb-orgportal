import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { Router } from '@angular/router'
import { of } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { MapActivityCompetenciesComponent } from './map-activity-competencies.component'
import { CustomSnackbarService } from '../../../services/custom-snackbar.service'
import { FracApiService } from '../../../services/frac-api.service'

describe('MapActivityCompetenciesComponent', () => {
  let component: MapActivityCompetenciesComponent
  let fixture: ComponentFixture<MapActivityCompetenciesComponent>

  beforeEach(() => {
    const mockFracApiService = createSpyObj<FracApiService>('FracApiService', ['searchEntities', 'searchEntityMapping', 'mapEntity'])
    mockFracApiService.searchEntities.mockReturnValue(of({ result: { entity: [] } }) as any)
    mockFracApiService.searchEntityMapping.mockReturnValue(of({ result: [] }) as any)

    TestBed.configureTestingModule({
      declarations: [MapActivityCompetenciesComponent],
      providers: [
        { provide: CustomSnackbarService, useValue: createSpyObj('CustomSnackbarService', ['warning', 'success']) },
        { provide: FracApiService, useValue: mockFracApiService },
        { provide: MatDialog, useValue: createSpyObj('MatDialog', ['open']) },
        { provide: Router, useValue: createSpyObj('Router', ['navigateByUrl']) },
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
