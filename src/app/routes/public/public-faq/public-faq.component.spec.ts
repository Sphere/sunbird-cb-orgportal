import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'

import { PublicFaqComponent } from './public-faq.component'

describe('PublicFaqComponent', () => {
  let component: PublicFaqComponent
  let fixture: ComponentFixture<PublicFaqComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PublicFaqComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => null }) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(PublicFaqComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
