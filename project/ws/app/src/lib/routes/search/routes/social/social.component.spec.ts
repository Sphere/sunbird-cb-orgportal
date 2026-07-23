import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { of } from 'rxjs'
import { ReactiveFormsModule } from '@angular/forms'
import { MatMenuModule } from '@angular/material/menu'
import { provideNoopAnimations } from '@angular/platform-browser/animations'

import { SocialComponent } from './social.component'
import { SearchApiService } from '../../apis/search-api.service'
import { SearchServService } from '../../services/search-serv.service'
import { ValueService } from '@sunbird-cb/utils'

describe('SocialComponent', () => {
  let component: SocialComponent
  let fixture: ComponentFixture<SocialComponent>

  const mockActivatedRoute = {
    snapshot: {
      queryParams: {},
      data: {},
      params: {},
    },
    queryParamMap: of({ has: () => false, get: () => null }),
    parent: null,
  }

  const mockSearchApiService = {
    userId: 'test-user-id',
  }

  const mockSearchServService = {
    updateSelectedFiltersSet: jest.fn().mockReturnValue({ filterSet: new Set(), filterReset: false }),
    handleFilters: jest.fn().mockReturnValue({ filtersRes: [], concept: [] }),
    fetchSocialSearchUsers: jest.fn().mockReturnValue(of({ total: 0, result: [], filters: [] })),
  }

  const mockValueService = {
    isLtMedium$: of(false),
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SocialComponent],
      imports: [ReactiveFormsModule, MatMenuModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: { navigate: jest.fn(), navigateByUrl: jest.fn(), events: of() } },
        { provide: SearchApiService, useValue: mockSearchApiService },
        { provide: SearchServService, useValue: mockSearchServService },
        { provide: ValueService, useValue: mockValueService },
      ],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(SocialComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
