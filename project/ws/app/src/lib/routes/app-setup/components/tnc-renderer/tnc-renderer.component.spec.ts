import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core'

import { TncRendererComponent } from './tnc-renderer.component'

@Pipe({ name: 'pipeSafeSanitizer', standalone: false })
class MockPipeSafeSanitizer implements PipeTransform {
  transform(value: any): any { return value }
}

describe('TncRendererComponent', () => {
  let component: TncRendererComponent
  let fixture: ComponentFixture<TncRendererComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TncRendererComponent, MockPipeSafeSanitizer],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()
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
