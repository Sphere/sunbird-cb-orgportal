import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { SuccessComponent } from './success.component'

describe('SuccessComponent', () => {
  let component: SuccessComponent
  let fixture: ComponentFixture<SuccessComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SuccessComponent],
      providers: [
        { provide: MatDialogRef, useValue: createSpyObj('MatDialogRef', ['close']) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
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
