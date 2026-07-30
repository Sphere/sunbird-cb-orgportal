import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { KeycloakService } from 'keycloak-angular'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { FilterDisplayComponent } from './filter-display.component'

describe('FilterDisplayComponent', () => {
  let component: FilterDisplayComponent
  let fixture: ComponentFixture<FilterDisplayComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FilterDisplayComponent],
    imports: [HttpClientTestingModule],
    providers: [
        { provide: 'environment', useValue: {} },
        { provide: KeycloakService, useValue: createSpyObj('KeycloakService', ['getKeycloakInstance']) },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ pageData: { data: {} }, eventdata: { data: {} } }),
            paramMap: of({ get: () => null }),
            queryParamMap: of({ get: () => null }),
            params: of({}),
            snapshot: { paramMap: { get: () => null }, queryParamMap: { get: () => null }, data: {}, params: {} },
            parent: {
              data: of({ eventdata: { data: {} } }),
              params: of({}),
              snapshot: { data: { searchPageData: { data: { search: { tabs: [] } } } } },
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterDisplayComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
