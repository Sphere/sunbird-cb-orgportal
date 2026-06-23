import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'

import { PublicFaqComponent } from './public-faq.component'
import { ConfigurationsService, ValueService } from '@sunbird-cb/utils'

describe('PublicFaqComponent', () => {
  let component: PublicFaqComponent
  let fixture: ComponentFixture<PublicFaqComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PublicFaqComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {}, data: {} },
            queryParams: of({}),
            params: of({}),
            data: of({}),
            paramMap: of({ get: jest.fn().mockReturnValue(null) }),
          },
        },
        {
          provide: ValueService,
          useValue: {
            isXSmall$: of(false),
            isLtMedium$: of(false),
          },
        },
        {
          provide: ConfigurationsService,
          useValue: {
            pageNavBar: {},
            restrictedFeatures: new Set(),
          },
        },
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
