import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { ConfigurationsService } from '@sunbird-cb/utils'

import { AppSetupHomeComponent } from './app-setup-home.component'

describe('AppSetupHomeComponent', () => {
  let component: AppSetupHomeComponent
  let fixture: ComponentFixture<AppSetupHomeComponent>

  const mockConfigurationsService = {
    activeLocale: null,
    instanceConfig: {
      introVideo: { en: '' },
    },
    userUrl: '',
    pageNavBar: {},
  }

  const mockMatDialog = {
    open: jest.fn(),
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AppSetupHomeComponent],
      providers: [
        { provide: ConfigurationsService, useValue: mockConfigurationsService },
        { provide: MatDialog, useValue: mockMatDialog },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AppSetupHomeComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
