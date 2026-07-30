import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'

import { TncPublicResolverService } from './tnc-public-resolver.service'

describe('TncPublicResolverService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
    providers: [TncPublicResolverService],
  }))

  it('should be created', () => {
    const service: TncPublicResolverService = TestBed.inject(TncPublicResolverService)
    expect(service).toBeTruthy()
  })
})
