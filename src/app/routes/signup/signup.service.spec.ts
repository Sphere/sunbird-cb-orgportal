import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'

import { SignupService } from './signup.service'

describe('SignupService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
  }))

  it('should be created', () => {
    const service: SignupService = TestBed.inject(SignupService)
    expect(service).toBeTruthy()
  })
})
