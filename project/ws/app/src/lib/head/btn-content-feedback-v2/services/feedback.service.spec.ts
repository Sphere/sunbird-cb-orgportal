import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'

import { FeedbackService } from './feedback.service'

describe('FeedbackService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  }))

  it('should be created', () => {
    const service: FeedbackService = TestBed.inject(FeedbackService)
    expect(service).toBeTruthy()
  })
})
