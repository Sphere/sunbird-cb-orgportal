import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { ProficiencyLevelDialogComponent } from './proficiency-level-dialog.component'

describe('ProficiencyLevelDialogComponent', () => {
  let component: ProficiencyLevelDialogComponent
  let fixture: ComponentFixture<ProficiencyLevelDialogComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ProficiencyLevelDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: createSpyObj('MatDialogRef', ['close']) },
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
