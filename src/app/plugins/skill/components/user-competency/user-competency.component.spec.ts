import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { RouterTestingModule } from '@angular/router/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { UserCompetencyComponent } from './user-competency.component'

describe('UserCompetencyComponent', () => {
  let component: UserCompetencyComponent
  let fixture: ComponentFixture<UserCompetencyComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [UserCompetencyComponent],
      imports: [RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: MatDialog, useValue: createSpyObj('MatDialog', ['open']) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(UserCompetencyComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
