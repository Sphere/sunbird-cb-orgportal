import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'

import { PublicContactComponent } from './public-contact.component'
import { ConfigurationsService } from '@sunbird-cb/utils'

describe('PublicContactComponent', () => {
  let component: PublicContactComponent
  let fixture: ComponentFixture<PublicContactComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PublicContactComponent],
      providers: [
        {
          provide: ConfigurationsService,
          useValue: {
            pageNavBar: {},
            instanceConfig: null,
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {}, data: {} },
            queryParams: of({}),
            params: of({}),
            data: of({ pageData: { data: {} } }),
          },
        },
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
