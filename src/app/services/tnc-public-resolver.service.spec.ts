import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'

import { TncPublicResolverService } from './tnc-public-resolver.service'

describe('TncPublicResolverService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TncPublicResolverService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    })
  })

  it('should be created', () => {
    const service: TncPublicResolverService = TestBed.inject(TncPublicResolverService)
    expect(service).toBeTruthy()
  })
})
