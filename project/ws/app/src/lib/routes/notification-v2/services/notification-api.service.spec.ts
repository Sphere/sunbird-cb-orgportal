import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'

import { NotificationApiService } from './notification-api.service'

describe('NotificationApiService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      NotificationApiService,
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  }))

  it('should be created', () => {
    const service: NotificationApiService = TestBed.inject(NotificationApiService)
    expect(service).toBeTruthy()
  })
})
