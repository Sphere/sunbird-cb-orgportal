import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatLegacyAutocompleteModule } from '@angular/material/legacy-autocomplete'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { ParticipantsComponent } from './participants.component'

describe('ParticipantsComponent', () => {
  let component: ParticipantsComponent
  let fixture: ComponentFixture<ParticipantsComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ParticipantsComponent],
      imports: [HttpClientTestingModule, MatLegacyAutocompleteModule],
      providers: [
        { provide: MatDialogRef, useValue: createSpyObj('MatDialogRef', ['close']) },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
