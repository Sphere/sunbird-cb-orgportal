import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { MatDialog } from '@angular/material/dialog'
import { Router, ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { Globals } from '../../globals'

import { SetupDoneComponent } from './setup-done.component'

describe('SetupDoneComponent', () => {
  let component: SetupDoneComponent
  let fixture: ComponentFixture<SetupDoneComponent>

  const mockConfigurationsService = {
    pageNavBar: {},
    instanceConfig: null,
    userUrl: '',
  }

  const mockActivatedRoute = {
    data: of({ badges: { data: null } }),
    queryParams: of({}),
    params: of({}),
    snapshot: { params: {}, queryParams: {}, data: {} },
  }

  const mockDomSanitizer = {
    bypassSecurityTrustResourceUrl: jest.fn().mockReturnValue(''),
  }

  const mockMatDialog = {
    open: jest.fn(),
  }

  const mockRouter = {
    navigate: jest.fn(),
    navigateByUrl: jest.fn(),
    events: of(),
  }

  const mockGlobals = {
    firstTimeSetupDone: false,
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SetupDoneComponent],
      providers: [
        { provide: ConfigurationsService, useValue: mockConfigurationsService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: DomSanitizer, useValue: mockDomSanitizer },
        { provide: MatDialog, useValue: mockMatDialog },
        { provide: Router, useValue: mockRouter },
        { provide: Globals, useValue: mockGlobals },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(SetupDoneComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
