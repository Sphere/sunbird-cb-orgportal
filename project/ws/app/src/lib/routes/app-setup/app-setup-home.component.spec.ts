import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'

import { AppSetupHomeComponent } from './app-setup-home.component'

describe('AppSetupHomeComponent', () => {
  let component: AppSetupHomeComponent
  let fixture: ComponentFixture<AppSetupHomeComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AppSetupHomeComponent],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AppSetupHomeComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
