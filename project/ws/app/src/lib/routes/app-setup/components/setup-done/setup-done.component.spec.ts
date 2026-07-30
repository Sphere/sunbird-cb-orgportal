import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { ActivatedRoute } from '@angular/router'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { of } from 'rxjs'

import { SetupDoneComponent } from './setup-done.component'
import { Globals } from '../../globals'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

describe('SetupDoneComponent', () => {
  let component: SetupDoneComponent
  let fixture: ComponentFixture<SetupDoneComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      declarations: [SetupDoneComponent],
      providers: [
        Globals,
        { provide: MatDialog, useValue: createSpyObj('MatDialog', ['open']) },
        {
          provide: ActivatedRoute,
          useValue: { data: of({ badges: { data: { recent: [] } } }) },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(SetupDoneComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
