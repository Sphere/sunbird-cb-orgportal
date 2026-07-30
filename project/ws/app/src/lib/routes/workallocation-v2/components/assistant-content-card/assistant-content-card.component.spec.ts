import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { AssistantContentCardComponent } from './assistant-content-card.component'

describe('AssistantContentCardComponent', () => {
  let component: AssistantContentCardComponent
  let fixture: ComponentFixture<AssistantContentCardComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AssistantContentCardComponent],
      providers: [
        { provide: MatDialog, useValue: createSpyObj('MatDialog', ['open']) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AssistantContentCardComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
