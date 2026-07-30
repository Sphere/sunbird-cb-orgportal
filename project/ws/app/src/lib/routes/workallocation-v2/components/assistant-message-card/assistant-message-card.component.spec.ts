import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { WatStoreService } from '../../services/wat.store.service'

import { AssistantMessageCardComponent } from './assistant-message-card.component'

describe('AssistantMessageCardComponent', () => {
  let component: AssistantMessageCardComponent
  let fixture: ComponentFixture<AssistantMessageCardComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AssistantMessageCardComponent],
      providers: [WatStoreService],
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
