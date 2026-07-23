import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { of } from 'rxjs'
import { ReactiveFormsModule } from '@angular/forms'
import { MatMenuModule } from '@angular/material/menu'
import { provideNoopAnimations } from '@angular/platform-browser/animations'

import { KnowledgeComponent } from './knowledge.component'
import { SearchServService } from '../../services/search-serv.service'
import { ValueService } from '@sunbird-cb/utils'

describe('KnowledgeComponent', () => {
  let component: KnowledgeComponent
  let fixture: ComponentFixture<KnowledgeComponent>

  const mockActivatedRoute = {
    snapshot: {
      queryParams: {},
      data: {},
      params: {},
      queryParamMap: { has: () => false, get: () => null },
    },
    queryParamMap: of({ has: () => false, get: () => null }),
    parent: null,
  }

  const mockSearchServService = {
    formatFilterForSearch: jest.fn().mockReturnValue(''),
    updateSelectedFiltersSet: jest.fn().mockReturnValue({ filterSet: new Set(), filterReset: false }),
    handleFilters: jest.fn().mockReturnValue({ filtersRes: [], concept: [] }),
    getLanguageSearchIndex: jest.fn().mockReturnValue('en'),
  }

  const mockValueService = {
    isLtMedium$: of(false),
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [KnowledgeComponent],
      imports: [ReactiveFormsModule, MatMenuModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: { navigate: jest.fn(), navigateByUrl: jest.fn(), events: of() } },
        { provide: SearchServService, useValue: mockSearchServService },
        { provide: ValueService, useValue: mockValueService },
      ],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(KnowledgeComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
