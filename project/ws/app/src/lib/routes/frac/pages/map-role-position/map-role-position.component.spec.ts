import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { of } from 'rxjs'

import { MapRolePositionComponent } from './map-role-position.component'
import { MatDialog } from '@angular/material/dialog'
import { CustomSnackbarService } from '../../services/custom-snackbar.service'
import { FracApiService } from '../../services/frac-api.service'

describe('MapRolePositionComponent', () => {
  let component: MapRolePositionComponent
  let fixture: ComponentFixture<MapRolePositionComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MapRolePositionComponent],
      providers: [
        {
          provide: CustomSnackbarService,
          useValue: { warning: () => { }, error: () => { }, success: () => { } },
        },
        {
          provide: FracApiService,
          useValue: {
            searchEntities: () => of({ result: { entity: [] } }),
            searchEntityMapping: () => of({ result: [] }),
            mapEntity: () => of({}),
          },
        },
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(undefined) }) } },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
        { provide: Router, useValue: { navigateByUrl: () => Promise.resolve(true) } },
      ],
    })
      .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(MapRolePositionComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
