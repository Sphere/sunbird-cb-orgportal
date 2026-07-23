import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field'
import { of } from 'rxjs'

import { OfficerComponent } from './officer.component'
import { AllocationService } from '../../services/allocation.service'
import { WatStoreService } from '../../services/wat.store.service'

describe('OfficerComponent', () => {
  let component: OfficerComponent
  let fixture: ComponentFixture<OfficerComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [OfficerComponent],
      imports: [ReactiveFormsModule, MatAutocompleteModule, MatInputModule, MatFormFieldModule],
      providers: [
        {
          provide: AllocationService,
          useValue: {
            onSearchUser: jest.fn(() => of({ result: { response: { content: [] } } })),
            onSearchPosition: jest.fn(() => of({ responseData: [] })),
          },
        },
        {
          provide: WatStoreService,
          useValue: {
            setOfficerGroup: jest.fn(),
            getOfficerGroup: of({}),
            setCurrentProgress: jest.fn(),
            setErrorCount: jest.fn(),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(OfficerComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
