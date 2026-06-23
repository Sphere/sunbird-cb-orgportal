import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { of } from 'rxjs'

import { NotificationService } from './notification.service'

describe('NotificationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: Router, useValue: { navigate: jest.fn(), navigateByUrl: jest.fn(), events: of() } },
      ],
    })
  })

  it('should be created', () => {
    const service: NotificationService = TestBed.inject(NotificationService)
    expect(service).toBeTruthy()
  })
})
