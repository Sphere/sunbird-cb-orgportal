import { HttpClientTestingModule } from '@angular/common/http/testing'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { KeycloakService } from 'keycloak-angular'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete'

import { SearchInputComponent } from './search-input.component'

describe('SearchInputComponent', () => {
  let component: SearchInputComponent
  let fixture: ComponentFixture<SearchInputComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatMenuModule, MatAutocompleteModule],
      declarations: [SearchInputComponent],
      providers: [
        { provide: 'environment', useValue: {} },
        { provide: KeycloakService, useValue: createSpyObj('KeycloakService', ['getKeycloakInstance']) },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: { q: 'all' },
              data: {
                searchPageData: {
                  data: {
                    search: {
                      isAutoCompleteAllowed: false,
                      languageSearch: ['all', 'en'],
                    },
                  },
                },
              },
            },
            queryParamMap: of({
              has: () => false,
              get: () => null,
            }),
            parent: null,
          },
        },
      ],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchInputComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
