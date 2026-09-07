import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'

import { SearchApiService } from './search-api.service'
import { KeycloakService } from 'keycloak-angular'

describe('SearchApiService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: KeycloakService, useValue: { getKeycloakInstance: jest.fn().mockReturnValue(null) } },
    ],
  }))

  it('should be created', () => {
    const service: SearchApiService = TestBed.inject(SearchApiService)
    expect(service).toBeTruthy()
  })
})
