import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Platform } from '@angular/cdk/platform'
import { of } from 'rxjs'

import { MobileAppHomeComponent } from './mobile-app-home.component'
import { MobileAppsService } from 'src/app/services/mobile-apps.service'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { SanitizerService } from 'src/app/services/sanitizer.service'

describe('MobileAppHomeComponent', () => {
  let component: MobileAppHomeComponent
  let fixture: ComponentFixture<MobileAppHomeComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MobileAppHomeComponent],
      providers: [
        {
          provide: SanitizerService,
          useValue: {
            isHttpUrl: jest.fn().mockReturnValue(false),
            trustUrl: jest.fn().mockReturnValue(''),
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
        {
          provide: Platform,
          useValue: { IOS: false, ANDROID: false },
        },
        {
          provide: MobileAppsService,
          useValue: {
            iOsAppRef: null,
            isAndroidApp: false,
          },
        },
        {
          provide: ConfigurationsService,
          useValue: {
            pageNavBar: {},
          },
        },
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
