import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'

import { FaqHomeComponent } from './faq-home.component'
import { ValueService, ConfigurationsService } from '@sunbird-cb/utils'

describe('FaqHomeComponent', () => {
  let component: FaqHomeComponent
  let fixture: ComponentFixture<FaqHomeComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [FaqHomeComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ pageData: { data: [] } }),
            queryParamMap: of({ get: () => null }),
            snapshot: { params: {}, queryParams: {}, data: { pageData: { data: [] } } },
          },
        },
        {
          provide: ValueService,
          useValue: { isLtMedium$: of(false) },
        },
        {
          provide: ConfigurationsService,
          useValue: {
            pageNavBar: {},
            restrictedFeatures: null,
          },
        },
      ],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(FaqHomeComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
