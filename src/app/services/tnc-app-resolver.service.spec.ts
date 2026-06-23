import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ConfigurationsService } from '@sunbird-cb/utils'

import { TncAppResolverService } from './tnc-app-resolver.service'

describe('TncAppResolverService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TncAppResolverService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ConfigurationsService,
          useValue: {
            userPreference: null,
          },
        },
      ],
    })
  })

  it('should be created', () => {
    const service: TncAppResolverService = TestBed.inject(TncAppResolverService)
    expect(service).toBeTruthy()
  })
})
