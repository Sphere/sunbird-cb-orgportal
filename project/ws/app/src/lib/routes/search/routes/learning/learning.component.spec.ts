import { HttpClientTestingModule } from '@angular/common/http/testing'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { UtilityService } from '../../../home/services/utility.service'
import { of } from 'rxjs'
import { KeycloakService } from 'keycloak-angular'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'

import { LearningComponent } from './learning.component'

describe('LearningComponent', () => {
  let component: LearningComponent
  let fixture: ComponentFixture<LearningComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatMenuModule],
      declarations: [LearningComponent],
      providers: [
        { provide: 'environment', useValue: {} },
        { provide: KeycloakService, useValue: createSpyObj('KeycloakService', ['getKeycloakInstance']) },
        UtilityService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                pageroute: 'learning',
                pageData: {
                  data: {
                    search: {
                      tabs: [
                        {
                          titleKey: 'learning',
                          phraseSearch: true,
                          isStandAlone: true,
                          acrossPreferredLang: false,
                          searchQuery: { filters: {} },
                        },
                      ],
                    },
                  },
                },
              },
              queryParamMap: {
                get: () => null,
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
    fixture = TestBed.createComponent(LearningComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
