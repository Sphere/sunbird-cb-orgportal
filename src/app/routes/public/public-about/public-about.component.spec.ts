import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { BreakpointObserver } from '@angular/cdk/layout'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'

import { PublicAboutComponent } from './public-about.component'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { SanitizerService } from '../../../services/sanitizer.service'

describe('PublicAboutComponent', () => {
  let component: PublicAboutComponent
  let fixture: ComponentFixture<PublicAboutComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PublicAboutComponent],
      providers: [
        {
          provide: BreakpointObserver,
          useValue: {
            observe: jest.fn().mockReturnValue(of({ matches: false })),
          },
        },
        {
          provide: SanitizerService,
          useValue: {
            trustStyleUrl: jest.fn().mockReturnValue(''),
            trustResourceUrl: jest.fn().mockReturnValue(''),
          },
        },
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
            data: of({ pageData: { data: null } }),
          },
        },
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
