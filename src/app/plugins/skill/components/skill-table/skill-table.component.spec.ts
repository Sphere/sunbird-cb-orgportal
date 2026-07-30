import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { SkillTableComponent } from './skill-table.component'

describe('MappingUserTableComponent', () => {
  let component: SkillTableComponent
  let fixture: ComponentFixture<SkillTableComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SkillTableComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: MatDialog, useValue: createSpyObj('MatDialog', ['open']) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillTableComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
