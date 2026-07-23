import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { Router, ActivatedRoute } from '@angular/router'
import { MatDialog } from '@angular/material/dialog'
import { of, Subject } from 'rxjs'

import { FeaturesComponent } from './features.component'
import { ConfigurationsService, ValueService, SubapplicationRespondService } from '@sunbird-cb/utils'
import { CustomTourService } from '@sunbird-cb/collection'

describe('FeaturesComponent', () => {
  let component: FeaturesComponent
  let fixture: ComponentFixture<FeaturesComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [FeaturesComponent],
      imports: [ReactiveFormsModule],
      providers: [
        {
          provide: MatDialog,
          useValue: { open: jest.fn().mockReturnValue({ afterClosed: () => of(undefined) }) },
        },
        {
          provide: Router,
          useValue: { navigate: jest.fn(), navigateByUrl: jest.fn(), events: of() },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: { get: jest.fn().mockReturnValue(null) },
              params: {},
              queryParams: {},
              data: {},
            },
            queryParams: of({}),
            params: of({}),
            data: of({}),
          },
        },
        {
          provide: ConfigurationsService,
          useValue: {
            pageNavBar: {},
            appsConfig: null,
            restrictedFeatures: new Set(),
            tourGuideNotifier: new Subject(),
          },
        },
        {
          provide: CustomTourService,
          useValue: {
            startTour: jest.fn(),
            data: null,
          },
        },
        {
          provide: SubapplicationRespondService,
          useValue: {
            unsubscribeResponse: jest.fn(),
          },
        },
        {
          provide: ValueService,
          useValue: {
            isXSmall$: of(false),
            isLtMedium$: of(false),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(FeaturesComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
