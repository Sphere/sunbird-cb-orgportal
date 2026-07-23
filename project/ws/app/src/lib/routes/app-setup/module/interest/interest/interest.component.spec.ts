import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { MatSnackBar } from '@angular/material/snack-bar'
import { of } from 'rxjs'
import { ConfigurationsService } from '@sunbird-cb/utils'
import { WidgetContentService, BtnPlaylistService } from '@sunbird-cb/collection'

import { InterestComponent } from './interest.component'

describe('InterestComponent', () => {
  let component: InterestComponent
  let fixture: ComponentFixture<InterestComponent>

  const mockActivatedRoute = {
    data: of({ pageData: { data: {} } }),
    queryParams: of({}),
    params: of({}),
    snapshot: { params: {}, queryParams: {}, data: {} },
  }

  const mockRouter = {
    navigate: jest.fn(),
    navigateByUrl: jest.fn(),
    events: of(),
  }

  const mockConfigurationsService = {
    pageNavBar: {},
    userProfile: null,
    instanceConfig: null,
    userUrl: '',
  }

  const mockWidgetContentService = {
    fetchMultipleContent: jest.fn().mockReturnValue(of([])),
  }

  const mockBtnPlaylistService = {
    getAllPlaylists: jest.fn().mockReturnValue(of([])),
    addPlaylistContent: jest.fn().mockReturnValue(of(null)),
    deletePlaylistContent: jest.fn().mockReturnValue(of(null)),
    upsertPlaylist: jest.fn().mockReturnValue(of(null)),
  }

  const mockMatSnackBar = {
    open: jest.fn(),
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [InterestComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: ConfigurationsService, useValue: mockConfigurationsService },
        { provide: WidgetContentService, useValue: mockWidgetContentService },
        { provide: BtnPlaylistService, useValue: mockBtnPlaylistService },
        { provide: MatSnackBar, useValue: mockMatSnackBar },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(InterestComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
