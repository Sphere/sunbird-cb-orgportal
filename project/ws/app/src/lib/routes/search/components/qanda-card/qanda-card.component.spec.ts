import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core'
import { MatMenuModule } from '@angular/material/menu'
import { provideNoopAnimations } from '@angular/platform-browser/animations'

import { QandaCardComponent } from './qanda-card.component'

@Pipe({ name: 'pipeLimitTo', standalone: false })
class MockPipeLimitTo implements PipeTransform {
  transform(value: any, limit: number): any {
    if (!value) { return value }
    return Array.isArray(value) ? value.slice(0, limit) : value
  }
}

describe('QandaCardComponent', () => {
  let component: QandaCardComponent
  let fixture: ComponentFixture<QandaCardComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [QandaCardComponent, MockPipeLimitTo],
      imports: [MatMenuModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [provideNoopAnimations()],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(QandaCardComponent)
    component = fixture.componentInstance
    component.item = {
      status: 'Active',
      id: '1',
      title: 'Test Question',
      abstract: 'Test abstract',
      body: 'Test body',
      tags: [],
      highlight: { title: [], body: [] },
      activity: { activityData: { upVote: 0, downVote: 0, like: 0 } },
      replyCount: 0,
      hasAcceptedAnswer: false,
      postCreator: { postCreatorId: 'user1', name: 'Test User', emailId: 'test@test.com' },
    } as any
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
