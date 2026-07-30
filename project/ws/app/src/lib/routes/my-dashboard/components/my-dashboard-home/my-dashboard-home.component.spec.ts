import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { RouterTestingModule } from '@angular/router/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'

import { MyDashboardHomeComponent } from './my-dashboard-home.component'

describe('MyDashboardHomeComponent', () => {
  let component: MyDashboardHomeComponent
  let fixture: ComponentFixture<MyDashboardHomeComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MyDashboardHomeComponent],
      imports: [RouterTestingModule, HttpClientTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(MyDashboardHomeComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
