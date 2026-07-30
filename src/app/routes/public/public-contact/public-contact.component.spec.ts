import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'

import { PublicContactComponent } from './public-contact.component'

describe('PublicContactComponent', () => {
  let component: PublicContactComponent
  let fixture: ComponentFixture<PublicContactComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PublicContactComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { data: of({ pageData: { data: {} } }) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(PublicContactComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
