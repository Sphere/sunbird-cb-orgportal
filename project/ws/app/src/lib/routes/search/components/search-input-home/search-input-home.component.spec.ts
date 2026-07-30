import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { KeycloakService } from 'keycloak-angular'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'
import { SearchInputHomeComponent } from './search-input-home.component'

describe('SearchInputComponent', () => {
  let component: SearchInputHomeComponent
  let fixture: ComponentFixture<SearchInputHomeComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SearchInputHomeComponent],
    imports: [HttpClientTestingModule, MatAutocompleteModule, MatMenuModule],
    providers: [
        { provide: 'environment', useValue: {} },
        { provide: KeycloakService, useValue: createSpyObj('KeycloakService', ['getKeycloakInstance']) },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ pageData: { data: {} }, eventdata: { data: {} } }),
            paramMap: of({ get: () => null }),
            params: of({}),
            snapshot: { paramMap: { get: () => null }, queryParamMap: { get: () => null }, data: {}, params: {}, queryParams: {} },
            parent: { data: of({ eventdata: { data: {} } }), params: of({}) },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchInputHomeComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
