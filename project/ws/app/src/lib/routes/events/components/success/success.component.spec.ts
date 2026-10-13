import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatDialogRef } from '@angular/material/dialog'
import { of } from 'rxjs'

import { SuccessComponent } from './success.component'

describe('SuccessComponent', () => {
  let component: SuccessComponent
  let fixture: ComponentFixture<SuccessComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SuccessComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {
          provide: MatDialogRef,
          useValue: { close: jest.fn(), afterClosed: () => of(undefined) },
        },
      ],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(SuccessComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
