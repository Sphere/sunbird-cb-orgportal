import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { KeycloakService } from 'keycloak-angular'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { SearchServService } from './search-serv.service'

describe('SearchServService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule, RouterTestingModule],
    providers: [
      { provide: 'environment', useValue: {} },
      { provide: KeycloakService, useValue: createSpyObj('KeycloakService', ['getKeycloakInstance']) },
    ],
  }))

  it('should be created', () => {
    const service: SearchServService = TestBed.inject(SearchServService)
    expect(service).toBeTruthy()
  })
})
