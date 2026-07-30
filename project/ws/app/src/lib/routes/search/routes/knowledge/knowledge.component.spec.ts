import { HttpClientTestingModule } from '@angular/common/http/testing'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import { KeycloakService } from 'keycloak-angular'
import { createSpyObj } from 'src/test-utils/create-spy-obj'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'

import { KnowledgeComponent } from './knowledge.component'

describe('KnowledgeComponent', () => {
  let component: KnowledgeComponent
  let fixture: ComponentFixture<KnowledgeComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatMenuModule],
      declarations: [KnowledgeComponent],
      providers: [
        { provide: 'environment', useValue: {} },
        { provide: KeycloakService, useValue: createSpyObj('KeycloakService', ['getKeycloakInstance']) },
        {
          provide: ActivatedRoute,
          useValue: {
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
    fixture = TestBed.createComponent(KnowledgeComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
