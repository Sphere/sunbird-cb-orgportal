import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'

import { PublicFaqComponent } from './public-faq.component'

describe('PublicFaqComponent', () => {
  let component: PublicFaqComponent
  let fixture: ComponentFixture<PublicFaqComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PublicFaqComponent],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(PublicFaqComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
