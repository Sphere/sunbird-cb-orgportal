import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { BtnContentFeedbackV2Component } from './btn-content-feedback-v2.component'

describe('BtnContentFeedbackV2Component', () => {
  let component: BtnContentFeedbackV2Component
  let fixture: ComponentFixture<BtnContentFeedbackV2Component>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [BtnContentFeedbackV2Component],
      providers: [
        { provide: MatDialog, useValue: createSpyObj('MatDialog', ['open']) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(BtnContentFeedbackV2Component)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
