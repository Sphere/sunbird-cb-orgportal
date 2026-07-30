import { HttpClientTestingModule } from '@angular/common/http/testing'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { KeycloakService } from 'keycloak-angular'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete'

import { HomeComponent } from './home.component'

describe('HomeComponent', () => {
  let component: HomeComponent
  let fixture: ComponentFixture<HomeComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatMenuModule, MatAutocompleteModule],
      declarations: [HomeComponent],
      providers: [
        { provide: 'environment', useValue: {} },
        { provide: KeycloakService, useValue: createSpyObj('KeycloakService', ['getKeycloakInstance']) },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                pageData: {
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
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
