import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core'

import { LearningCardComponent } from './learning-card.component'
import { EventService, ConfigurationsService } from '@sunbird-cb/utils'

@Pipe({ name: 'pipeLimitTo', standalone: false })
class MockPipeLimitTo implements PipeTransform {
  transform(value: any, _limit: number): any { return value }
}

@Pipe({ name: 'pipeContentRoute', standalone: false })
class MockPipeContentRoute implements PipeTransform {
  transform(_value: any): any { return { url: '/', queryParams: {} } }
}

describe('LearningCardComponent', () => {
  let component: LearningCardComponent
  let fixture: ComponentFixture<LearningCardComponent>

  const mockEventService = {
    raiseInteractTelemetry: jest.fn(),
  }

  const mockConfigurationsService = {
    instanceConfig: null,
    userPreference: null,
    activeLocale: null,
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [LearningCardComponent, MockPipeLimitTo, MockPipeContentRoute],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: EventService, useValue: mockEventService },
        { provide: ConfigurationsService, useValue: mockConfigurationsService },
      ],
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
