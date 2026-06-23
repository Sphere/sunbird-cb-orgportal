import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'

import { WidgetUserService } from './widget-user.service'

describe('WidgetUserService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
    ],
  }))

  it('should be created', () => {
    const service: WidgetUserService = TestBed.inject(WidgetUserService)
    expect(service).toBeTruthy()
  })
})
