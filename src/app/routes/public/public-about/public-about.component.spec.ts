import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'

import { PublicAboutComponent } from './public-about.component'

describe('PublicAboutComponent', () => {
  let component: PublicAboutComponent
  let fixture: ComponentFixture<PublicAboutComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PublicAboutComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { data: of({ pageData: { data: {} } }) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
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
