import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'

import { EventResolverService } from './event-resolver.service'
import { EventService } from './event.service'

describe('EventResolverService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
    providers: [EventResolverService, EventService],
  }))

  it('should be created', () => {
    const service: EventResolverService = TestBed.inject(EventResolverService)
    expect(service).toBeTruthy()
  })
})
