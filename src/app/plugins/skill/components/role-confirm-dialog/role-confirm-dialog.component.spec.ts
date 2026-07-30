import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { RoleConfirmDialogComponent } from './role-confirm-dialog.component'

describe('ConfirmDialogComponent', () => {
  let component: RoleConfirmDialogComponent
  let fixture: ComponentFixture<RoleConfirmDialogComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RoleConfirmDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: createSpyObj('MatDialogRef', ['close']) },
        { provide: MAT_DIALOG_DATA, useValue: { user: 'Test User', role: ['Admin'] } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(RoleConfirmDialogComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
