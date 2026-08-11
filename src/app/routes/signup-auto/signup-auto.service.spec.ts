import { TestBed } from '@angular/core/testing'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'

import { SignupAutoService } from './signup-auto.service'

describe('SignupAutoService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      SignupAutoService,
      provideHttpClient(withInterceptorsFromDi()),
      provideHttpClientTesting(),
    ],
  }))

  it('should be created', () => {
    const service: SignupAutoService = TestBed.inject(SignupAutoService)
    expect(service).toBeTruthy()
  })
})
