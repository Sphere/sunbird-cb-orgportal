import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'

import { SearchServService } from './search-serv.service'
import { SearchApiService } from '../apis/search-api.service'
import { EventService, ConfigurationsService } from '@sunbird-cb/utils'

describe('SearchServService', () => {
  const mockSearchApiService = {
    getSearchAutoCompleteResults: jest.fn().mockReturnValue({ toPromise: jest.fn().mockResolvedValue([]) }),
    getSearchResults: jest.fn(),
    getSearchV6Results: jest.fn(),
    userId: 'test-user-id',
  }

  const mockEventService = {
    dispatchEvent: jest.fn(),
    raiseInteractTelemetry: jest.fn(),
  }

  const mockConfigurationsService = {
    sitePath: '/assets',
    activeOrg: 'test-org',
    rootOrg: 'test-root-org',
    userPreference: null,
    activeLocale: null,
  }

  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: SearchApiService, useValue: mockSearchApiService },
      { provide: EventService, useValue: mockEventService },
      { provide: ConfigurationsService, useValue: mockConfigurationsService },
    ],
  }))

  it('should be created', () => {
    const service: SearchServService = TestBed.inject(SearchServService)
    expect(service).toBeTruthy()
  })
})
