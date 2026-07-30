import { ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { EventModalComponent } from './event-modal.component'

describe('EventModalComponent', () => {
  let component: EventModalComponent
  let fixture: ComponentFixture<EventModalComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EventModalComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: MatDialogRef, useValue: createSpyObj('MatDialogRef', ['close']) },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(EventModalComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
