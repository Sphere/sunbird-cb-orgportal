import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { of } from 'rxjs'

import { CardDetailsComponent } from './card-details.component'

describe('CardDetailsComponent', () => {
  let component: CardDetailsComponent
  let fixture: ComponentFixture<CardDetailsComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CardDetailsComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({}),
            snapshot: { params: {}, queryParams: {}, data: {} },
            params: of({}),
            queryParams: of({}),
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: jest.fn(),
            navigateByUrl: jest.fn(),
            events: of(),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(CardDetailsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
