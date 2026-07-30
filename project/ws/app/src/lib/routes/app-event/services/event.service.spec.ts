import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'

import { EventService } from './event.service'

describe('EventService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
    providers: [EventService],
  }))

  it('should be created', () => {
    const service: EventService = TestBed.inject(EventService)
    expect(service).toBeTruthy()
  })
})
