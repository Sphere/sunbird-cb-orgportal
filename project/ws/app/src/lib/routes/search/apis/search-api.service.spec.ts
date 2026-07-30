import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { KeycloakService } from 'keycloak-angular'
import { createSpyObj } from 'src/test-utils/create-spy-obj'

import { SearchApiService } from './search-api.service'

describe('SearchApiService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
    providers: [
      { provide: KeycloakService, useValue: createSpyObj('KeycloakService', ['getKeycloakInstance']) },
    ],
  }))

  it('should be created', () => {
    const service: SearchApiService = TestBed.inject(SearchApiService)
    expect(service).toBeTruthy()
  })
})
