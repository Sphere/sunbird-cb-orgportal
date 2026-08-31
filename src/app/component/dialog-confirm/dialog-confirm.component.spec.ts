import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { of } from 'rxjs'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { DialogConfirmComponent } from './dialog-confirm.component'

describe('DialogConfirmComponent', () => {
  let component: DialogConfirmComponent
  let fixture: ComponentFixture<DialogConfirmComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [DialogConfirmComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { title: 'Test', body: 'Test body' } },
        {
          provide: MatDialogRef,
          useValue: { ...createSpyObj('MatDialogRef', ['close']), afterClosed: () => of(undefined) },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogConfirmComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should confirm and close the dialog with true', () => {
    component.confirmed()
    expect((component as any).dialogRef.close).toHaveBeenCalledWith(true)
  })

  it('should default ok/cancel labels when not provided', () => {
    expect(component.data.ok).toBe('Yes')
    expect(component.data.cancel).toBe('No')
  })
})
