import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { PlayerDialogComponent } from './player-dialog.component'

describe('PlayerDialogComponent', () => {
  let component: PlayerDialogComponent
  let fixture: ComponentFixture<PlayerDialogComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PlayerDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: createSpyObj('MatDialogRef', ['close']) },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerDialogComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
