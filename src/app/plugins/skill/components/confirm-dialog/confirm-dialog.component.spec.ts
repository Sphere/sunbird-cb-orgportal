import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { of } from 'rxjs'

import { ConfirmDialogComponent } from './confirm-dialog.component'

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent
  let fixture: ComponentFixture<ConfirmDialogComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ConfirmDialogComponent],
      providers: [
        {
          provide: MatDialogRef,
          useValue: { close: jest.fn(), afterClosed: () => of(undefined) },
        },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            title: 'Test Title',
            footerConfig: {
              left: { type: 'button', title: 'Cancel' },
              right: { type: 'button', title: 'Confirm' },
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmDialogComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
