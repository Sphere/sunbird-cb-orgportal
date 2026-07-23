import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { of } from 'rxjs'

import { AllocationActionsComponent } from './allocation-actions.component'
import { AllocationService } from '../../services/allocation.service'

describe('AllocationActionsComponent', () => {
  let component: AllocationActionsComponent
  let fixture: ComponentFixture<AllocationActionsComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AllocationActionsComponent],
      imports: [ReactiveFormsModule],
      providers: [
        {
          provide: AllocationService,
          useValue: {
            onSearchRole: jest.fn(() => of([])),
            onSearchCompetency: jest.fn(() => of({ responseData: [] })),
            onSearchActivity: jest.fn(() => of({ responseData: [] })),
            createAllocation: jest.fn(() => of({})),
          },
        },
        {
          provide: MatDialogRef,
          useValue: {
            close: jest.fn(),
            afterClosed: () => of(undefined),
          },
        },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {},
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AllocationActionsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
