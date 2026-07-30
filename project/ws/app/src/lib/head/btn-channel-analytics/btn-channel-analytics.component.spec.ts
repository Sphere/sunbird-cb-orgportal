import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { BtnChannelAnalyticsComponent } from './btn-channel-analytics.component'

describe('BtnChannelAnalyticsComponent', () => {
  let component: BtnChannelAnalyticsComponent
  let fixture: ComponentFixture<BtnChannelAnalyticsComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BtnChannelAnalyticsComponent],
    })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(BtnChannelAnalyticsComponent)
    component = fixture.componentInstance
    component.widgetData = { identifier: 'test', contentType: 'channel' as any }
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
