import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'

import { TncRendererComponent } from './tnc-renderer.component'

describe('TncRendererComponent', () => {
  let component: TncRendererComponent
  let fixture: ComponentFixture<TncRendererComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TncRendererComponent],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(TncRendererComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
