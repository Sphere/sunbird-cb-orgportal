import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'
import { PipeLimitToPipe } from '@sunbird-cb/utils'

import { QandaCardComponent } from './qanda-card.component'

describe('QandaCardComponent', () => {
  let component: QandaCardComponent
  let fixture: ComponentFixture<QandaCardComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [QandaCardComponent, PipeLimitToPipe],
      imports: [MatMenuModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(QandaCardComponent)
    component = fixture.componentInstance
    component.item = {
      highlight: {},
      postCreator: {},
      activity: { activityData: {} },
      tags: [],
    } as any
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
