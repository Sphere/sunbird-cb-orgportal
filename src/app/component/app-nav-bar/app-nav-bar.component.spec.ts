import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { RouterTestingModule } from '@angular/router/testing'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'

import { AppNavBarComponent } from './app-nav-bar.component'

describe('AppNavBarComponent', () => {
  let component: AppNavBarComponent
  let fixture: ComponentFixture<AppNavBarComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AppNavBarComponent],
      imports: [RouterTestingModule, MatMenuModule],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AppNavBarComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
