import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'

import { SignupAutoService } from './signup-auto.service'

describe('SignupAutoService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
    providers: [SignupAutoService],
  }))

  it('should be created', () => {
    const service: SignupAutoService = TestBed.inject(SignupAutoService)
    expect(service).toBeTruthy()
  })
})
