import { TestBed } from '@angular/core/testing'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'

import { SignupService } from './signup.service'

describe('SignupService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      SignupService,
      provideHttpClient(withInterceptorsFromDi()),
      provideHttpClientTesting(),
    ],
  }))

  it('should be created', () => {
    const service: SignupService = TestBed.inject(SignupService)
    expect(service).toBeTruthy()
  })
})
