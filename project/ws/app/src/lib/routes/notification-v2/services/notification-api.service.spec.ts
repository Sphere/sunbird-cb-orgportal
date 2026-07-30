import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'

import { NotificationApiService } from './notification-api.service'

describe('NotificationApiService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
    providers: [NotificationApiService],
  }))

  it('should be created', () => {
    const service: NotificationApiService = TestBed.inject(NotificationApiService)
    expect(service).toBeTruthy()
  })
})
