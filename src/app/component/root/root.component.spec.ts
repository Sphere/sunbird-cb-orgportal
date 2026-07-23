import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { Router } from '@angular/router'
import { of, Subject } from 'rxjs'
import { BreadcrumbsOrgService } from '@sunbird-cb/collection'
import { ConfigurationsService, ValueService, LoggerService } from '@sunbird-cb/utils'
import { SwUpdate } from '@angular/service-worker'
import { MatDialog } from '@angular/material/dialog'

import { MobileAppsService } from '../../services/mobile-apps.service'
import { RootService } from './root.service'
import { RootComponent } from './root.component'

describe('RootComponent', () => {
  let component: RootComponent
  let fixture: ComponentFixture<RootComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [RootComponent],
      providers: [
        {
          provide: Router,
          useValue: {
            navigate: jest.fn(),
            navigateByUrl: jest.fn(),
            events: of(),
            url: '/',
          },
        },
        {
          provide: BreadcrumbsOrgService,
          useValue: {
            initialize: jest.fn(),
          },
        },
        {
          provide: ConfigurationsService,
          useValue: {
            instanceConfig: null,
            restrictedFeatures: null,
          },
        },
        {
          provide: ValueService,
          useValue: {
            isXSmall$: of(false),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: SwUpdate,
          useValue: {
            isEnabled: false,
            checkForUpdate: jest.fn(),
            activateUpdate: jest.fn().mockResolvedValue(undefined),
            versionUpdates: new Subject(),
          },
        },
        {
          provide: MatDialog,
          useValue: {
            open: jest.fn().mockReturnValue({
              afterClosed: () => of(undefined),
            }),
          },
        },
        {
          provide: MobileAppsService,
          useValue: {
            init: jest.fn(),
          },
        },
        {
          provide: RootService,
          useValue: {
            showNavbarDisplay$: of(false),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    TestBed.overrideComponent(RootComponent, {
      set: {
        providers: [
          {
            provide: SwUpdate,
            useValue: {
              isEnabled: false,
              checkForUpdate: jest.fn(),
              activateUpdate: jest.fn().mockResolvedValue(undefined),
              versionUpdates: new Subject(),
            },
          },
        ],
      },
    })
    TestBed.compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(RootComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
