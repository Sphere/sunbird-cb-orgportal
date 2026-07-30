import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { PipeLimitToPipe } from '@sunbird-cb/utils'

import { LearningCardComponent } from './learning-card.component'

describe('LearningCardComponent', () => {
  let component: LearningCardComponent
  let fixture: ComponentFixture<LearningCardComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LearningCardComponent, PipeLimitToPipe],
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: 'environment', useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(LearningCardComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
