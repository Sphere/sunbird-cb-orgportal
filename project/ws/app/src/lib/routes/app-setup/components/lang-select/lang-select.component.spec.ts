import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { Router } from '@angular/router'
import { of } from 'rxjs'
import { ConfigurationsService, UserPreferenceService } from '@sunbird-cb/utils'

import { LangSelectComponent } from './lang-select.component'

describe('LangSelectComponent', () => {
  let component: LangSelectComponent
  let fixture: ComponentFixture<LangSelectComponent>

  const mockConfigurationsService = {
    userProfile: null,
    instanceConfig: null,
    userUrl: '',
    pageNavBar: {},
  }

  const mockUserPreferenceService = {
    saveUserPreference: jest.fn().mockResolvedValue(undefined),
  }

  const mockRouter = {
    navigate: jest.fn(),
    navigateByUrl: jest.fn(),
    events: of(),
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [LangSelectComponent],
      providers: [
        { provide: ConfigurationsService, useValue: mockConfigurationsService },
        { provide: Router, useValue: mockRouter },
        { provide: UserPreferenceService, useValue: mockUserPreferenceService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(LangSelectComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
