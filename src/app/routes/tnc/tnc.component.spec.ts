import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { MatDialog } from '@angular/material/dialog'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { of } from 'rxjs'

import { TncComponent } from './tnc.component'
import { LoggerService, ConfigurationsService } from '@sunbird-cb/utils'
import { TncAppResolverService } from '../../services/tnc-app-resolver.service'
import { TncPublicResolverService } from '../../services/tnc-public-resolver.service'

describe('TncComponent', () => {
  let component: TncComponent
  let fixture: ComponentFixture<TncComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TncComponent],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {}, data: {} },
            queryParams: of({}),
            params: of({}),
            data: of({ tnc: { data: null }, isPublic: false }),
          },
        },
        {
          provide: Router,
          useValue: { navigate: jest.fn(), navigateByUrl: jest.fn(), events: of() },
        },
        {
          provide: MatDialog,
          useValue: { open: jest.fn().mockReturnValue({ afterClosed: () => of(undefined) }) },
        },
        {
          provide: LoggerService,
          useValue: {
            error: jest.fn(),
            log: jest.fn(),
          },
        },
        {
          provide: ConfigurationsService,
          useValue: {
            pageNavBar: {},
            isNewUser: false,
            hasAcceptedTnc: false,
            userUrl: '',
            appSetup: false,
          },
        },
        {
          provide: TncAppResolverService,
          useValue: {
            getTnc: jest.fn().mockReturnValue(of({})),
          },
        },
        {
          provide: TncPublicResolverService,
          useValue: {
            getPublicTnc: jest.fn().mockReturnValue(of({})),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(TncComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
