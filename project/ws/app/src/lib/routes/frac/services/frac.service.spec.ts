import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ConfigurationsService } from '@sunbird-cb/utils'

import { FracService } from './frac.service'

describe('FracService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      FracService,
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: ConfigurationsService, useValue: { baseUrl: '' } },
    ],
  }))

  it('should be created', () => {
    const service: FracService = TestBed.inject(FracService)
    expect(service).toBeTruthy()
  })
})
