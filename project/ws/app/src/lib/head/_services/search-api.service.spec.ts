import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { KeycloakService } from 'keycloak-angular'

import { SearchApiService } from './search-api.service'

const mockKeycloakService = {
  getKeycloakInstance: jest.fn().mockReturnValue(null),
}

describe('SearchApiService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: KeycloakService, useValue: mockKeycloakService },
    ],
  }))

  it('should be created', () => {
    const service: SearchApiService = TestBed.inject(SearchApiService)
    expect(service).toBeTruthy()
  })
})
