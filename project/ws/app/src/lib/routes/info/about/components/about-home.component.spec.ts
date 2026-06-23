import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { BreakpointObserver } from '@angular/cdk/layout'
import { ConfigurationsService } from '@sunbird-cb/utils'

import { AboutHomeComponent } from './about-home.component'

describe('AboutHomeComponent', () => {
  let component: AboutHomeComponent
  let fixture: ComponentFixture<AboutHomeComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AboutHomeComponent],
      providers: [
        {
          provide: BreakpointObserver,
          useValue: { observe: jest.fn().mockReturnValue(of({ matches: false })) },
        },
        {
          provide: ConfigurationsService,
          useValue: { pageNavBar: {}, instanceConfig: null },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ pageData: { data: null } }),
            snapshot: { params: {}, queryParams: {}, data: {} },
            params: of({}),
            queryParams: of({}),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AboutHomeComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
