import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ReactiveFormsModule, UntypedFormBuilder } from '@angular/forms'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { MatSelectModule } from '@angular/material/select'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { of } from 'rxjs'

import { AddCompetencyDialogComponent } from './add-competency-dialog.component'
import { CompetencyService } from '../../services/competency.service'

describe('AddCompetencyDialogComponent', () => {
  let component: AddCompetencyDialogComponent
  let fixture: ComponentFixture<AddCompetencyDialogComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AddCompetencyDialogComponent],
      imports: [ReactiveFormsModule, MatSelectModule, MatFormFieldModule, MatInputModule, BrowserAnimationsModule],
      providers: [
        UntypedFormBuilder,
        {
          provide: MatDialogRef,
          useValue: { close: jest.fn(), afterClosed: () => of(undefined) },
        },
        { provide: MAT_DIALOG_DATA, useValue: { userId: 'test-user' } },
        {
          provide: CompetencyService,
          useValue: {
            getAllEntity: jest.fn().mockReturnValue(of({ result: { response: [] } })),
            getFormatedData: jest.fn().mockReturnValue([]),
            updatePassbook: jest.fn().mockReturnValue(of({})),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AddCompetencyDialogComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
