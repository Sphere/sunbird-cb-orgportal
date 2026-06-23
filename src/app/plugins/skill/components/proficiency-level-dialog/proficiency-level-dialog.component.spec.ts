import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ReactiveFormsModule, UntypedFormBuilder } from '@angular/forms'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { of } from 'rxjs'

import { ProficiencyLevelDialogComponent } from './proficiency-level-dialog.component'

describe('ProficiencyLevelDialogComponent', () => {
  let component: ProficiencyLevelDialogComponent
  let fixture: ComponentFixture<ProficiencyLevelDialogComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProficiencyLevelDialogComponent],
      imports: [ReactiveFormsModule],
      providers: [
        UntypedFormBuilder,
        {
          provide: MatDialogRef,
          useValue: { close: jest.fn(), afterClosed: () => of(undefined) },
        },
        { provide: MAT_DIALOG_DATA, useValue: { level: 1 } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ProficiencyLevelDialogComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
