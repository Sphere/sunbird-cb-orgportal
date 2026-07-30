import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'

import { MobileAppHomeComponent } from './mobile-app-home.component'

describe('MobileAppHomeComponent', () => {
  let component: MobileAppHomeComponent
  let fixture: ComponentFixture<MobileAppHomeComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MobileAppHomeComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { data: of({ pageData: { data: {} } }) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(MobileAppHomeComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
