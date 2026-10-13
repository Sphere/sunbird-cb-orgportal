import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ConfigurationsService } from '@sunbird-cb/utils'

import { FracService } from './frac.service'

describe('FracService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
    providers: [
      { provide: ConfigurationsService, useValue: { baseUrl: '', instanceConfig: {} } },
    ],
  }))

  it('should be created', () => {
    const service: FracService = TestBed.inject(FracService)
    expect(service).toBeTruthy()
  })
})
