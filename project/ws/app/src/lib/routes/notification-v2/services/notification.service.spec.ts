import { TestBed } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'

import { NotificationService } from './notification.service'

describe('NotificationService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [RouterTestingModule],
    providers: [NotificationService],
  }))

  it('should be created', () => {
    const service: NotificationService = TestBed.inject(NotificationService)
    expect(service).toBeTruthy()
  })
})
