import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { EventService, ConfigurationsService } from '@sunbird-cb/utils'
import { KeycloakService } from 'keycloak-angular'

import { SearchServService } from './search-serv.service'
import { SearchApiService } from './search-api.service'

const mockEventService = {
  dispatchEvent: jest.fn(),
}

const mockConfigurationsService = {
  sitePath: '',
  activeOrg: '',
  rootOrg: '',
  userProfile: null,
}

const mockSearchApiService = {
  getSearchResults: jest.fn(),
  getSearchAutoCompleteResults: jest.fn(),
  getSearchV6Results: jest.fn(),
  getSearch: jest.fn(),
}

const mockKeycloakService = {
  getKeycloakInstance: jest.fn().mockReturnValue(null),
}

describe('SearchServService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: EventService, useValue: mockEventService },
      { provide: ConfigurationsService, useValue: mockConfigurationsService },
      { provide: SearchApiService, useValue: mockSearchApiService },
      { provide: KeycloakService, useValue: mockKeycloakService },
    ],
  }))

  it('should be created', () => {
    const service: SearchServService = TestBed.inject(SearchServService)
    expect(service).toBeTruthy()
  })
})
