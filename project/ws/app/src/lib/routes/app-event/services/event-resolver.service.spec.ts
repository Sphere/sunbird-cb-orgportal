import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'

import { EventResolverService } from './event-resolver.service'
import { EventService } from './event.service'

describe('EventResolverService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      EventResolverService,
      EventService,
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  }))

  it('should be created', () => {
    const service: EventResolverService = TestBed.inject(EventResolverService)
    expect(service).toBeTruthy()
  })
})
