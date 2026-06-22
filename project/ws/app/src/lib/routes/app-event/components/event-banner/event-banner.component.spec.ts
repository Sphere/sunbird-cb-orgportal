import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'

import { EventBannerComponent } from './event-banner.component'

describe('EventBannerComponent', () => {
  let component: EventBannerComponent
  let fixture: ComponentFixture<EventBannerComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [EventBannerComponent],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(EventBannerComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
