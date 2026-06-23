import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { of } from 'rxjs'

import { AssistantMessageCardComponent } from './assistant-message-card.component'
import { WatStoreService } from '../../services/wat.store.service'

describe('AssistantMessageCardComponent', () => {
  let component: AssistantMessageCardComponent
  let fixture: ComponentFixture<AssistantMessageCardComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AssistantMessageCardComponent],
      providers: [
        {
          provide: WatStoreService,
          useValue: {
            getactivitiesGroup: of([]),
            getcompetencyGroup: of([]),
            getUpdateCompGroupO: of([]),
            getOfficerGroup: of({}),
            setErrorCount: jest.fn(),
            setCurrentProgress: jest.fn(),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AssistantMessageCardComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
