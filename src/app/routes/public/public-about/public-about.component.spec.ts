import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'

import { PublicAboutComponent } from './public-about.component'

describe('PublicAboutComponent', () => {
  let component: PublicAboutComponent
  let fixture: ComponentFixture<PublicAboutComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PublicAboutComponent],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(PublicAboutComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
