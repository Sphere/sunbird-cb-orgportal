import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { PipeSafeSanitizerPipe } from '@sunbird-cb/utils'

import { TncRendererComponent } from './tnc-renderer.component'

describe('TncRendererComponent', () => {
  let component: TncRendererComponent
  let fixture: ComponentFixture<TncRendererComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TncRendererComponent, PipeSafeSanitizerPipe],
      schemas: [NO_ERRORS_SCHEMA],
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
